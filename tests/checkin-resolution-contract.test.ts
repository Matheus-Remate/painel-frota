import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const servicePath = new URL('../lib/services/dashboard.ts', import.meta.url);

test('resolving a check-in stores the manager profile id required by the foreign key', async () => {
    const source = await readFile(servicePath, 'utf8');

    assert.match(source, /resolved_by: authorized\.profileId/);
    assert.doesNotMatch(source, /resolved_by: authorized\.id/);
});
