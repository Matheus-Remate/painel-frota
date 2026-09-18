import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('vehicle nickname is saved and shown after the model in fleet and reservation lists', async () => {
    const [fleetPage, reservations, schedule, actions] = await Promise.all([
        readFile(new URL('../app/dashboard/vehicles/page.tsx', import.meta.url), 'utf8'),
        readFile(new URL('../components/schedule/ReservationsList.tsx', import.meta.url), 'utf8'),
        readFile(new URL('../lib/services/schedule.ts', import.meta.url), 'utf8'),
        readFile(new URL('../lib/actions/vehicles.ts', import.meta.url), 'utf8'),
    ]);
    assert.match(fleetPage, /\$\{vehicle\.nickname\}/);
    assert.match(reservations, /reservation\.vehicle\?\.nickname/);
    assert.match(schedule, /nickname,/);
    assert.match(actions, /nickname: String\(formData\.get\('nickname'\)/);
    assert.match(actions, /updateData\.nickname = nickname/);
});
