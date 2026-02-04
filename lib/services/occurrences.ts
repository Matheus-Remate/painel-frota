'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getOccurrences() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('occurrences')
        .select(`
            *,
            vehicle:vehicles(
                id, 
                license_plate,
                model:models(
                    name,
                    brand:brands(name)
                )
            ),
            driver:drivers(id, name),
            type:occurrence_types(id, name)
        `)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching occurrences:', error);
        return [];
    }
    return data;
}

export async function createOccurrence(formData: FormData) {
    const supabase = await createClient();

    const vehicleId = formData.get('vehicleId') as string;
    const driverId = formData.get('driverId') as string || null;
    const typeId = formData.get('typeId') as string;
    const date = formData.get('date') as string; // ISO string or date
    const description = formData.get('description') as string;
    const cost = parseFloat(formData.get('cost') as string) || 0;
    const observation = formData.get('observation') as string;

    const dateStr = formData.get('date') as string;
    const dateQuery = new Date(dateStr).toISOString();

    let finalDriverId = driverId;
    let driverNameStr = '';

    // Auto-link logic: If no driver selected, try to find active reservation
    if (!finalDriverId) {
        const { data: reservation } = await supabase
            .from('reservations')
            .select('driver_id, purpose')
            .eq('vehicle_id', vehicleId)
            .neq('status', 'CANCELLED')
            .lte('start_date', dateQuery)
            .gte('end_date', dateQuery)
            .maybeSingle();

        if (reservation) {
            finalDriverId = reservation.driver_id;
        }
    }

    const { error } = await supabase.from('occurrences').insert({
        vehicle_id: vehicleId,
        driver_id: finalDriverId,
        type_id: typeId,
        date: dateQuery,
        description,
        cost,
        observation,
        status: 'OPEN'
    });

    if (error) return { success: false, error: error.message };

    revalidatePath('/dashboard/occurrences');
    return { success: true };
}

export async function resolveOccurrence(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('occurrences')
        .update({ status: 'RESOLVED' })
        .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/dashboard/occurrences');
    return { success: true };
}

export async function updateOccurrence(id: string, formData: FormData) {
    const supabase = await createClient();

    const vehicleId = formData.get('vehicleId') as string;
    const driverId = formData.get('driverId') as string || null;
    const typeId = formData.get('typeId') as string;
    const dateStr = formData.get('date') as string;
    const dateQuery = new Date(dateStr).toISOString();
    const description = formData.get('description') as string;
    const cost = parseFloat(formData.get('cost') as string) || 0;
    const observation = formData.get('observation') as string;

    const { error } = await supabase
        .from('occurrences')
        .update({
            vehicle_id: vehicleId,
            driver_id: driverId,
            type_id: typeId,
            date: dateQuery,
            description,
            cost,
            observation
        })
        .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/dashboard/occurrences');
    return { success: true };
}

export async function deleteOccurrence(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('occurrences')
        .delete()
        .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/dashboard/occurrences');
    return { success: true };
}

export async function getOccurrenceById(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('occurrences')
        .select(`
            *,
            vehicle:vehicles(id, license_plate),
            driver:drivers(id, name),
            type:occurrence_types(id, name)
        `)
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
}
