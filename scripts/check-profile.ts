
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env vars manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error("SUPABASE_SERVICE_ROLE_KEY not found in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProfile() {
    const userId = 'd4af75c0-a905-4e4e-a8aa-8a357c4980e9';

    console.log(`Checking Profile for User ${userId}...`);

    // Check Auth User
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    if (authError) {
        console.error('Auth User Error:', authError.message);
    } else {
        console.log('Auth User Found:', authUser.user.email);
        console.log('Auth User Meta:', authUser.user.user_metadata);
    }

    // Check Profile Table
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (profileError) {
        console.error('Profile Table Error:', profileError.message);
        console.error('Full Error:', JSON.stringify(profileError, null, 2));
    } else {
        console.log('Profile Found:', JSON.stringify(profile, null, 2));
    }
}

checkProfile();
