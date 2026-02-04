import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function auditUsers() {
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

    console.log('\n--- Orphaned Auth Users (No Profile) ---');
    let orphans = 0;
    users.forEach(user => {
        if (!profileUserIds.has(user.id)) {
            console.log(`- Email: ${user.email} | ID: ${user.id} | Created: ${user.created_at}`);
            orphans++;
        }
    });

    if (orphans === 0) {
        console.log('No orphaned auth users found.');
    }

    console.log('\n--- Profile Metadata Sync Check ---');
    profiles.forEach(profile => {
        const authUser = users.find(u => u.id === profile.user_id);
        if (!authUser) {
            console.log(`- Profile with ID ${profile.id} points to non-existent User ID ${profile.user_id} (${profile.email})`);
        }
    });
}

auditUsers();
