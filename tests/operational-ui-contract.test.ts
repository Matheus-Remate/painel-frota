import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('operational interface keeps navigation while providing safe dashboard fallbacks and dismissible overlays', async () => {
    const [dashboard, header, reservation] = await Promise.all([
        readFile(new URL('../app/dashboard/page.tsx', import.meta.url), 'utf8'),
        readFile(new URL('../components/dashboard/header.tsx', import.meta.url), 'utf8'),
        readFile(new URL('../components/schedule/reservation-details-button.tsx', import.meta.url), 'utf8'),
    ]);
    assert.match(dashboard, /getReservations\(\)\.catch\(\(\) => \[\]\)/);
    assert.doesNotMatch(dashboard, /OperationalTicker|CommandFleetDeck/);
    assert.match(header, /href: '\/dashboard\/drivers'/);
    assert.match(header, /notificationRoot/);
    assert.match(reservation, /event\.target === event\.currentTarget/);
});
