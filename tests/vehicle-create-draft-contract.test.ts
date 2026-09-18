import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('failed vehicle creation preserves the draft and reports duplicate document fields clearly', async () => {
    const [page, action] = await Promise.all([
        readFile(new URL('../app/dashboard/vehicles/new/page.tsx', import.meta.url), 'utf8'),
        readFile(new URL('../lib/actions/vehicles.ts', import.meta.url), 'utf8'),
    ]);
    assert.match(page, /const \[values, setValues\] = useState/);
    assert.match(page, /value=\{values\.chassis\}/);
    assert.match(page, /value=\{values\.license_plate\}/);
    assert.match(action, /chassis: String\(formData\.get\('chassis'\).*\|\| null/);
    assert.match(action, /Já existe um veículo cadastrado com este chassi/);
});
