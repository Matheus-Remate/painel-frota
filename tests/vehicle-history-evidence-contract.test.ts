import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const dashboardPath = new URL('../lib/services/dashboard.ts', import.meta.url);
const historyPath = new URL('../components/vehicles/vehicle-activity-history.tsx', import.meta.url);
const checkoutPath = new URL('../app/mobile/vehicle/[id]/checkout/page.tsx', import.meta.url);

test('vehicle details load and sign return evidence from the private photo bucket', async () => {
    const source = await readFile(dashboardPath, 'utf8');

    assert.match(source, /photo_paths,/);
    assert.match(source, /photos,/);
    assert.match(source, /checklist: await signChecklistPhotos\(checkin\.checklist\)/);
    assert.match(source, /photos: await signCheckinPhotos\(checkin\.photo_paths, checkin\.photos\)/);
});

test('vehicle history presents checklist notes and evidence photos in a detail dialog', async () => {
    const source = await readFile(historyPath, 'utf8');

    assert.match(source, /Checklist da devolução/);
    assert.match(source, /Fotos da devolução/);
    assert.match(source, /Ver foto deste item/);
    assert.match(source, /selectedImage/);
});

test('scheduled pickup summarizes the last return without exposing its photos on public QR', async () => {
    const source = await readFile(checkoutPath, 'utf8');

    assert.match(source, /Última devolução/);
    assert.match(source, /lastReturn\.return_notes/);
    assert.doesNotMatch(source, /photoUrl|photo_paths|<img/);
});
