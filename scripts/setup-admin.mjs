// Idempotently links an existing Supabase Auth user to the protected admin profile.
// This script never creates credentials. Create the Auth user in the Supabase Dashboard first.
import { createClient } from '@supabase/supabase-js';

const PRIMARY_ADMIN_EMAIL = 'matheus.marques@remateweb.com';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function findAuthUserByEmail(email) {
    const perPage = 200;

    for (let page = 1; ; page += 1) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
        if (error) throw error;

        const user = data.users.find(
            (candidate) => candidate.email?.toLowerCase() === email.toLowerCase(),
        );
        if (user) return user;
        if (data.users.length < perPage) return null;
    }
}

async function setupPrimaryAdmin() {
    const authUser = await findAuthUserByEmail(PRIMARY_ADMIN_EMAIL);

    if (!authUser) {
        throw new Error(
            'Conta ausente no Supabase Authentication. Crie-a no Dashboard antes de executar este script.',
        );
    }

    const { data: existingProfile, error: lookupError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle();

    if (lookupError) throw lookupError;

    const profileData = {
        user_id: authUser.id,
        first_name: 'Administrador',
        last_name: '',
        email: authUser.email,
        role: 'admin',
        is_protected: true,
    };

    const operation = existingProfile
        ? supabase.from('profiles').update(profileData).eq('id', existingProfile.id)
        : supabase.from('profiles').insert({ id: authUser.id, ...profileData });

    const { error } = await operation;

    if (error) throw error;

    console.log('Administrador principal vinculado e protegido com sucesso.');
}

setupPrimaryAdmin().catch((error) => {
    console.error('Falha ao configurar o administrador principal:', error.message);
    process.exit(1);
});
