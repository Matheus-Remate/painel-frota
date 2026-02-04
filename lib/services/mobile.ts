'use server';

import { createClient } from '@/lib/supabase/server';

export async function getVehicleDetails(id: string) {
    const supabase = await createClient();
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
        console.error('Error fetching vehicle:', error);
        return null;
    }
    return vehicle;
}

export async function getUnresolvedOccurrences(vehicleId: string) {
    const supabase = await createClient();
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
    const supabase = await createClient();
    const { data: checkin, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('checked_in_at', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching last checkin:', error);
    }

    return checkin;
}

// Simple server action to log a checkout (Retirada)
// Currently, we might just update the vehicle status or log an event.
// For now, let's update vehicle status to 'IN_USE'
export async function registerCheckout(vehicleId: string) {
    const supabase = await createClient();

    // Check if vehicle is already in use? Not strictly enforced yet as per requirements, 
    // but good to update status.

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
