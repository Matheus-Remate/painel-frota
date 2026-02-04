// Script para criar o usuário admin via signup
// Execute com: node --env-file=.env.local scripts/seed-admin.mjs

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Erro: Variáveis de ambiente não encontradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedAdmin() {
    console.log('🔐 Criando usuário admin via signup...\n');

    const email = 'matheus.marques@remateweb.com';
    const password = 'Remate2020##';

    try {
        // Tentar fazer signup
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: 'Matheus',
                    last_name: 'Marques'
                }
            }
        });

        if (error) {
            if (error.message.includes('User already registered')) {
                console.log('⚠️  Usuário já existe. Tentando login...');

                // Fazer login para verificar
                const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (loginError) {
                    console.error('❌ Erro no login:', loginError.message);
                    return;
                }

                console.log('✅ Login bem sucedido!');
                console.log('   User ID:', loginData.user?.id);

                // Nota: Para atualizar role para admin, precisa da Service Role Key
                console.log('\n⚠️  Para definir como admin, execute no SQL Editor do Supabase:');
                console.log(`   UPDATE profiles SET role = 'admin' WHERE email = '${email}';`);
                return;
            }

            console.error('❌ Erro ao criar usuário:', error.message);
            return;
        }

        if (data.user) {
            console.log('✅ Usuário criado com sucesso!');
            console.log('   User ID:', data.user.id);
            console.log('📧 Email:', email);
            console.log('🔑 Senha:', password);

            if (data.user.identities?.length === 0) {
                console.log('\n⚠️  Usuário já existia mas não estava confirmado.');
            }

            console.log('\n📋 Para definir como admin, execute no SQL Editor do Supabase:');
            console.log(`   UPDATE profiles SET role = 'admin' WHERE email = '${email}';`);
        }

    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

seedAdmin();
