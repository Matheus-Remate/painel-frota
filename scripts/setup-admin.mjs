// Script para confirmar e-mail e atualizar role para admin
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function setupAdmin() {
    const email = 'matheus.marques@remateweb.com';

    console.log('🔐 Configurando usuário admin...\n');

    try {
        // Listar usuários para encontrar o nosso
        const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            console.error('❌ Erro ao listar usuários:', listError.message);
            return;
        }

        const user = usersData.users.find(u => u.email === email);

        if (!user) {
            console.log('⚠️  Usuário não encontrado. Criando...');

            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email,
                password: 'Remate2020##',
                email_confirm: true,
                user_metadata: {
                    first_name: 'Matheus',
                    last_name: 'Marques'
                }
            });

            if (createError) {
                console.error('❌ Erro ao criar:', createError.message);
                return;
            }

            console.log('✅ Usuário criado:', newUser.user.id);
        } else {
            console.log('✅ Usuário encontrado:', user.id);

            // Confirmar e-mail se não estiver confirmado
            if (!user.email_confirmed_at) {
                console.log('📧 Confirmando e-mail...');

                const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
                    email_confirm: true
                });

                if (updateError) {
                    console.error('❌ Erro ao confirmar:', updateError.message);
                } else {
                    console.log('✅ E-mail confirmado!');
                }
            } else {
                console.log('✅ E-mail já confirmado');
            }
        }

        // Aguardar trigger criar o profile
        await new Promise(resolve => setTimeout(resolve, 500));

        // Atualizar profile para admin
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .update({
                role: 'admin',
                first_name: 'Matheus',
                last_name: 'Marques'
            })
            .eq('email', email)
            .select();

        if (profileError) {
            console.error('❌ Erro ao atualizar profile:', profileError.message);
            console.log('\n💡 A tabela profiles pode não existir.');
            console.log('   Execute a migration 007_auth_rbac_schema.sql no SQL Editor do Supabase.');
        } else if (profile && profile.length > 0) {
            console.log('✅ Profile atualizado para admin!');
        } else {
            console.log('⚠️  Profile não encontrado. Criando...');

            // Buscar o user_id
            const { data: usersData2 } = await supabase.auth.admin.listUsers();
            const currentUser = usersData2.users.find(u => u.email === email);

            if (currentUser) {
                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert({
                        user_id: currentUser.id,
                        email: email,
                        first_name: 'Matheus',
                        last_name: 'Marques',
                        role: 'admin'
                    });

                if (insertError) {
                    console.error('❌ Erro ao criar profile:', insertError.message);
                } else {
                    console.log('✅ Profile criado como admin!');
                }
            }
        }

        console.log('\n🎉 Configuração concluída!');
        console.log('📧 Email: matheus.marques@remateweb.com');
        console.log('🔑 Senha: Remate2020##');
        console.log('\n🌐 Acesse: http://localhost:3001/login');

    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

setupAdmin();
