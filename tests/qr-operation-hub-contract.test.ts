import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pagePath = new URL('../app/mobile/vehicle/[id]/page.tsx', import.meta.url);

test('QR landing prioritizes normal pickup and return while keeping emergency pickup secondary', async () => {
    const source = await readFile(pagePath, 'utf8');

    assert.match(source, /\/checkout\?token=/);
    assert.match(source, /\/return\?token=/);
    assert.match(source, /Retirada imediata/);
    assert.match(source, /mode=emergency/);
    assert.match(source, /EmergencyCheckoutForm/);
});

test('QR landing identifies the scanned vehicle and active driver without exposing review details', async () => {
    const source = await readFile(pagePath, 'utf8');

    assert.match(source, /vehicle\.license_plate/);
    assert.match(source, /vehicle\.nickname/);
    assert.match(source, /Em uso por/);
    assert.match(source, /activeCheckout\?\.driver_name/);
});
