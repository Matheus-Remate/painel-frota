-- Secure the public QR flow and preserve a complete custody history for every vehicle.
-- This migration is additive/idempotent and does not delete operational records.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS qr_access_token UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS odometer INTEGER NOT NULL DEFAULT 0 CHECK (odometer >= 0);

CREATE UNIQUE INDEX IF NOT EXISTS vehicles_qr_access_token_key
  ON public.vehicles(qr_access_token);

ALTER TABLE public.check_ins
  ADD COLUMN IF NOT EXISTS driver_name TEXT,
  ADD COLUMN IF NOT EXISTS return_notes TEXT,
  ADD COLUMN IF NOT EXISTS photo_paths TEXT[] NOT NULL DEFAULT '{}'::TEXT[];

CREATE TABLE IF NOT EXISTS public.vehicle_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('CHECKOUT', 'RETURN')),
  driver_id UUID REFERENCES public.drivers(id),
  driver_name TEXT NOT NULL,
  odometer INTEGER NOT NULL CHECK (odometer >= 0),
  fuel_level TEXT,
  notes TEXT,
  condition_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,
  check_in_id UUID REFERENCES public.check_ins(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vehicle_movements_vehicle_created_idx
  ON public.vehicle_movements(vehicle_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.fleet_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('vehicle_returned', 'vehicle_issue', 'vehicle_checkout')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  href TEXT NOT NULL DEFAULT '/dashboard',
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  check_in_id UUID REFERENCES public.check_ins(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fleet_notifications_recipient_created_idx
  ON public.fleet_notifications(recipient_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS fleet_notifications_unread_idx
  ON public.fleet_notifications(recipient_user_id, read_at)
  WHERE read_at IS NULL;

CREATE OR REPLACE FUNCTION public.process_check_in()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  checklist_has_issue BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM jsonb_each(COALESCE(NEW.checklist, '{}'::JSONB)) AS item
    WHERE item.key <> 'driver_name'
      AND COALESCE(item.value->>'status', 'OK') <> 'OK'
  ) INTO checklist_has_issue;

  NEW.has_issues := COALESCE(NEW.has_issues, FALSE)
    OR checklist_has_issue
    OR NEW.cleanliness_status IN ('ALERT', 'DAMAGE')
    OR NEW.dash_lights_status IN ('ALERT', 'DAMAGE')
    OR NEW.tires_exterior_status IN ('ALERT', 'DAMAGE');

  UPDATE public.vehicles
  SET
    odometer = GREATEST(COALESCE(odometer, 0), NEW.odometer),
    status = CASE WHEN NEW.has_issues THEN 'AWAITING_REPAIR'::public.vehicle_status
                  ELSE 'IN_YARD'::public.vehicle_status END
  WHERE id = NEW.vehicle_id;

  IF NEW.has_issues THEN
    UPDATE public.reservations
    SET status = 'CANCELLED'::public.reservation_status
    WHERE vehicle_id = NEW.vehicle_id
      AND start_date >= NOW()
      AND status = 'ACTIVE'::public.reservation_status;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_managers_of_return()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plate TEXT;
BEGIN
  SELECT license_plate INTO plate FROM public.vehicles WHERE id = NEW.vehicle_id;

  INSERT INTO public.fleet_notifications (
    recipient_user_id, type, title, message, href, vehicle_id, check_in_id
  )
  SELECT
    profile.user_id,
    CASE WHEN NEW.has_issues THEN 'vehicle_issue' ELSE 'vehicle_returned' END,
    CASE WHEN NEW.has_issues THEN 'Veículo devolvido com alerta' ELSE 'Veículo devolvido' END,
    CASE WHEN NEW.has_issues
      THEN format('%s devolveu %s com item marcado para revisão.', COALESCE(NEW.driver_name, 'Um condutor'), plate)
      ELSE format('%s devolveu %s sem novos alertas.', COALESCE(NEW.driver_name, 'Um condutor'), plate)
    END,
    '/dashboard/checkins',
    NEW.vehicle_id,
    NEW.id
  FROM public.profiles AS profile
  WHERE profile.role IN ('admin'::public.user_role, 'gestor'::public.user_role);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_managers_after_checkin ON public.check_ins;
CREATE TRIGGER notify_managers_after_checkin
  AFTER INSERT ON public.check_ins
  FOR EACH ROW EXECUTE FUNCTION public.notify_managers_of_return();

ALTER TABLE public.vehicle_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers read vehicle movements" ON public.vehicle_movements;
CREATE POLICY "Managers read vehicle movements"
  ON public.vehicle_movements FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('admin', 'gestor'));

DROP POLICY IF EXISTS "Users read own notifications" ON public.fleet_notifications;
CREATE POLICY "Users read own notifications"
  ON public.fleet_notifications FOR SELECT TO authenticated
  USING (recipient_user_id = auth.uid());

DROP POLICY IF EXISTS "Users mark own notifications read" ON public.fleet_notifications;
CREATE POLICY "Users mark own notifications read"
  ON public.fleet_notifications FOR UPDATE TO authenticated
  USING (recipient_user_id = auth.uid())
  WITH CHECK (recipient_user_id = auth.uid());

GRANT SELECT ON public.vehicle_movements TO authenticated;
GRANT SELECT ON public.fleet_notifications TO authenticated;
GRANT UPDATE (read_at) ON public.fleet_notifications TO authenticated;

-- Remove the broad profile policies left by older migrations and rebuild the intended access.
DROP POLICY IF EXISTS "Profiles: viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: admins can do everything" ON public.profiles;
DROP POLICY IF EXISTS "Simple owner access" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Managers can view profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Managers can view profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('admin', 'gestor'));

-- Authentication e-mail is immutable from the profile form; only display fields remain editable.
REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
GRANT UPDATE (first_name, last_name, avatar_url, updated_at) ON public.profiles TO authenticated;

-- The QR route is now authorized with an unguessable per-vehicle token in server code.
DROP POLICY IF EXISTS "Allow generic read access to vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Allow anonymous inserts to check_ins" ON public.check_ins;
REVOKE ALL ON public.vehicles FROM anon;
REVOKE ALL ON public.check_ins FROM anon;
REVOKE ALL ON public.brands FROM anon;
REVOKE ALL ON public.models FROM anon;
REVOKE ALL ON public.occurrence_types FROM anon;
REVOKE ALL ON public.vehicle_movements FROM anon;
REVOKE ALL ON public.fleet_notifications FROM anon;

-- Catalog management matches the application role matrix: admin and gestor.
DROP POLICY IF EXISTS "Brands: only admins manage" ON public.brands;
CREATE POLICY "Brands: managers manage"
  ON public.brands FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'gestor'))
  WITH CHECK (public.get_user_role() IN ('admin', 'gestor'));

DROP POLICY IF EXISTS "Models: only admins manage" ON public.models;
CREATE POLICY "Models: managers manage"
  ON public.models FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'gestor'))
  WITH CHECK (public.get_user_role() IN ('admin', 'gestor'));

DROP POLICY IF EXISTS "Occurrence Types: only admins manage" ON public.occurrence_types;
CREATE POLICY "Occurrence Types: managers manage"
  ON public.occurrence_types FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'gestor'))
  WITH CHECK (public.get_user_role() IN ('admin', 'gestor'));

DROP POLICY IF EXISTS "Usage Categories: only admins manage" ON public.usage_categories;
CREATE POLICY "Usage Categories: managers manage"
  ON public.usage_categories FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'gestor'))
  WITH CHECK (public.get_user_role() IN ('admin', 'gestor'));

-- New check-in photos are private and are displayed through short-lived signed URLs.
UPDATE storage.buckets SET public = FALSE WHERE id = 'checkin-photos';
DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;
DROP POLICY IF EXISTS "Give public access to checkin-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

COMMENT ON COLUMN public.vehicles.qr_access_token IS
  'Secret printed in the vehicle QR Code; rotate and reprint if exposed.';
COMMENT ON TABLE public.vehicle_movements IS
  'Immutable custody timeline of vehicle checkout and return events.';
COMMENT ON TABLE public.fleet_notifications IS
  'Per-user operational notifications generated for administrators and managers.';
