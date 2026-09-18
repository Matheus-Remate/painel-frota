'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { requireManager } from '@/lib/security/authorization';

export async function createVehicle(formData: FormData) {
    await requireManager();
    // Usa cliente Admin para ignorar RLS temporariamente (já que é painel interno)
    const supabase = createAdminClient();

    const modelId = formData.get('modelId') as string;

    // Fetch Model to get Brand Name (Legacy/Denormalized requirement)
    const { data: modelRef } = await supabase
        .from('models')
        .select(`
            name,
            brand:brands(name)
        `)
        .eq('id', modelId)
        .single();

    // Safe cast or access
    // Safe cast or access
    const brandData = modelRef?.brand as any;
    const brandName = Array.isArray(brandData) ? brandData[0]?.name : brandData?.name;
    const modelName = modelRef?.name;

    if (!brandName || !modelName) {
        return { success: false, error: 'Erro interno: Marca ou Modelo não encontrados. Verifique o cadastro.' };
    }

    const rawData = {
        model_id: modelId,
        brand: brandName, // Required by DB constraint
        model: modelName, // Required by DB constraint (Legacy)
        license_plate: formData.get('license_plate') as string,
        chassis: String(formData.get('chassis') || '').trim() || null,
        renavam: String(formData.get('renavam') || '').trim() || null,
        year: parseInt(formData.get('year') as string),
        color: formData.get('color') as string,
        fuel_type: formData.get('fuel_type') as string,
        usage_category: formData.get('usage_category') as string || 'GENERAL',
        nickname: String(formData.get('nickname') || '').trim() || null,
        status: 'IN_YARD', // Padrão inicial
        capacity: {
            pbt: formData.get('capacity_pbt') ? parseInt(formData.get('capacity_pbt') as string) : 0,
            vol: formData.get('capacity_vol') ? parseInt(formData.get('capacity_vol') as string) : 0,
        }
    };

    const { error } = await supabase
        .from('vehicles')
        .insert(rawData);

    if (error) {
        console.error('Error creating vehicle:', error);
        if (error.code === '23505') {
            if (error.message.includes('vehicles_chassis_key')) return { success: false, error: 'Já existe um veículo cadastrado com este chassi. Confira o número informado.' };
            if (error.message.includes('vehicles_license_plate_key')) return { success: false, error: 'Já existe um veículo cadastrado com esta placa.' };
            if (error.message.includes('vehicles_renavam_key')) return { success: false, error: 'Já existe um veículo cadastrado com este RENAVAM.' };
        }
        return { success: false, error: 'Não foi possível cadastrar o veículo. Confira os dados e tente novamente.' };
    }

    revalidatePath('/dashboard/vehicles');
    return { success: true };
}

export async function deleteVehicle(vehicleId: string) {
    await requireManager();
    const supabase = createAdminClient();
    const { error } = await supabase
        .from('vehicles')
        .update({
            deleted_at: new Date().toISOString(),
            status: 'IN_MAINTENANCE'
        })
        .eq('id', vehicleId);

    if (error) {
        console.error('Error deleting vehicle:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/vehicles');
    return { success: true };
}

export async function updateVehicle(vehicleId: string, formData: FormData) {
    await requireManager();
    const supabase = createAdminClient();

    const updateData: Record<string, any> = {};

    // Only add fields that have values
    const model_id = formData.get('modelId');
    const license_plate = formData.get('license_plate');
    const chassis = formData.get('chassis');
    const renavam = formData.get('renavam');
    const year = formData.get('year');
    const color = formData.get('color');
    const fuel_type = formData.get('fuel_type');
    const status = formData.get('status');
    const nickname = String(formData.get('nickname') || '').trim() || null;

    if (model_id) updateData.model_id = model_id;
    if (license_plate) updateData.license_plate = license_plate;
    if (chassis) updateData.chassis = chassis;
    if (renavam) updateData.renavam = renavam;
    if (year) updateData.year = parseInt(year as string);
    if (color) updateData.color = color;
    if (fuel_type) updateData.fuel_type = fuel_type;
    if (status) updateData.status = status;
    updateData.nickname = nickname;
    updateData.qr_display_settings = {
        fuel: formData.get('qr_fuel') === 'on',
        odometer: formData.get('qr_odometer') === 'on',
        observations: formData.get('qr_observations') === 'on',
        pending: formData.get('qr_pending') === 'on',
    };

    const { error } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', vehicleId);

    if (error) {
        console.error('Error updating vehicle:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/vehicles');
    revalidatePath(`/dashboard/vehicles/${vehicleId}`);
    return { success: true };
}
