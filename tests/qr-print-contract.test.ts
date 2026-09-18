import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const vehiclePagePath = new URL('../app/dashboard/vehicles/[id]/page.tsx', import.meta.url);
const globalsPath = new URL('../app/globals.css', import.meta.url);

test('vehicle QR print label contains only the approved vehicle identifiers', async () => {
    const source = await readFile(vehiclePagePath, 'utf8');

    assert.match(source, /vehicle-qr-print-label/);
    for (const label of ['Marca e modelo', 'Placa', 'Ano', 'Combustível', 'Chassi', 'RENAVAM']) {
        assert.match(source, new RegExp(`>${label}<`));
    }
    assert.match(source, /vehicle-qr-print-code-image/);
});

test('vehicle QR print label occupies exactly one half of an A4 page', async () => {
    const source = await readFile(globalsPath, 'utf8');

    assert.match(source, /@page\s*\{\s*size: A4 portrait/);
    assert.match(source, /width: 210mm/);
    assert.match(source, /height: 148\.5mm/);
    assert.match(source, /body \*\s*\{\s*visibility: hidden !important/);
});
