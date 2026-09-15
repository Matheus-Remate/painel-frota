'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireManager } from '@/lib/security/authorization';

export async function createDriver(formData: FormData) {
    await requireManager();
    // Usa cliente Admin para ignorar RLS
    const supabase = createAdminClient();

    const rawData = {
        name: formData.get('name') as string,
        cpf: formData.get('cpf') as string,
        cnh_category: formData.get('cnh_category') as string,
        cnh_expiration: formData.get('cnh_expiration') as string,
        user_id: formData.get('user_id') ? (formData.get('user_id') as string) : null,
    };

    const { error } = await supabase
        .from('drivers')
        .insert(rawData);

    if (error) {
        console.error('Error creating driver:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/drivers');
    redirect('/dashboard/drivers');
}

export async function updateDriver(id: string, formData: FormData) {
    await requireManager();
    const supabase = createAdminClient();

    const rawData = {
        name: formData.get('name') as string,
        cpf: formData.get('cpf') as string,
        cnh_category: formData.get('cnh_category') as string,
        cnh_expiration: formData.get('cnh_expiration') as string,
        user_id: formData.get('user_id') ? (formData.get('user_id') as string) : null,
    };

    const { error } = await supabase
        .from('drivers')
        .update(rawData)
        .eq('id', id);

    if (error) {
        console.error('Error updating driver:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/drivers');
    return { success: true };
}
