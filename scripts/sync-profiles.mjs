// Script para sincronizar usuários do Auth com profiles
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function syncProfiles() {
    console.log('🔄 Sincronizando usuários Auth com profiles...\n');

    try {
        // Listar todos os usuários do Auth
        const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            console.error('❌ Erro ao listar usuários:', listError.message);
            return;
        }

        console.log(`📋 Encontrados ${usersData.users.length} usuários no Auth\n`);

        for (const user of usersData.users) {
            // Verificar se já existe profile
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (existingProfile) {
                console.log(`✅ ${user.email} - profile já existe`);
                continue;
            }

            // Criar profile
            const firstName = user.user_metadata?.first_name || 'Novo';
            const lastName = user.user_metadata?.last_name || 'Usuário';
            const role = user.user_metadata?.role || 'solicitante';

            const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                    user_id: user.id,
                    email: user.email,
                    first_name: firstName,
                    last_name: lastName,
                    role: role
                });

            if (insertError) {
                console.error(`❌ ${user.email} - erro ao criar profile:`, insertError.message);
            } else {
                console.log(`✨ ${user.email} - profile criado (role: ${role})`);
            }
        }

        console.log('\n✅ Sincronização concluída!');

        // Listar profiles atuais
        const { data: profiles } = await supabase
            .from('profiles')
            .select('email, first_name, last_name, role')
            .order('created_at', { ascending: false });

        console.log('\n📊 Profiles no banco:');
        console.table(profiles);

    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

syncProfiles();
