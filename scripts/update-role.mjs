// Script para atualizar role do usuário para admin
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateRole() {
    const email = 'matheus.marques@remateweb.com';

    // Login primeiro para ter permissão
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: 'Remate2020##'
    });

    if (loginError) {
        console.error('❌ Erro no login:', loginError.message);
        return;
    }

    console.log('✅ Login realizado');

    // Atualizar profile para admin
    const { data, error } = await supabase
        .from('profiles')
        .update({
            role: 'admin',
            first_name: 'Matheus',
            last_name: 'Marques'
        })
        .eq('user_id', loginData.user.id)
        .select();

    if (error) {
        console.error('❌ Erro ao atualizar role:', error.message);
        console.log('\n⚠️  A tabela profiles pode não existir ou o trigger não foi executado.');
        console.log('   Execute as migrations 007 e 008 no SQL Editor do Supabase primeiro.');
    } else {
        console.log('✅ Profile atualizado para admin!', data);
    }
}

updateRole();
