'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function createDriver(formData: FormData) {
    // Usa cliente Admin para ignorar RLS
    const supabase = createAdminClient();

    const rawData = {
        name: formData.get('name') as string,
        cpf: formData.get('cpf') as string,
        cnh_category: formData.get('cnh_category') as string,
        cnh_expiration: formData.get('cnh_expiration') as string,
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
