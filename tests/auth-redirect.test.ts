import assert from 'node:assert/strict';
import test from 'node:test';

import {
    getPasswordResetRedirectUrl,
    resolveSiteUrl,
} from '../lib/security/auth-redirect.ts';

test('uses the request origin for a production password reset', () => {
    assert.equal(
        getPasswordResetRedirectUrl({
            requestOrigin: 'https://painel-frota.vercel.app',
            configuredSiteUrl: 'http://localhost:3000',
        }),
        'https://painel-frota.vercel.app/reset-password',
    );
});

test('normalizes Vercel domains when no request origin is available', () => {
    assert.equal(
        resolveSiteUrl({ vercelProductionUrl: 'painel-frota.vercel.app/' }),
        'https://painel-frota.vercel.app',
    );
});

test('uses the configured site URL outside Vercel', () => {
    assert.equal(
        getPasswordResetRedirectUrl({ configuredSiteUrl: 'http://localhost:3000/' }),
        'http://localhost:3000/reset-password',
    );
});

test('falls back to local development when no valid URL exists', () => {
    assert.equal(
        resolveSiteUrl({ configuredSiteUrl: 'not a url' }),
        'http://localhost:3000',
    );
});
