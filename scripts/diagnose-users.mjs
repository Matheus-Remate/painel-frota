import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnose() {
    console.log('--- Checking Auth Users ---');
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error('Error listing auth users:', authError.message);
        return;
    }

    console.log(`Found ${users.length} users in Auth.`);

    console.log('\n--- Checking Profiles ---');
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*');

    if (profileError) {
        console.error('Error listing profiles:', profileError.message);
        return;
    }

    console.log(`Found ${profiles.length} profiles.`);

    const profileUserIds = new Set(profiles.map(p => p.user_id));

    const orphanedUsers = users.filter(user => !profileUserIds.has(user.id));

    if (orphanedUsers.length === 0) {
        console.log('No orphaned auth users found.');
    } else {
        console.log(`\nFound ${orphanedUsers.length} orphaned auth users (in Auth but no Profile):`);
        for (const user of orphanedUsers) {
            console.log(`- Email: ${user.email} | ID: ${user.id} | Metadata: ${JSON.stringify(user.user_metadata)}`);

            // Attempting to backfill? 
            // Let's just log for now to confirm.
        }
    }
}

diagnose();
