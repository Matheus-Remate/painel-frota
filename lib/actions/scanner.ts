'use server';

import { createClient } from "@/lib/supabase/server";

export async function getVehicleStatus(vehicleId: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('vehicles')
            .select('status, id')
            .eq('id', vehicleId)
            .single();

        if (error) {
            console.error('Error fetching vehicle status:', error);
            return null;
        }

        return data;
    } catch (e) {
        console.error('Unexpected error fetching vehicle status:', e);
        return null;
    }
}
