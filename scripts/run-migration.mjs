// Script para executar migrations no Supabase usando a Management API
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function runMigration() {
    console.log('🗃️  Executando migrations...\n');

    // Ler o arquivo SQL
    const migrationPath = join(__dirname, '../supabase/migrations/007_auth_rbac_schema.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    // Executar via RPC ou direct query
    // Como não temos acesso direto ao postgres, vamos usar a API REST

    // Tentar criar as tabelas via SQL usando a função rpc
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.log('⚠️  A função exec_sql não existe (normal). Executando SQL diretamente via Dashboard...');
        console.log('\n📋 Para executar a migration manualmente:');
        console.log('   1. Acesse: https://supabase.com/dashboard/project/nbddloeqadanxvzygpyt/sql');
        console.log('   2. Cole o conteúdo do arquivo:');
        console.log('      supabase/migrations/007_auth_rbac_schema.sql');
        console.log('   3. Clique em "Run"');
        console.log('\n   Depois execute:');
        console.log('      node --env-file=.env.local scripts/setup-admin.mjs');
        return;
    }

    console.log('✅ Migration executada com sucesso!');
}

runMigration();
