'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function createVehicle(formData: FormData) {
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
    const brandName = modelRef?.brand?.name;
    const modelName = modelRef?.name;

    if (!brandName || !modelName) {
        return { success: false, error: 'Erro interno: Marca ou Modelo não encontrados. Verifique o cadastro.' };
    }

    const rawData = {
        model_id: modelId,
        brand: brandName, // Required by DB constraint
        model: modelName, // Required by DB constraint (Legacy)
        license_plate: formData.get('license_plate') as string,
        chassis: formData.get('chassis') as string || '0',
        renavam: formData.get('renavam') as string || '0',
        year: parseInt(formData.get('year') as string),
        color: formData.get('color') as string,
        fuel_type: formData.get('fuel_type') as string,
        usage_category: formData.get('usage_category') as string || 'GENERAL',
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
        // Em produção, você retornaria o erro para o form exibir
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/vehicles');
    return { success: true };
}

export async function deleteVehicle(vehicleId: string) {
    const supabase = createAdminClient();

    // 1. Fetch current data to preserve capacity info
    const { data: vehicle, error: fetchError } = await supabase
        .from('vehicles')
        .select('capacity')
        .eq('id', vehicleId)
        .single();

    if (fetchError) {
        return { success: false, error: fetchError.message };
    }

    const newCapacity = {
        ...(vehicle?.capacity as object),
        _deleted: true
    };

    // 2. Soft delete using JSONB flag and valid Enum status
    const { error } = await supabase
        .from('vehicles')
        .update({
            status: 'IN_MAINTENANCE',
            capacity: newCapacity
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

    if (model_id) updateData.model_id = model_id;
    if (license_plate) updateData.license_plate = license_plate;
    if (chassis) updateData.chassis = chassis;
    if (renavam) updateData.renavam = renavam;
    if (year) updateData.year = parseInt(year as string);
    if (color) updateData.color = color;
    if (fuel_type) updateData.fuel_type = fuel_type;
    if (status) updateData.status = status;

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
