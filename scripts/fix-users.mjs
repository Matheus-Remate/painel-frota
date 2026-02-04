import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backfill() {
    console.log('--- Checking for orphaned users ---');
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;

    const { data: profiles, error: profileError } = await supabase.from('profiles').select('user_id');
    if (profileError) throw profileError;

    const profileUserIds = new Set(profiles.map(p => p.user_id));
    const orphanedUsers = users.filter(user => !profileUserIds.has(user.id));

    if (orphanedUsers.length === 0) {
        console.log('No orphaned users found.');
        return;
    }

    console.log(`Fixing ${orphanedUsers.length} users...`);

    for (const user of orphanedUsers) {
        const metadata = user.user_metadata || {};
        const profileData = {
            user_id: user.id,
            email: user.email,
            first_name: metadata.first_name || 'Novo',
            last_name: metadata.last_name || 'Usuário',
            role: metadata.role || 'solicitante'
        };

        console.log(`- Creating profile for ${user.email}...`);
        const { error: insertError } = await supabase.from('profiles').insert(profileData);

        if (insertError) {
            console.error(`  Failed to create profile for ${user.email}:`, insertError.message);
        } else {
            console.log(`  Success!`);
        }
    }
}

backfill();
