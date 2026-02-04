'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getDrivers() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .is('deleted_at', null)
        .order('name');

    if (error) throw error;
    return data || [];
}

export async function createDriver(formData: FormData) {
    const supabase = await createClient();

    const name = formData.get('name') as string;
    const cpf = formData.get('cpf') as string;
    const cnh = formData.get('cnh') as string;
    const cnhCategory = formData.get('cnhCategory') as string;
    const cnhExpiry = formData.get('cnhExpiry') as string;
    const status = formData.get('status') as string;

    const { error } = await supabase
        .from('drivers')
        .insert({
            name,
            cpf,
            cnh,
            cnh_category: cnhCategory,
            cnh_expiry: cnhExpiry,
            status,
        });

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/drivers');
    return { success: true };
}

export async function updateDriver(id: string, formData: FormData) {
    const supabase = await createClient();

    const name = formData.get('name') as string;
    const cpf = formData.get('cpf') as string;
    const cnh = formData.get('cnh') as string;
    const cnhCategory = formData.get('cnhCategory') as string;
    const cnhExpiry = formData.get('cnhExpiry') as string;
    const status = formData.get('status') as string;

    const { error } = await supabase
        .from('drivers')
        .update({
            name,
            cpf,
            cnh,
            cnh_category: cnhCategory,
            cnh_expiry: cnhExpiry,
            status,
        })
        .eq('id', id);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/drivers');
    return { success: true };
}

export async function deleteDriver(id: string) {
    const supabase = await createClient();

    // 1. Soft delete using deleted_at
    const { error } = await supabase
        .from('drivers')
        .update({
            deleted_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) {
        console.error('Error deleting driver:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/drivers');
    return { success: true };
}
