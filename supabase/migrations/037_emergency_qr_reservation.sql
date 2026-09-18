-- A retirada por QR de urgência não coleta CPF/CNH. Mantém o nome informado
-- em uma reserva operacional própria, sem criar um condutor fictício.
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS driver_name TEXT,
  ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.reservations
  ALTER COLUMN driver_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS reservations_emergency_active_vehicle_idx
  ON public.reservations (vehicle_id, start_date DESC)
  WHERE is_emergency = TRUE AND status = 'ACTIVE'::public.reservation_status;

CREATE OR REPLACE FUNCTION public.register_emergency_vehicle_checkout(p_vehicle_id UUID, p_token UUID, p_driver_name TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE vehicle_row public.vehicles%ROWTYPE;
BEGIN
  IF length(trim(COALESCE(p_driver_name, ''))) < 3 THEN RAISE EXCEPTION 'Condutor inválido.'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_vehicle_id::TEXT, 0));
  SELECT * INTO vehicle_row FROM public.vehicles WHERE id = p_vehicle_id AND qr_access_token = p_token AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND OR vehicle_row.status <> 'IN_YARD'::public.vehicle_status THEN RAISE EXCEPTION 'Veículo indisponível.'; END IF;
  PERFORM public.assert_vehicle_travel_allowed(p_vehicle_id);

  INSERT INTO public.reservations (vehicle_id, driver_id, driver_name, start_date, end_date, purpose, status, is_emergency)
  VALUES (p_vehicle_id, NULL, trim(p_driver_name), NOW(), NOW() + INTERVAL '12 hours',
    'Retirada imediata — somente em urgência.', 'ACTIVE'::public.reservation_status, TRUE);

  INSERT INTO public.vehicle_movements(vehicle_id, movement_type, driver_name, odometer, notes, condition_snapshot)
  VALUES (p_vehicle_id, 'CHECKOUT', trim(p_driver_name), COALESCE(vehicle_row.odometer, 0),
    'Retirada imediata — somente em urgência.', jsonb_build_object('emergency', TRUE));
  UPDATE public.vehicles SET status = 'ON_ROUTE'::public.vehicle_status WHERE id = p_vehicle_id;
  INSERT INTO public.fleet_notifications(user_id, title, message, href, vehicle_id)
  SELECT user_id, 'Retirada imediata', format('%s retirou %s em modo de urgência.', trim(p_driver_name), vehicle_row.license_plate),
    '/dashboard/vehicles/' || p_vehicle_id, p_vehicle_id
  FROM public.profiles WHERE role IN ('admin'::public.user_role, 'gestor'::public.user_role);
END;
$$;

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
  UPDATE public.reservations SET status = 'COMPLETED'::public.reservation_status
    WHERE vehicle_id = p_vehicle_id AND is_emergency = TRUE AND status = 'ACTIVE'::public.reservation_status;
  RETURN created_checkin;
END;
$$;

REVOKE ALL ON FUNCTION public.register_emergency_vehicle_checkout(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_emergency_vehicle_checkout(UUID, UUID, TEXT) TO service_role;
REVOKE ALL ON FUNCTION public.register_vehicle_return(UUID, UUID, TEXT, INTEGER, TEXT, TEXT, JSONB, TEXT[], BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_vehicle_return(UUID, UUID, TEXT, INTEGER, TEXT, TEXT, JSONB, TEXT[], BOOLEAN) TO service_role;
