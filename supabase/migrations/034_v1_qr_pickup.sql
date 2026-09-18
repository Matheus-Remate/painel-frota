-- V1: scheduled pickup is authoritative. Apply after 033 before deploying the V1 app.
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS qr_display_settings JSONB NOT NULL
  DEFAULT '{"fuel":true,"odometer":true,"observations":true,"pending":true}'::JSONB;

CREATE OR REPLACE FUNCTION public.register_vehicle_checkout(
  p_vehicle_id UUID, p_token UUID, p_reservation_id UUID, p_driver_name TEXT,
  p_odometer INTEGER, p_fuel_level TEXT, p_notes TEXT, p_has_variation BOOLEAN
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  vehicle_row public.vehicles%ROWTYPE;
  reservation_row public.reservations%ROWTYPE;
  scheduled_driver TEXT;
  changed_driver BOOLEAN;
  changed_odometer BOOLEAN;
  last_fuel TEXT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_vehicle_id::TEXT, 0));
  SELECT * INTO vehicle_row FROM public.vehicles
    WHERE id = p_vehicle_id AND qr_access_token = p_token AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND OR vehicle_row.status <> 'IN_YARD'::public.vehicle_status THEN
    RAISE EXCEPTION 'Veículo indisponível.';
  END IF;
  PERFORM public.assert_vehicle_travel_allowed(p_vehicle_id);
  SELECT * INTO reservation_row FROM public.reservations
    WHERE id = p_reservation_id AND vehicle_id = p_vehicle_id
      AND status = 'ACTIVE'::public.reservation_status
      AND start_date <= NOW() + INTERVAL '2 hours' AND end_date > NOW() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reserva não está na janela de retirada.'; END IF;
  SELECT name INTO scheduled_driver FROM public.drivers WHERE id = reservation_row.driver_id;
  IF scheduled_driver IS NULL OR length(trim(p_driver_name)) < 3 THEN RAISE EXCEPTION 'Condutor inválido.'; END IF;
  IF p_odometer IS NULL OR p_odometer < vehicle_row.odometer THEN RAISE EXCEPTION 'Odômetro inválido.'; END IF;

  changed_driver := trim(p_driver_name) IS DISTINCT FROM scheduled_driver;
  changed_odometer := p_odometer IS DISTINCT FROM vehicle_row.odometer;
  SELECT fuel_level INTO last_fuel FROM public.check_ins WHERE vehicle_id = p_vehicle_id ORDER BY checked_in_at DESC LIMIT 1;
  IF COALESCE(p_fuel_level, '') NOT IN ('', 'EMPTY', '1/4', '1/2', '3/4', 'FULL') THEN RAISE EXCEPTION 'Combustível inválido.'; END IF;
  IF (changed_driver OR changed_odometer OR COALESCE(p_fuel_level, '') IS DISTINCT FROM COALESCE(last_fuel, ''))
    AND NOT COALESCE(p_has_variation, FALSE) THEN
    RAISE EXCEPTION 'A divergência deve ser declarada.';
  END IF;
  IF COALESCE(p_has_variation, FALSE) AND length(trim(COALESCE(p_notes, ''))) < 3 THEN
    RAISE EXCEPTION 'Descreva a divergência para o gestor.';
  END IF;

  INSERT INTO public.vehicle_movements (
    vehicle_id, movement_type, driver_id, driver_name, odometer, fuel_level, notes, condition_snapshot
  ) VALUES (
    p_vehicle_id, 'CHECKOUT', CASE WHEN changed_driver THEN NULL ELSE reservation_row.driver_id END,
    trim(p_driver_name), p_odometer, NULLIF(p_fuel_level, ''), NULLIF(trim(p_notes), ''),
    jsonb_build_object('acknowledged', TRUE, 'reservationId', p_reservation_id,
      'scheduledDriver', scheduled_driver, 'driverChanged', changed_driver,
      'odometerChanged', changed_odometer, 'fuelChanged', COALESCE(p_fuel_level, '') IS DISTINCT FROM COALESCE(last_fuel, ''),
      'declaredVariation', COALESCE(p_has_variation, FALSE))
  );
  UPDATE public.vehicles SET status = 'ON_ROUTE'::public.vehicle_status, odometer = p_odometer
    WHERE id = p_vehicle_id;
  INSERT INTO public.fleet_notifications (recipient_user_id, type, title, message, href, vehicle_id)
  SELECT user_id,
    CASE WHEN COALESCE(p_has_variation, FALSE) THEN 'vehicle_issue' ELSE 'vehicle_checkout' END,
    CASE WHEN COALESCE(p_has_variation, FALSE) THEN 'Divergência na retirada' ELSE 'Veículo retirado' END,
    CASE WHEN COALESCE(p_has_variation, FALSE)
      THEN format('%s retirou %s com divergência: %s', trim(p_driver_name), vehicle_row.license_plate, trim(p_notes))
      ELSE format('%s retirou %s.', trim(p_driver_name), vehicle_row.license_plate) END,
    '/dashboard/vehicles/' || p_vehicle_id, p_vehicle_id
  FROM public.profiles WHERE role IN ('admin'::public.user_role, 'gestor'::public.user_role);
END;
$$;

REVOKE ALL ON FUNCTION public.register_vehicle_checkout(UUID, UUID, UUID, TEXT, INTEGER, TEXT, TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_vehicle_checkout(UUID, UUID, UUID, TEXT, INTEGER, TEXT, TEXT, BOOLEAN) TO service_role;
-- Retire the obsolete path so a service-role caller cannot bypass reservation validation.
DROP FUNCTION IF EXISTS public.register_vehicle_checkout(UUID, UUID, TEXT, INTEGER);
