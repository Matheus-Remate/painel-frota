'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { requireManager } from '@/lib/security/authorization';

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
    await requireManager();
    const supabase = await createClient();

    const vehicleId = formData.get('vehicleId') as string;
    const driverId = formData.get('driverId') as string || null;
    const typeId = formData.get('typeId') as string;
    const description = formData.get('description') as string;
    const cost = parseFloat(formData.get('cost') as string) || 0;
    const observation = formData.get('observation') as string;
    const alertLevel = String(formData.get('alertLevel') || 'MEDIUM');
    if (!['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(alertLevel)) return { success: false, error: 'Nível de atenção inválido.' };

    const dateStr = formData.get('date') as string;
    const dateQuery = new Date(dateStr).toISOString();

    let finalDriverId = driverId;

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
        status: 'OPEN',
        alert_level: alertLevel,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath('/dashboard/occurrences');
    return { success: true };
}

export async function resolveOccurrence(id: string) {
    await requireManager();
    const supabase = await createClient();

    const { error } = await supabase
        .from('occurrences')
        .update({ status: 'RESOLVED' })
        .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/dashboard/occurrences');
    return { success: true };
}

export async function setOccurrenceAlertLevel(id: string, level: string, reason: string, confirmed: boolean) {
    await requireManager();
    if (!['URGENT', 'HIGH', 'MEDIUM', 'LOW'].includes(level) || reason.trim().length < 10) {
        return { success: false, error: 'Nível ou justificativa inválida.' };
    }
    const supabase = await createClient();
    const { error } = await supabase.rpc('set_occurrence_alert_level', {
        p_occurrence_id: id, p_level: level, p_reason: reason.trim(), p_confirmed: confirmed,
    });
    if (error) return { success: false, error: error.message };
    revalidatePath('/dashboard/occurrences');
    revalidatePath('/dashboard/vehicles');
    return { success: true };
}

export async function updateOccurrence(id: string, formData: FormData) {
    await requireManager();
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
    await requireManager();
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
