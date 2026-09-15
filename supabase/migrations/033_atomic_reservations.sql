-- Prevent two managers from assigning the same vehicle for overlapping periods.
CREATE OR REPLACE FUNCTION public.approve_vehicle_request_atomic(p_request_id UUID, p_vehicle_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_profile UUID;
  requested public.vehicle_requests%ROWTYPE;
BEGIN
  SELECT id INTO actor_profile FROM public.profiles
  WHERE user_id = auth.uid() AND role IN ('admin'::public.user_role, 'gestor'::public.user_role);
  IF actor_profile IS NULL THEN RAISE EXCEPTION 'Sem permissão.'; END IF;

  SELECT * INTO requested FROM public.vehicle_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND OR requested.status <> 'PENDING'::public.request_status THEN
    RAISE EXCEPTION 'Solicitação não está pendente.';
  END IF;
  IF requested.driver_id IS NULL THEN RAISE EXCEPTION 'A solicitação não possui condutor vinculado.'; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_vehicle_id::TEXT, 0));
  IF NOT EXISTS (SELECT 1 FROM public.vehicles WHERE id = p_vehicle_id AND deleted_at IS NULL AND status NOT IN ('AWAITING_REPAIR', 'IN_MAINTENANCE')) THEN
    RAISE EXCEPTION 'Veículo indisponível.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.reservations WHERE vehicle_id = p_vehicle_id AND status <> 'CANCELLED'::public.reservation_status
      AND start_date < requested.return_datetime AND end_date > requested.pickup_datetime
  ) THEN RAISE EXCEPTION 'Veículo já reservado neste período.'; END IF;

  INSERT INTO public.reservations (vehicle_id, driver_id, start_date, end_date, purpose, status)
  VALUES (p_vehicle_id, requested.driver_id, requested.pickup_datetime, requested.return_datetime,
          requested.event_name || ' - Condutor: ' || requested.driver_name, 'ACTIVE'::public.reservation_status);
  UPDATE public.vehicle_requests SET status = 'APPROVED'::public.request_status, vehicle_id = p_vehicle_id, approved_by = actor_profile
  WHERE id = p_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_reservation_atomic(
  p_vehicle_id UUID, p_driver_id UUID, p_start_date TIMESTAMPTZ, p_end_date TIMESTAMPTZ, p_purpose TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.get_user_role() NOT IN ('admin'::public.user_role, 'gestor'::public.user_role) THEN RAISE EXCEPTION 'Sem permissão.'; END IF;
  IF p_start_date >= p_end_date THEN RAISE EXCEPTION 'Período inválido.'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_vehicle_id::TEXT, 0));
  IF EXISTS (
    SELECT 1 FROM public.reservations WHERE vehicle_id = p_vehicle_id AND status <> 'CANCELLED'::public.reservation_status
      AND start_date < p_end_date AND end_date > p_start_date
  ) THEN RAISE EXCEPTION 'Veículo já reservado neste período.'; END IF;
  INSERT INTO public.reservations (vehicle_id, driver_id, start_date, end_date, purpose, status)
  VALUES (p_vehicle_id, p_driver_id, p_start_date, p_end_date, p_purpose, 'ACTIVE'::public.reservation_status);
END;
$$;

REVOKE ALL ON FUNCTION public.approve_vehicle_request_atomic(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_reservation_atomic(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_vehicle_request_atomic(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_reservation_atomic(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.register_vehicle_checkout(
  p_vehicle_id UUID, p_token UUID, p_driver_name TEXT, p_odometer INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE plate TEXT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_vehicle_id::TEXT, 0));
  SELECT license_plate INTO plate FROM public.vehicles
  WHERE id = p_vehicle_id AND qr_access_token = p_token AND deleted_at IS NULL
    AND status = 'IN_YARD'::public.vehicle_status AND odometer <= p_odometer;
  IF plate IS NULL THEN RAISE EXCEPTION 'Veículo indisponível ou dados inválidos.'; END IF;
  IF length(trim(p_driver_name)) < 3 THEN RAISE EXCEPTION 'Condutor inválido.'; END IF;

  INSERT INTO public.vehicle_movements (vehicle_id, movement_type, driver_name, odometer, notes, condition_snapshot)
  VALUES (p_vehicle_id, 'CHECKOUT', trim(p_driver_name), p_odometer,
          'Condições da última devolução conferidas pelo condutor.', '{"acknowledgedLastReturn":true}'::JSONB);
  UPDATE public.vehicles SET status = 'ON_ROUTE'::public.vehicle_status, odometer = p_odometer WHERE id = p_vehicle_id;
  INSERT INTO public.fleet_notifications (recipient_user_id, type, title, message, href, vehicle_id)
  SELECT user_id, 'vehicle_checkout', 'Veículo retirado', trim(p_driver_name) || ' retirou ' || plate || '.',
         '/dashboard/vehicles/' || p_vehicle_id, p_vehicle_id
  FROM public.profiles WHERE role IN ('admin'::public.user_role, 'gestor'::public.user_role);
END;
$$;

CREATE OR REPLACE FUNCTION public.register_vehicle_return(
  p_vehicle_id UUID, p_token UUID, p_driver_name TEXT, p_odometer INTEGER, p_fuel_level TEXT,
  p_notes TEXT, p_checklist JSONB, p_photo_paths TEXT[], p_has_issues BOOLEAN
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE created_checkin UUID;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_vehicle_id::TEXT, 0));
  IF NOT EXISTS (
    SELECT 1 FROM public.vehicles WHERE id = p_vehicle_id AND qr_access_token = p_token AND deleted_at IS NULL
      AND status = 'ON_ROUTE'::public.vehicle_status AND odometer <= p_odometer
  ) THEN RAISE EXCEPTION 'Veículo sem retirada ativa ou dados inválidos.'; END IF;

  INSERT INTO public.check_ins (
    vehicle_id, driver_id, driver_name, odometer, cleanliness_status, tires_exterior_status,
    dash_lights_status, repair_notes, return_notes, fuel_level, photos, photo_paths, checklist, has_issues, checked_in_at
  ) VALUES (
    p_vehicle_id, NULL, trim(p_driver_name), p_odometer,
    CASE WHEN p_checklist->'limpeza'->>'status' = 'OK' THEN 'OK'::public.check_status ELSE 'ALERT'::public.check_status END,
    CASE WHEN p_checklist->'pneus'->>'status' = 'OK' THEN 'OK'::public.check_status ELSE 'ALERT'::public.check_status END,
    'OK'::public.check_status, NULLIF(trim(p_notes), ''), NULLIF(trim(p_notes), ''), p_fuel_level,
    '{}'::TEXT[], COALESCE(p_photo_paths, '{}'::TEXT[]), p_checklist, p_has_issues, NOW()
  ) RETURNING id INTO created_checkin;

  INSERT INTO public.vehicle_movements (
    vehicle_id, movement_type, driver_name, odometer, fuel_level, notes, condition_snapshot, check_in_id
  ) VALUES (
    p_vehicle_id, 'RETURN', trim(p_driver_name), p_odometer, p_fuel_level,
    NULLIF(trim(p_notes), ''), p_checklist, created_checkin
  );
  RETURN created_checkin;
END;
$$;

REVOKE ALL ON FUNCTION public.register_vehicle_checkout(UUID, UUID, TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.register_vehicle_return(UUID, UUID, TEXT, INTEGER, TEXT, TEXT, JSONB, TEXT[], BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_vehicle_checkout(UUID, UUID, TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.register_vehicle_return(UUID, UUID, TEXT, INTEGER, TEXT, TEXT, JSONB, TEXT[], BOOLEAN) TO service_role;
