import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const contextPath = new URL('../lib/contexts/AuthContext.tsx', import.meta.url);
const sidebarPath = new URL('../components/dashboard/sidebar.tsx', import.meta.url);

test('recovers the authenticated profile through its RLS-protected direct query', async () => {
    const source = await readFile(contextPath, 'utf8');

    assert.match(source, /\.rpc\('get_my_profile'\)/);
    assert.match(source, /\.from\('profiles'\)[\s\S]*?\.eq\('user_id', authenticatedUser\.id\)[\s\S]*?\.maybeSingle\(\)/);
    assert.match(source, /setProfileLoadFailed\(false\)/);
});

test('keeps a single settings destination in the desktop sidebar', async () => {
    const source = await readFile(sidebarPath, 'utf8');

    assert.equal((source.match(/href: '\/dashboard\/settings'/g) || []).length, 0);
    assert.equal((source.match(/href="\/dashboard\/settings"/g) || []).length, 1);
});
