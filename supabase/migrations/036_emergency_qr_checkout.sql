CREATE OR REPLACE FUNCTION public.register_emergency_vehicle_checkout(p_vehicle_id UUID, p_token UUID, p_driver_name TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE vehicle_row public.vehicles%ROWTYPE;
BEGIN
  IF length(trim(COALESCE(p_driver_name, ''))) < 3 THEN RAISE EXCEPTION 'Condutor inválido.'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_vehicle_id::TEXT, 0));
  SELECT * INTO vehicle_row FROM public.vehicles WHERE id = p_vehicle_id AND qr_access_token = p_token AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND OR vehicle_row.status <> 'IN_YARD'::public.vehicle_status THEN RAISE EXCEPTION 'Veículo indisponível.'; END IF;
  PERFORM public.assert_vehicle_travel_allowed(p_vehicle_id);
  INSERT INTO public.vehicle_movements(vehicle_id, movement_type, driver_name, odometer, notes, condition_snapshot) VALUES (p_vehicle_id, 'CHECKOUT', trim(p_driver_name), COALESCE(vehicle_row.odometer, 0), 'Retirada imediata — somente em urgência.', jsonb_build_object('emergency', TRUE));
  UPDATE public.vehicles SET status = 'ON_ROUTE'::public.vehicle_status WHERE id = p_vehicle_id;
  INSERT INTO public.fleet_notifications(user_id, title, message, href, vehicle_id) SELECT user_id, 'Retirada imediata', format('%s retirou %s em modo de urgência.', trim(p_driver_name), vehicle_row.license_plate), '/dashboard/vehicles/' || p_vehicle_id, p_vehicle_id FROM public.profiles WHERE role IN ('admin'::public.user_role, 'gestor'::public.user_role);
END;
$$;
REVOKE ALL ON FUNCTION public.register_emergency_vehicle_checkout(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_emergency_vehicle_checkout(UUID, UUID, TEXT) TO service_role;
