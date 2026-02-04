'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { cache } from 'react';

export async function resolveCheckin(id: string, notes: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get the profile ID for the current user
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

    const { error } = await supabase
        .from('check_ins')
        .update({
            resolved: true,
            resolved_at: new Date().toISOString(),
            resolved_by: profile?.id,
            resolution_notes: notes
        })
        .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/dashboard/checkins');
    revalidatePath('/dashboard/vehicles');
    return { success: true };
}

export const getVehicles = cache(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('vehicles')
        .select(`
            id,
            license_plate,
            chassis,
            year,
            fuel_type,
            color,
            status,
            usage_category,
            model_id,
            model:models(
                id,
                name,
                brand:brands(id, name)
            )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
});

export const getVehicleById = cache(async (id: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('vehicles')
        .select(`
        id,
        license_plate,
        chassis,
        year,
        fuel_type,
        color,
        status,
        usage_category,
        model_id,
        model:models(
            id,
            name,
            brand:brands(id, name)
        ),
        check_ins (
          id,
          checked_in_at,
          odometer,
          has_issues,
          cleanliness_status,
          dash_lights_status,
          tires_exterior_status,
          driver:drivers(name)
        )
      `)
        .eq('id', id)
        .is('deleted_at', null)
        .single();

    if (error) throw error;

    // Ordenar check-ins por data (mais recente primeiro)
    if (data && data.check_ins) {
        data.check_ins.sort((a: any, b: any) =>
            new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime()
        );
    }

    return data;
});

export const getDrivers = cache(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('drivers')
        .select('id, name, cpf, cnh_category, cnh_expiration')
        .is('deleted_at', null)
        .order('name', { ascending: true });

    if (error) throw error;
    return data;
});

export const getCheckins = cache(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('check_ins')
        .select(`
      id,
      vehicle_id,
      driver_id,
      odometer,
      has_issues,
      checked_in_at,
      cleanliness_status,
      dash_lights_status,
      tires_exterior_status,
      fuel_level,
      photos,
      repair_notes,
      resolved,
      resolution_notes,
      vehicle:vehicles(
        license_plate,
        model:models(
          name,
          brand:brands(name)
        )
      ),
      driver:drivers(name)
    `)
        .order('checked_in_at', { ascending: false });

    if (error) throw error;
    return data;
});
