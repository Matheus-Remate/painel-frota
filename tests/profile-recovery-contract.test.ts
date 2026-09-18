import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const contextPath = new URL('../lib/contexts/AuthContext.tsx', import.meta.url);
const sidebarPath = new URL('../components/dashboard/sidebar.tsx', import.meta.url);
const resetPasswordPath = new URL('../app/(auth)/reset-password/page.tsx', import.meta.url);

test('recovers the authenticated profile through its RLS-protected direct query', async () => {
    const source = await readFile(contextPath, 'utf8');

    assert.match(source, /\.rpc\('get_my_profile'\)/);
    assert.match(source, /\.from\('profiles'\)[\s\S]*?\.eq\('user_id', authenticatedUser\.id\)[\s\S]*?\.maybeSingle\(\)/);
    assert.match(source, /setProfileLoadFailed\(false\)/);
});

test('defers and serializes profile loading until the Supabase auth callback has released its lock', async () => {
    const source = await readFile(contextPath, 'utf8');

    assert.match(source, /\(_event, session\) =>/);
    assert.match(source, /const scheduleProfileRefresh = \(authenticatedUser: User, delay = 0\)/);
    assert.match(source, /if \(scheduledProfileRefresh\) clearTimeout\(scheduledProfileRefresh\)/);
    assert.match(source, /scheduleProfileRefresh\(session\.user\)/);
    assert.match(source, /error instanceof DOMException && error\.name === 'AbortError'/);
});

test('keeps a single settings destination in the desktop sidebar', async () => {
    const source = await readFile(sidebarPath, 'utf8');

    assert.equal((source.match(/href: '\/dashboard\/settings'/g) || []).length, 0);
    assert.equal((source.match(/href="\/dashboard\/settings"/g) || []).length, 1);
});

test('uses the exchanged recovery session and times out instead of leaving reset validation pending', async () => {
    const source = await readFile(resetPasswordPath, 'utf8');

    assert.match(source, /RECOVERY_VALIDATION_TIMEOUT_MS = 10_000/);
    assert.match(source, /withRecoveryTimeout\(supabase\.auth\.exchangeCodeForSession\(code\)\)/);
    assert.match(source, /withRecoveryTimeout\(supabase\.auth\.updateUser\(\{ password \}\)\)/);
    assert.match(source, /!data\.session/);
    assert.match(source, /setRecoveryState\("invalid"\)/);
});
