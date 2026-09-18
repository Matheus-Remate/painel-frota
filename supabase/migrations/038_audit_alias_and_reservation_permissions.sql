ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS nickname TEXT;

CREATE TABLE IF NOT EXISTS public.change_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_user_id UUID REFERENCES auth.users(id),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  before_data JSONB,
  after_data JSONB
);
CREATE INDEX IF NOT EXISTS change_audit_log_entity_idx ON public.change_audit_log(entity_type, entity_id, occurred_at DESC);
ALTER TABLE public.change_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read change audit" ON public.change_audit_log;
CREATE POLICY "Admins read change audit" ON public.change_audit_log FOR SELECT TO authenticated USING (public.get_user_role() = 'admin');
GRANT SELECT ON public.change_audit_log TO authenticated;

CREATE OR REPLACE FUNCTION public.audit_row_change() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.change_audit_log(actor_user_id, entity_type, entity_id, action, before_data, after_data)
  VALUES (auth.uid(), TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), TG_OP,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END);
  RETURN COALESCE(NEW, OLD);
END;
$$;
DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY['vehicles','reservations','vehicle_requests','vehicle_movements','check_ins'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%I ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.audit_row_change()', t, t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.update_reservation_for_pickup(
  p_reservation_id UUID, p_driver_id UUID, p_start_date TIMESTAMPTZ, p_end_date TIMESTAMPTZ, p_purpose TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE booking public.reservations%ROWTYPE; role_name public.user_role;
BEGIN
  SELECT role INTO role_name FROM public.profiles WHERE user_id = auth.uid();
  IF role_name NOT IN ('admin'::public.user_role, 'gestor'::public.user_role) THEN RAISE EXCEPTION 'Sem permissão.'; END IF;
  SELECT * INTO booking FROM public.reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND OR booking.status <> 'ACTIVE'::public.reservation_status THEN RAISE EXCEPTION 'Reserva não está ativa.'; END IF;
  IF role_name = 'gestor'::public.user_role AND booking.end_date < NOW() THEN RAISE EXCEPTION 'Gestor não pode editar evento já encerrado.'; END IF;
  IF p_start_date >= p_end_date OR NOT EXISTS (SELECT 1 FROM public.drivers WHERE id = p_driver_id) THEN RAISE EXCEPTION 'Dados da reserva inválidos.'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(booking.vehicle_id::TEXT, 0)); PERFORM public.assert_vehicle_travel_allowed(booking.vehicle_id);
  IF EXISTS (SELECT 1 FROM public.reservations WHERE vehicle_id = booking.vehicle_id AND id <> booking.id AND status <> 'CANCELLED'::public.reservation_status AND start_date < p_end_date AND end_date > p_start_date) THEN RAISE EXCEPTION 'Conflito com outra reserva.'; END IF;
  UPDATE public.reservations SET driver_id = p_driver_id, start_date = p_start_date, end_date = p_end_date, purpose = trim(p_purpose) WHERE id = p_reservation_id;
END;
$$;
REVOKE ALL ON FUNCTION public.update_reservation_for_pickup(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_reservation_for_pickup(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO authenticated;
