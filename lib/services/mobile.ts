'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function getVehicleDetails(id: string) {
    const supabase = createAdminClient();
    const { data: vehicle, error } = await supabase
        .from('vehicles')
        .select(`
            *,
            model:models(
                name,
                brand:brands(name)
            )
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching vehicle:', JSON.stringify(error, null, 2));
        return null;
    }
    return vehicle;
}

export async function getUnresolvedOccurrences(vehicleId: string) {
    const supabase = createAdminClient();
    const { data: occurrences, error } = await supabase
        .from('occurrences')
        .select(`
            *,
            type:occurrence_types(name)
        `)
        .eq('vehicle_id', vehicleId)
        .neq('status', 'RESOLVED')
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching occurrences:', error);
        return [];
    }
    return occurrences;
}

export async function getLastCheckin(vehicleId: string) {
    const supabase = createAdminClient();
    const { data: checkin, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('checked_in_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('Error fetching last checkin:', error);
    }

    return checkin;
}

// Simple server action to log a checkout (Retirada)
export async function registerCheckout(formDataOrId: string | FormData) {
    const supabase = createAdminClient();

    let vehicleId: string;
    if (typeof formDataOrId === 'string') {
        vehicleId = formDataOrId;
    } else {
        vehicleId = formDataOrId.get('id') as string || '';
    }

    const { error } = await supabase
        .from('vehicles')
        .update({ status: 'IN_USE' })
        .eq('id', vehicleId);

    if (error) {
        console.error('Error updating vehicle status:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function getVehicleHistory(vehicleId: string) {
    const supabase = createAdminClient();

    // Buscar últimos 5 check-ins (Reports) que tiveram alertas
    const { data: history, error } = await supabase
        .from('check_ins')
        .select(`
            id,
            checked_in_at,
            driver:drivers(name),
            has_issues,
            resolved,
            resolved_at,
            resolution_notes,
            checklist
        `)
        .eq('vehicle_id', vehicleId)
        .eq('has_issues', true)
        .order('checked_in_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching vehicle history:', error);
        return [];
    }

    return history;
}
