'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { cache } from 'react';
import { requireManager } from '@/lib/security/authorization';
import { signChecklistPhotos, signCheckinPhotos } from '@/lib/services/photos';

export async function resolveCheckin(id: string, notes: string) {
    const authorized = await requireManager();
    const supabaseAdmin = createAdminClient();
    const supabase = await createClient();
    // Get the profile ID for the current user (if any)
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', authorized.id)
        .single();

    const { error } = await supabaseAdmin
        .from('check_ins')
        .update({
            resolved: true,
            resolved_at: new Date().toISOString(),
            resolved_by: profile?.id,
            resolution_notes: notes
        })
        .eq('id', id);

    if (error) {
        console.error('Resolution error:', error);
        return { success: false, error: error.message };
    }

    const { data: checkin } = await supabaseAdmin.from('check_ins').select('vehicle_id').eq('id', id).single();
    if (checkin) {
        const { count } = await supabaseAdmin.from('check_ins').select('id', { count: 'exact', head: true })
            .eq('vehicle_id', checkin.vehicle_id).eq('has_issues', true).eq('resolved', false);
        if (!count) await supabaseAdmin.from('vehicles').update({ status: 'IN_YARD' }).eq('id', checkin.vehicle_id).eq('status', 'AWAITING_REPAIR');
    }

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
            odometer,
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
        odometer,
        renavam,
        capacity,
        qr_access_token,
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
          driver_name,
          fuel_level,
          return_notes,
          checklist,
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
    if (error) throw error;
    return data;
});

export const getDriverById = cache(async (id: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('drivers')
        .select('id, name, cpf, cnh_category, cnh_expiration')
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
});

export const getDriverByUserId = cache(async (userId: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('drivers')
        .select('id, name, cpf, cnh_category, cnh_expiration')
        .eq('user_id', userId)
        .single();

    if (error) return null;
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
      checklist,
      driver_name,
      return_notes,
      photo_paths,
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
    return Promise.all((data || []).map(async (item) => ({
        ...item,
        checklist: await signChecklistPhotos(item.checklist),
        photos: await signCheckinPhotos(item.photo_paths, item.photos),
    })));
});
