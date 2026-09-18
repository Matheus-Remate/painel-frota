import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('settings keeps the selected tab while refreshing changed modal data', async () => {
    const files = await Promise.all([
        'components/dashboard/settings-tabs-container.tsx',
        'components/dashboard/settings/brands-tab.tsx',
        'components/dashboard/settings/models-tab.tsx',
        'components/dashboard/settings/occurrence-types-tab.tsx',
        'components/dashboard/settings/users-tab.tsx',
    ].map((path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')));
    assert.ok(files.every((source) => !source.includes('window.location.reload()')));
    assert.match(files[0], /const \[activeTab, setActiveTab\] = useState\('brands'\)/);
    assert.match(files[0], /id: 'drivers'/);
    assert.ok(files.slice(1).every((source) => source.includes('router.refresh()')));
});
