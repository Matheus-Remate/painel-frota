'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { requireManager } from '@/lib/security/authorization';
import { redirect } from 'next/navigation';

export async function createVehicle(formData: FormData) {
    await requireManager();
    const supabase = await createClient();

    const licensePlate = formData.get('licensePlate') as string;
    const modelId = formData.get('modelId') as string;
    const year = parseInt(formData.get('year') as string);
    const fuelType = formData.get('fuelType') as string;
    const usageCategory = formData.get('usageCategory') as string;
    const nickname = String(formData.get('nickname') || '').trim() || null;

    // Fetch Model to get Brand Name (Legacy/Denormalized requirement)
    const { data: modelRef } = await supabase
        .from('models')
        .select(`
            brand:brands(name)
        `)
        .eq('id', modelId)
        .single();

    // Safe cast or access
    const brandData = modelRef?.brand as any;
    const brandName = Array.isArray(brandData) ? brandData[0]?.name : brandData?.name;

    if (!brandName) {
        console.error('Brand not found for model:', modelId, modelRef);
        return { success: false, error: 'Erro interno: Marca do veículo não encontrada. Verifique o modelo selecionado.' };
    }

    const { error } = await supabase
        .from('vehicles')
        .insert({
            license_plate: licensePlate,
            model_id: modelId,
            brand: brandName, // Required by DB constraint
            year,
            fuel_type: fuelType,
            usage_category: usageCategory,
            nickname,
            status: 'IN_YARD', // Default status
        });

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/vehicles');
    return { success: true };
}

export async function updateVehicle(id: string, formData: FormData) {
    await requireManager();
    const supabase = await createClient();

    const licensePlate = formData.get('licensePlate') as string;
    const modelId = formData.get('modelId') as string;
    const year = parseInt(formData.get('year') as string);
    const fuelType = formData.get('fuelType') as string;
    const usageCategory = formData.get('usageCategory') as string;
    const status = formData.get('status') as string;
    const nickname = String(formData.get('nickname') || '').trim() || null;

    const { error } = await supabase
        .from('vehicles')
        .update({
            license_plate: licensePlate,
            model_id: modelId,
            year,
            fuel_type: fuelType,
            usage_category: usageCategory,
            status: status,
            nickname,
        })
        .eq('id', id);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/vehicles');
    revalidatePath(`/dashboard/vehicles/${id}`);
    return { success: true };
}

export async function deleteVehicle(id: string) {
    await requireManager();
    const supabase = await createClient();

    // Soft delete the vehicle instead of hard delete
    const { error } = await supabase
        .from('vehicles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/vehicles');
    return { success: true };
}
