import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationPath = new URL('../supabase/migrations/039_fix_emergency_qr_notification.sql', import.meta.url);

test('emergency checkout notification follows the deployed notification schema', async () => {
    const source = await readFile(migrationPath, 'utf8');

    assert.match(source, /INSERT INTO public\.fleet_notifications \(recipient_user_id, type, title, message, href, vehicle_id\)/);
    assert.match(source, /SELECT user_id, 'vehicle_checkout', 'Retirada imediata'/);
    assert.doesNotMatch(source, /fleet_notifications\(user_id/);
});
