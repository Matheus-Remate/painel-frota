import assert from 'node:assert/strict';
import test from 'node:test';

import { blocksTravel, requiresReleaseDeclaration } from '../lib/domain/alert-level.ts';

test('urgent and high prevent travel, medium and low do not', () => {
    assert.equal(blocksTravel('URGENT'), true);
    assert.equal(blocksTravel('HIGH'), true);
    assert.equal(blocksTravel('MEDIUM'), false);
    assert.equal(blocksTravel('LOW'), false);
});

test('releasing a blocking alert needs a declaration', () => {
    assert.equal(requiresReleaseDeclaration('URGENT', 'MEDIUM'), true);
    assert.equal(requiresReleaseDeclaration('HIGH', 'LOW'), true);
    assert.equal(requiresReleaseDeclaration('HIGH', 'URGENT'), false);
    assert.equal(requiresReleaseDeclaration('MEDIUM', 'LOW'), false);
});
