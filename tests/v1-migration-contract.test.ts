import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(new URL('../supabase/migrations/035_v1_alert_levels.sql', import.meta.url), 'utf8');

test('active reservation changes remain protected by blocking alerts', () => {
    assert.match(
        migration,
        /UPDATE OF vehicle_id, status, start_date, end_date ON public\.reservations/,
    );
    assert.match(
        migration,
        /PERFORM public\.assert_vehicle_travel_allowed\(booking\.vehicle_id\);/,
    );
});
