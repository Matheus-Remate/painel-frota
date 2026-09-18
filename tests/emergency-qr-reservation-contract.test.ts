import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationPath = new URL('../supabase/migrations/037_emergency_qr_reservation.sql', import.meta.url);

test('emergency QR checkout creates an auditable active reservation with only the supplied driver name', async () => {
    const source = await readFile(migrationPath, 'utf8');

    assert.match(source, /ADD COLUMN IF NOT EXISTS driver_name TEXT/);
    assert.match(source, /ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN NOT NULL DEFAULT FALSE/);
    assert.match(source, /ALTER COLUMN driver_id DROP NOT NULL/);
    assert.match(source, /INSERT INTO public\.reservations \(vehicle_id, driver_id, driver_name, start_date, end_date, purpose, status, is_emergency\)/);
    assert.match(source, /NULL, trim\(p_driver_name\), NOW\(\), NOW\(\) \+ INTERVAL '12 hours'/);
    assert.match(source, /'ACTIVE'::public\.reservation_status, TRUE/);
});

test('emergency reservation is completed when the vehicle return is recorded', async () => {
    const source = await readFile(migrationPath, 'utf8');

    assert.match(source, /UPDATE public\.reservations SET status = 'COMPLETED'::public\.reservation_status/);
    assert.match(source, /is_emergency = TRUE AND status = 'ACTIVE'::public\.reservation_status/);
    assert.match(source, /'Retirada imediata'/);
});
