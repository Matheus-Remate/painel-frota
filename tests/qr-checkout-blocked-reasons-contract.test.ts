import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pagePath = new URL('../app/mobile/vehicle/[id]/checkout/page.tsx', import.meta.url);

test('blocked pickup explains each actionable reason instead of using a generic error', async () => {
    const source = await readFile(pagePath, 'utf8');

    assert.match(source, /const blockingReasons =/);
    assert.match(source, /já está em uso/);
    assert.match(source, /aguarda reparo/);
    assert.match(source, /Não há reserva ativa dentro da janela de retirada/);
    assert.match(source, /blockingReasons\.map/);
});
