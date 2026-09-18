-- V1: attention levels are separate from repair workflow; never cancel a future reservation silently.
ALTER TABLE public.check_ins ADD COLUMN IF NOT EXISTS alert_level TEXT
  CHECK (alert_level IN ('URGENT', 'HIGH', 'MEDIUM', 'LOW'));
ALTER TABLE public.occurrences ADD COLUMN IF NOT EXISTS alert_level TEXT NOT NULL DEFAULT 'MEDIUM'
  CHECK (alert_level IN ('URGENT', 'HIGH', 'MEDIUM', 'LOW'));
UPDATE public.check_ins SET alert_level = 'HIGH'
  WHERE has_issues AND NOT COALESCE(resolved, FALSE) AND alert_level IS NULL;

DROP POLICY IF EXISTS "Check-ins: viewable by authenticated users" ON public.check_ins;
DROP POLICY IF EXISTS "Photos: viewable by authenticated users" ON public.photos;

CREATE TABLE IF NOT EXISTS public.vehicle_alert_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_in_id UUID NOT NULL REFERENCES public.check_ins(id),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  manager_user_id UUID NOT NULL REFERENCES auth.users(id),
  previous_level TEXT CHECK (previous_level IN ('URGENT', 'HIGH', 'MEDIUM', 'LOW')),
  new_level TEXT NOT NULL CHECK (new_level IN ('URGENT', 'HIGH', 'MEDIUM', 'LOW')),
  reason TEXT NOT NULL,
  declaration TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.vehicle_alert_declarations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers read alert declarations" ON public.vehicle_alert_declarations
  FOR SELECT TO authenticated USING (public.get_user_role() IN ('admin', 'gestor'));
GRANT SELECT ON public.vehicle_alert_declarations TO authenticated;

CREATE TABLE IF NOT EXISTS public.occurrence_alert_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurrence_id UUID NOT NULL REFERENCES public.occurrences(id),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  manager_user_id UUID NOT NULL REFERENCES auth.users(id),
  previous_level TEXT NOT NULL,
  new_level TEXT NOT NULL,
  reason TEXT NOT NULL,
  declaration TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.occurrence_alert_declarations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers read occurrence declarations" ON public.occurrence_alert_declarations
  FOR SELECT TO authenticated USING (public.get_user_role() IN ('admin', 'gestor'));
GRANT SELECT ON public.occurrence_alert_declarations TO authenticated;

CREATE OR REPLACE FUNCTION public.process_check_in()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE checklist_has_issue BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM jsonb_each(COALESCE(NEW.checklist, '{}'::JSONB)) AS item
    WHERE item.key <> 'driver_name' AND COALESCE(item.value->>'status', 'OK') <> 'OK'
  ) INTO checklist_has_issue;
  NEW.has_issues := COALESCE(NEW.has_issues, FALSE) OR checklist_has_issue
    OR NEW.cleanliness_status IN ('ALERT', 'DAMAGE')
    OR NEW.dash_lights_status IN ('ALERT', 'DAMAGE')
    OR NEW.tires_exterior_status IN ('ALERT', 'DAMAGE');
  IF NEW.has_issues AND NEW.alert_level IS NULL THEN
    SELECT CASE
      WHEN EXISTS (SELECT 1 FROM jsonb_each(COALESCE(NEW.checklist, '{}'::JSONB)) AS item WHERE item.value->>'severity' = 'URGENT') THEN 'URGENT'
      WHEN EXISTS (SELECT 1 FROM jsonb_each(COALESCE(NEW.checklist, '{}'::JSONB)) AS item WHERE item.value->>'severity' = 'HIGH') THEN 'HIGH'
      WHEN EXISTS (SELECT 1 FROM jsonb_each(COALESCE(NEW.checklist, '{}'::JSONB)) AS item WHERE item.value->>'severity' = 'MEDIUM') THEN 'MEDIUM'
      WHEN EXISTS (SELECT 1 FROM jsonb_each(COALESCE(NEW.checklist, '{}'::JSONB)) AS item WHERE item.value->>'severity' = 'LOW') THEN 'LOW'
      ELSE 'HIGH' END INTO NEW.alert_level;
  END IF;
  UPDATE public.vehicles SET
    odometer = GREATEST(COALESCE(odometer, 0), NEW.odometer),
    status = CASE WHEN (NEW.has_issues AND NEW.alert_level IN ('URGENT', 'HIGH'))
      OR EXISTS (SELECT 1 FROM public.occurrences WHERE vehicle_id = NEW.vehicle_id
        AND status <> 'RESOLVED' AND alert_level IN ('URGENT', 'HIGH'))
      THEN 'AWAITING_REPAIR'::public.vehicle_status ELSE 'IN_YARD'::public.vehicle_status END
  WHERE id = NEW.vehicle_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_checkin_alert_level(
  p_check_in_id UUID, p_level TEXT, p_reason TEXT, p_declaration TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE item public.check_ins%ROWTYPE;
  plate TEXT;
  manager_name TEXT;
  statement TEXT;
BEGIN
  IF public.get_user_role() NOT IN ('admin'::public.user_role, 'gestor'::public.user_role) THEN RAISE EXCEPTION 'Sem permissão.'; END IF;
  IF p_level NOT IN ('URGENT', 'HIGH', 'MEDIUM', 'LOW') OR length(trim(p_reason)) < 10 THEN RAISE EXCEPTION 'Nível ou justificativa inválida.'; END IF;
  SELECT * INTO item FROM public.check_ins WHERE id = p_check_in_id AND has_issues AND NOT COALESCE(resolved, FALSE) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pendência não encontrada.'; END IF;
  SELECT license_plate INTO plate FROM public.vehicles WHERE id = item.vehicle_id;
  SELECT trim(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) INTO manager_name
    FROM public.profiles WHERE user_id = auth.uid();
  statement := format('%s declara que o veículo %s, mesmo com a pendência %s, está apto a rodar. Está ciente de que o veículo poderá sair para viagem e de que esta declaração será considerada na análise de qualquer dano.', manager_name, plate, COALESCE(item.return_notes, 'registrada'));
  IF item.alert_level IN ('URGENT', 'HIGH') AND p_level IN ('MEDIUM', 'LOW') THEN
    IF p_declaration IS DISTINCT FROM 'CONFIRMO' THEN
      RAISE EXCEPTION 'Confirmação de responsabilidade obrigatória.';
    END IF;
  END IF;
  UPDATE public.check_ins SET alert_level = p_level WHERE id = p_check_in_id;
  INSERT INTO public.vehicle_alert_declarations (check_in_id, vehicle_id, manager_user_id, previous_level, new_level, reason, declaration)
    VALUES (p_check_in_id, item.vehicle_id, auth.uid(), item.alert_level, p_level, trim(p_reason),
      CASE WHEN p_declaration = 'CONFIRMO' THEN statement ELSE format('%s alterou a classificação de %s para %s.', manager_name, item.alert_level, p_level) END);
  IF p_level IN ('URGENT', 'HIGH') THEN
    UPDATE public.vehicles SET status = 'AWAITING_REPAIR'::public.vehicle_status
      WHERE id = item.vehicle_id AND status = 'IN_YARD'::public.vehicle_status;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.check_ins WHERE vehicle_id = item.vehicle_id AND has_issues
    AND NOT COALESCE(resolved, FALSE) AND alert_level IN ('URGENT', 'HIGH'))
    AND NOT EXISTS (SELECT 1 FROM public.occurrences WHERE vehicle_id = item.vehicle_id
      AND status <> 'RESOLVED' AND alert_level IN ('URGENT', 'HIGH')) THEN
    UPDATE public.vehicles SET status = 'IN_YARD'::public.vehicle_status
      WHERE id = item.vehicle_id AND status = 'AWAITING_REPAIR'::public.vehicle_status;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.set_checkin_alert_level(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_checkin_alert_level(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- The transaction boundary must enforce the same travel rule as the QR screen.
CREATE OR REPLACE FUNCTION public.assert_vehicle_travel_allowed(p_vehicle_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.check_ins WHERE vehicle_id = p_vehicle_id AND has_issues
    AND NOT COALESCE(resolved, FALSE) AND COALESCE(alert_level, 'HIGH') IN ('URGENT', 'HIGH'))
    OR EXISTS (SELECT 1 FROM public.occurrences WHERE vehicle_id = p_vehicle_id
      AND status <> 'RESOLVED' AND alert_level IN ('URGENT', 'HIGH')) THEN
    RAISE EXCEPTION 'Veículo com alerta impeditivo; procure o gestor.';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.assert_vehicle_travel_allowed(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assert_vehicle_travel_allowed(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.guard_reservation_alerts()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'ACTIVE'::public.reservation_status THEN
    PERFORM public.assert_vehicle_travel_allowed(NEW.vehicle_id);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_reservation_alerts ON public.reservations;
CREATE TRIGGER guard_reservation_alerts BEFORE INSERT OR UPDATE OF vehicle_id, status, start_date, end_date ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.guard_reservation_alerts();

CREATE OR REPLACE FUNCTION public.sync_occurrence_alert_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.alert_level IN ('URGENT', 'HIGH')
      AND NEW.alert_level IN ('MEDIUM', 'LOW') AND NEW.status <> 'RESOLVED'
      AND COALESCE(current_setting('app.confirmed_occurrence_release', TRUE), '') <> 'CONFIRMED' THEN
      RAISE EXCEPTION 'Reclassificação exige declaração do gestor.';
    END IF;
  END IF;
  IF NEW.status <> 'RESOLVED' AND NEW.alert_level IN ('URGENT', 'HIGH') THEN
    UPDATE public.vehicles SET status = 'AWAITING_REPAIR'::public.vehicle_status
      WHERE id = NEW.vehicle_id AND status = 'IN_YARD'::public.vehicle_status;
  ELSIF NOT EXISTS (SELECT 1 FROM public.occurrences WHERE vehicle_id = NEW.vehicle_id
    AND id <> NEW.id AND status <> 'RESOLVED' AND alert_level IN ('URGENT', 'HIGH'))
    AND NOT EXISTS (SELECT 1 FROM public.check_ins WHERE vehicle_id = NEW.vehicle_id
      AND has_issues AND NOT COALESCE(resolved, FALSE) AND alert_level IN ('URGENT', 'HIGH')) THEN
    UPDATE public.vehicles SET status = 'IN_YARD'::public.vehicle_status
      WHERE id = NEW.vehicle_id AND status = 'AWAITING_REPAIR'::public.vehicle_status;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS sync_occurrence_alert_status ON public.occurrences;
CREATE TRIGGER sync_occurrence_alert_status AFTER INSERT OR UPDATE OF alert_level, status ON public.occurrences
  FOR EACH ROW EXECUTE FUNCTION public.sync_occurrence_alert_status();

CREATE OR REPLACE FUNCTION public.set_occurrence_alert_level(
  p_occurrence_id UUID, p_level TEXT, p_reason TEXT, p_confirmed BOOLEAN
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  item public.occurrences%ROWTYPE;
  plate TEXT;
  manager_name TEXT;
  statement TEXT;
BEGIN
  IF public.get_user_role() NOT IN ('admin'::public.user_role, 'gestor'::public.user_role) THEN RAISE EXCEPTION 'Sem permissão.'; END IF;
  IF p_level NOT IN ('URGENT', 'HIGH', 'MEDIUM', 'LOW') OR length(trim(p_reason)) < 10 THEN RAISE EXCEPTION 'Nível ou justificativa inválida.'; END IF;
  SELECT * INTO item FROM public.occurrences WHERE id = p_occurrence_id AND status <> 'RESOLVED' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ocorrência não encontrada.'; END IF;
  SELECT license_plate INTO plate FROM public.vehicles WHERE id = item.vehicle_id;
  SELECT trim(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) INTO manager_name FROM public.profiles WHERE user_id = auth.uid();
  statement := format('%s declara que o veículo %s, mesmo com a pendência %s, está apto a rodar. Está ciente de que o veículo poderá sair para viagem e de que esta declaração será considerada na análise de qualquer dano.', manager_name, plate, item.description);
  IF item.alert_level IN ('URGENT', 'HIGH') AND p_level IN ('MEDIUM', 'LOW') THEN
    IF NOT COALESCE(p_confirmed, FALSE) THEN RAISE EXCEPTION 'Confirmação de responsabilidade obrigatória.'; END IF;
    PERFORM set_config('app.confirmed_occurrence_release', 'CONFIRMED', TRUE);
  END IF;
  UPDATE public.occurrences SET alert_level = p_level WHERE id = p_occurrence_id;
  INSERT INTO public.occurrence_alert_declarations (occurrence_id, vehicle_id, manager_user_id, previous_level, new_level, reason, declaration)
    VALUES (item.id, item.vehicle_id, auth.uid(), item.alert_level, p_level, trim(p_reason),
      CASE WHEN p_confirmed THEN statement ELSE format('%s alterou a classificação de %s para %s.', manager_name, item.alert_level, p_level) END);
END;
$$;
REVOKE ALL ON FUNCTION public.set_occurrence_alert_level(UUID, TEXT, TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_occurrence_alert_level(UUID, TEXT, TEXT, BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_reservation_for_pickup(
  p_reservation_id UUID, p_driver_id UUID, p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ, p_purpose TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE booking public.reservations%ROWTYPE;
BEGIN
  IF public.get_user_role() NOT IN ('admin'::public.user_role, 'gestor'::public.user_role) THEN RAISE EXCEPTION 'Sem permissão.'; END IF;
  SELECT * INTO booking FROM public.reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND OR booking.status <> 'ACTIVE'::public.reservation_status THEN RAISE EXCEPTION 'Reserva não está ativa.'; END IF;
  IF p_start_date >= p_end_date THEN RAISE EXCEPTION 'Período inválido.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.drivers WHERE id = p_driver_id) THEN RAISE EXCEPTION 'Condutor inválido.'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(booking.vehicle_id::TEXT, 0));
  -- Defende também a RPC: uma reserva ativa não pode ser alterada enquanto há alerta impeditivo.
  PERFORM public.assert_vehicle_travel_allowed(booking.vehicle_id);
  IF EXISTS (SELECT 1 FROM public.reservations WHERE vehicle_id = booking.vehicle_id
    AND id <> booking.id AND status <> 'CANCELLED'::public.reservation_status
    AND start_date < p_end_date AND end_date > p_start_date) THEN
    RAISE EXCEPTION 'Conflito com outra reserva.';
  END IF;
  UPDATE public.reservations SET driver_id = p_driver_id, start_date = p_start_date,
    end_date = p_end_date, purpose = trim(p_purpose) WHERE id = p_reservation_id;
END;
$$;
REVOKE ALL ON FUNCTION public.update_reservation_for_pickup(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_reservation_for_pickup(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO authenticated;

CREATE TABLE IF NOT EXISTS public.checkin_data_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_in_id UUID NOT NULL REFERENCES public.check_ins(id),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  manager_user_id UUID NOT NULL REFERENCES auth.users(id),
  previous_odometer INTEGER NOT NULL,
  corrected_odometer INTEGER NOT NULL,
  previous_fuel TEXT,
  corrected_fuel TEXT,
  previous_notes TEXT,
  corrected_notes TEXT,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.checkin_data_corrections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers read checkin corrections" ON public.checkin_data_corrections
  FOR SELECT TO authenticated USING (public.get_user_role() IN ('admin', 'gestor'));
GRANT SELECT ON public.checkin_data_corrections TO authenticated;

CREATE OR REPLACE FUNCTION public.correct_checkin_data(
  p_check_in_id UUID, p_odometer INTEGER, p_fuel TEXT, p_notes TEXT, p_reason TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE item public.check_ins%ROWTYPE;
BEGIN
  IF public.get_user_role() NOT IN ('admin'::public.user_role, 'gestor'::public.user_role) THEN RAISE EXCEPTION 'Sem permissão.'; END IF;
  IF p_odometer IS NULL OR p_odometer < 0 OR p_fuel IS NULL OR p_fuel NOT IN ('EMPTY', '1/4', '1/2', '3/4', 'FULL')
    OR length(trim(COALESCE(p_reason, ''))) < 10 THEN RAISE EXCEPTION 'Dados ou justificativa inválidos.'; END IF;
  SELECT * INTO item FROM public.check_ins WHERE id = p_check_in_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Devolução não encontrada.'; END IF;
  IF EXISTS (SELECT 1 FROM public.check_ins WHERE vehicle_id = item.vehicle_id AND checked_in_at > item.checked_in_at) THEN
    RAISE EXCEPTION 'Corrija somente a última devolução; registros antigos exigem análise administrativa.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.vehicle_movements WHERE vehicle_id = item.vehicle_id
    AND created_at > item.checked_in_at AND movement_type = 'CHECKOUT') THEN
    RAISE EXCEPTION 'Já houve nova retirada. Não é seguro alterar o odômetro desta devolução.';
  END IF;
  IF p_odometer < COALESCE((SELECT odometer FROM public.vehicle_movements
    WHERE vehicle_id = item.vehicle_id AND movement_type = 'CHECKOUT'
      AND created_at <= item.checked_in_at ORDER BY created_at DESC LIMIT 1), 0) THEN
    RAISE EXCEPTION 'Odômetro corrigido não pode ser menor que o da retirada.';
  END IF;
  INSERT INTO public.checkin_data_corrections (
    check_in_id, vehicle_id, manager_user_id, previous_odometer, corrected_odometer,
    previous_fuel, corrected_fuel, previous_notes, corrected_notes, reason
  ) VALUES (
    item.id, item.vehicle_id, auth.uid(), item.odometer, p_odometer,
    item.fuel_level, p_fuel, item.return_notes, NULLIF(trim(p_notes), ''), trim(p_reason)
  );
  UPDATE public.check_ins SET odometer = p_odometer, fuel_level = p_fuel,
    return_notes = NULLIF(trim(p_notes), '') WHERE id = p_check_in_id;
  UPDATE public.vehicles SET odometer = p_odometer WHERE id = item.vehicle_id
    AND status IN ('IN_YARD'::public.vehicle_status, 'AWAITING_REPAIR'::public.vehicle_status);
END;
$$;
REVOKE ALL ON FUNCTION public.correct_checkin_data(UUID, INTEGER, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.correct_checkin_data(UUID, INTEGER, TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.register_vehicle_return(
  p_vehicle_id UUID, p_token UUID, p_driver_name TEXT, p_odometer INTEGER, p_fuel_level TEXT,
  p_notes TEXT, p_checklist JSONB, p_photo_paths TEXT[], p_has_issues BOOLEAN
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  created_checkin UUID;
  checkout_driver_id UUID;
  checkout_driver_name TEXT;
  attributed_driver_id UUID;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_vehicle_id::TEXT, 0));
  IF NOT EXISTS (SELECT 1 FROM public.vehicles WHERE id = p_vehicle_id AND qr_access_token = p_token
    AND deleted_at IS NULL AND status = 'ON_ROUTE'::public.vehicle_status AND odometer <= p_odometer) THEN
    RAISE EXCEPTION 'Veículo sem retirada ativa ou dados inválidos.';
  END IF;
  SELECT driver_id, driver_name INTO checkout_driver_id, checkout_driver_name
    FROM public.vehicle_movements WHERE vehicle_id = p_vehicle_id AND movement_type = 'CHECKOUT'
    ORDER BY created_at DESC LIMIT 1;
  IF length(trim(p_driver_name)) < 3 THEN RAISE EXCEPTION 'Condutor inválido.'; END IF;
  attributed_driver_id := CASE WHEN trim(p_driver_name) = checkout_driver_name THEN checkout_driver_id ELSE NULL END;

  INSERT INTO public.check_ins (
    vehicle_id, driver_id, driver_name, odometer, cleanliness_status, tires_exterior_status,
    dash_lights_status, repair_notes, return_notes, fuel_level, photos, photo_paths, checklist, has_issues, checked_in_at
  ) VALUES (
    p_vehicle_id, attributed_driver_id, trim(p_driver_name), p_odometer,
    CASE WHEN p_checklist->'limpeza'->>'status' = 'OK' THEN 'OK'::public.check_status ELSE 'ALERT'::public.check_status END,
    CASE WHEN p_checklist->'pneus'->>'status' = 'OK' THEN 'OK'::public.check_status ELSE 'ALERT'::public.check_status END,
    'OK'::public.check_status, NULLIF(trim(p_notes), ''), NULLIF(trim(p_notes), ''), p_fuel_level,
    '{}'::TEXT[], COALESCE(p_photo_paths, '{}'::TEXT[]), p_checklist, p_has_issues, NOW()
  ) RETURNING id INTO created_checkin;
  INSERT INTO public.vehicle_movements (
    vehicle_id, movement_type, driver_id, driver_name, odometer, fuel_level, notes, condition_snapshot, check_in_id
  ) VALUES (
    p_vehicle_id, 'RETURN', attributed_driver_id, trim(p_driver_name), p_odometer, p_fuel_level,
    NULLIF(trim(p_notes), ''), p_checklist, created_checkin
  );
  RETURN created_checkin;
END;
$$;
