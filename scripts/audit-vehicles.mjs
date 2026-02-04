import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Faltando variáveis de ambiente (NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function audit() {
    console.log('🔍 Iniciando auditoria de veículos...\n');

    // 1. Pegar todos os veículos
    const { data: vehicles, error: vError } = await supabase
        .from('vehicles')
        .select('brand, model');

    if (vError) {
        console.error('❌ Erro ao buscar veículos:', vError);
        return;
    }

    console.log(`✅ Total de veículos: ${vehicles.length}`);

    const uniquePairs = Array.from(new Set(vehicles.map(v => `${v.brand}|${v.model}`)))
        .map(pair => {
            const [brand, model] = pair.split('|');
            return { brand, model };
        });

    console.log(`📊 Pares Marca/Modelo únicos: ${uniquePairs.length}`);

    // 2. Pegar todas as marcas
    const { data: brands, error: bError } = await supabase
        .from('brands')
        .select('id, name');

    if (bError) {
        console.error('❌ Erro ao buscar marcas:', bError);
        return;
    }

    // 3. Pegar todos os modelos
    const { data: models, error: mError } = await supabase
        .from('models')
        .select('id, brand_id, name');

    if (mError) {
        console.error('❌ Erro ao buscar modelos:', mError);
        return;
    }

    console.log('\n--- Resultado do Match ---\n');

    const missingBrands = new Set();
    const missingModels = [];

    for (const pair of uniquePairs) {
        const brandMatch = brands.find(b => b.name.toLowerCase() === pair.brand.toLowerCase());

        if (!brandMatch) {
            missingBrands.add(pair.brand);
            missingModels.push({ brand: pair.brand, model: pair.model });
            console.log(`❌ Marca não encontrada: ${pair.brand}`);
        } else {
            const modelMatch = models.find(m =>
                m.brand_id === brandMatch.id &&
                m.name.toLowerCase() === pair.model.toLowerCase()
            );

            if (!modelMatch) {
                missingModels.push({ brand: pair.brand, model: pair.model, brand_id: brandMatch.id });
                console.log(`⚠️  Modelo não encontrado para ${pair.brand}: ${pair.model}`);
            } else {
                // console.log(`✅ OK: ${pair.brand} ${pair.model}`);
            }
        }
    }

    if (missingBrands.size === 0 && missingModels.length === 0) {
        console.log('\n✨ Todos os veículos estão mapeados corretamente nas tabelas relacionais!');
    } else {
        console.log(`\n📝 Resumo: ${missingBrands.size} marcas faltantes e ${missingModels.length} modelos faltantes.`);
        console.log('🔄 Iniciando sincronização...\n');

        // Sincronizar Marcas Faltantes
        for (const brandName of missingBrands) {
            const { data: newBrand, error: nbError } = await supabase
                .from('brands')
                .insert({ name: brandName })
                .select()
                .single();

            if (nbError) {
                console.error(`❌ Erro ao inserir marca ${brandName}:`, nbError);
            } else {
                console.log(`✅ Marca inserida: ${brandName}`);
                // Atualizar record de models faltantes com o novo ID de marca
                missingModels.forEach(m => {
                    if (m.brand === brandName) m.brand_id = newBrand.id;
                });
            }
        }

        // Sincronizar Modelos Faltantes
        for (const model of missingModels) {
            if (!model.brand_id) continue;

            const { error: nmError } = await supabase
                .from('models')
                .insert({ name: model.model, brand_id: model.brand_id });

            if (nmError) {
                console.error(`❌ Erro ao inserir modelo ${model.model} para marca id ${model.brand_id}:`, nmError);
            } else {
                console.log(`✅ Modelo inserido: ${model.model} (${model.brand})`);
            }
        }

        console.log('\n✨ Sincronização concluída!');
    }
}

audit();
