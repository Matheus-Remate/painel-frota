'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { cache } from 'react';
import { requireManager } from '@/lib/security/authorization';
import { signChecklistPhotos, signCheckinPhotos } from '@/lib/services/photos';
import { generateVehicleQRCode } from '@/lib/utils/qrcode';

export type FleetSearchResult = {
    id: string;
    kind: 'vehicle' | 'driver' | 'reservation';
    title: string;
    subtitle: string;
    href: string;
};

export async function searchFleet(query: string): Promise<FleetSearchResult[]> {
    await requireManager();
    const term = query.trim();
    if (term.length < 2) return [];

    const supabase = await createClient();
    const pattern = `%${term}%`;
    const [{ data: vehicles, error: vehicleError }, { data: drivers, error: driverError }, { data: reservations, error: reservationError }] = await Promise.all([
        supabase.from('vehicles').select('id, license_plate, model:models(name, brand:brands(name))').is('deleted_at', null).ilike('license_plate', pattern).limit(6),
        supabase.from('drivers').select('id, name, cnh_category').is('deleted_at', null).ilike('name', pattern).limit(6),
        supabase.from('reservations').select('id, vehicle_id, purpose, driver_name, driver:drivers(name), vehicle:vehicles(id, license_plate, model:models(name, brand:brands(name)))').or(`purpose.ilike.${pattern},driver_name.ilike.${pattern}`).neq('status', 'CANCELLED').limit(6),
    ]);
    if (vehicleError || reservationError) throw vehicleError || reservationError;
    if (driverError) throw driverError;

    return [
        ...(vehicles || []).map((vehicle: any) => ({ id: vehicle.id, kind: 'vehicle' as const, title: `${vehicle.model?.brand?.name || ''} ${vehicle.model?.name || 'Veículo'}`.trim(), subtitle: vehicle.license_plate, href: `/dashboard/vehicles/${vehicle.id}` })),
        ...(drivers || []).map((driver: any) => ({ id: driver.id, kind: 'driver' as const, title: driver.name, subtitle: driver.cnh_category ? `CNH ${driver.cnh_category}` : 'Condutor', href: `/dashboard/drivers/${driver.id}/edit` })),
        ...(reservations || []).map((reservation: any) => { const vehicle = Array.isArray(reservation.vehicle) ? reservation.vehicle[0] : reservation.vehicle; const driver = Array.isArray(reservation.driver) ? reservation.driver[0] : reservation.driver; return { id: reservation.id, kind: 'reservation' as const, title: `${vehicle?.model?.brand?.name || ''} ${vehicle?.model?.name || 'Veículo'}`.trim(), subtitle: `${vehicle?.license_plate || ''} · ${reservation.purpose || 'Evento'} · ${reservation.driver_name || driver?.name || 'Condutor não informado'}`, href: `/dashboard/vehicles/${vehicle?.id || reservation.vehicle_id}` }; }),
    ].slice(0, 8);
}

export async function getVehicleQrPreviews() {
    await requireManager();
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('vehicles')
        .select('id, license_plate, qr_access_token, model:models(name, brand:brands(name))')
        .is('deleted_at', null)
        .order('license_plate')
        .limit(100);
    if (error) throw error;
    return Promise.all((data || []).map(async (vehicle: any) => ({
        id: vehicle.id,
        licensePlate: vehicle.license_plate,
        label: `${vehicle.model?.brand?.name || ''} ${vehicle.model?.name || 'Veículo'} — ${vehicle.license_plate}`.trim(),
        qrCodeUrl: (await generateVehicleQRCode(vehicle.id, vehicle.license_plate, vehicle.qr_access_token)).dataUrl,
    })));
}

export async function resolveCheckin(id: string, notes: string) {
    const authorized = await requireManager();
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
        .from('check_ins')
        .update({
            resolved: true,
            resolved_at: new Date().toISOString(),
            // check_ins.resolved_by referencia profiles.id, não auth.users.id.
            resolved_by: authorized.profileId,
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
            .eq('vehicle_id', checkin.vehicle_id).eq('has_issues', true).eq('resolved', false)
            .in('alert_level', ['URGENT', 'HIGH']);
        const { count: occurrenceCount } = await supabaseAdmin.from('occurrences').select('id', { count: 'exact', head: true })
            .eq('vehicle_id', checkin.vehicle_id).neq('status', 'RESOLVED').in('alert_level', ['URGENT', 'HIGH']);
        if (!count && !occurrenceCount) await supabaseAdmin.from('vehicles').update({ status: 'IN_YARD' }).eq('id', checkin.vehicle_id).eq('status', 'AWAITING_REPAIR');
    }

    revalidatePath('/dashboard/checkins');
    revalidatePath('/dashboard/vehicles');
    return { success: true };
}

export async function setCheckinAlertLevel(id: string, level: string, reason: string, confirmed: boolean) {
    await requireManager();
    if (!['URGENT', 'HIGH', 'MEDIUM', 'LOW'].includes(level) || reason.trim().length < 10) {
        return { success: false, error: 'Selecione o nível e descreva a justificativa (mínimo 10 caracteres).' };
    }
    const supabase = await createClient();
    const { error } = await supabase.rpc('set_checkin_alert_level', {
        p_check_in_id: id, p_level: level, p_reason: reason.trim(),
        p_declaration: confirmed ? 'CONFIRMO' : '',
    });
    if (error) return { success: false, error: error.message };
    revalidatePath('/dashboard/checkins');
    revalidatePath('/dashboard/vehicles');
    return { success: true };
}

export async function correctCheckinData(id: string, odometer: number, fuel: string, notes: string, reason: string) {
    await requireManager();
    if (!Number.isInteger(odometer) || odometer < 0 || !['EMPTY', '1/4', '1/2', '3/4', 'FULL'].includes(fuel) || reason.trim().length < 10) {
        return { success: false, error: 'Confira odômetro, combustível e justificativa (mínimo 10 caracteres).' };
    }
    const supabase = await createClient();
    const { error } = await supabase.rpc('correct_checkin_data', {
        p_check_in_id: id, p_odometer: odometer, p_fuel: fuel,
        p_notes: notes.trim(), p_reason: reason.trim(),
    });
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
            nickname,
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
            ),
            reservations(start_date, end_date, status)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (error) throw error;
    const now = Date.now();
    return (data || []).map((vehicle: any) => ({ ...vehicle, operational_status: ['AWAITING_REPAIR', 'IN_MAINTENANCE'].includes(vehicle.status) ? vehicle.status : (vehicle.status === 'ON_ROUTE' || (vehicle.reservations || []).some((reservation: any) => reservation.status === 'ACTIVE' && new Date(reservation.start_date).getTime() <= now && new Date(reservation.end_date).getTime() >= now) ? 'ON_ROUTE' : vehicle.status) }));
});

export const getVehicleById = cache(async (id: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('vehicles')
        .select(`
        id,
        license_plate,
        nickname,
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
          repair_notes,
          alert_level,
          resolved,
          fuel_level,
          return_notes,
          checklist,
          photo_paths,
          photos,
          driver:drivers(name)
        ),
        reservations (
          id,
          driver_id,
          driver_name,
          start_date,
          end_date,
          purpose,
          status,
          is_emergency,
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

    if (data && data.reservations) {
        data.reservations = data.reservations
            .filter((reservation: any) => reservation.status !== 'CANCELLED')
            .sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    }
    if (data) {
        const now = Date.now();
        (data as any).operational_status = ['AWAITING_REPAIR', 'IN_MAINTENANCE'].includes(data.status) ? data.status : (data.status === 'ON_ROUTE' || (data.reservations || []).some((reservation: any) => reservation.status === 'ACTIVE' && new Date(reservation.start_date).getTime() <= now && new Date(reservation.end_date).getTime() >= now) ? 'ON_ROUTE' : data.status);
    }

    if (!data) return data;

    return {
        ...data,
        check_ins: await Promise.all((data.check_ins || []).map(async (checkin: any) => ({
            ...checkin,
            checklist: await signChecklistPhotos(checkin.checklist),
            photos: await signCheckinPhotos(checkin.photo_paths, checkin.photos),
        }))),
    };
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
    await requireManager();
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('check_ins')
        .select(`
      id,
      vehicle_id,
      driver_id,
      odometer,
      has_issues,
      alert_level,
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
      corrections:checkin_data_corrections(
        id,
        manager_user_id,
        previous_odometer,
        corrected_odometer,
        previous_fuel,
        corrected_fuel,
        previous_notes,
        corrected_notes,
        reason,
        created_at
      ),
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

    const checkins = data || [];
    const managerIds = [...new Set(checkins.flatMap((item: any) =>
        (item.corrections || []).map((correction: any) => correction.manager_user_id).filter(Boolean),
    ))];
    const { data: managers, error: managersError } = managerIds.length
        ? await supabase.from('profiles').select('user_id, first_name, last_name').in('user_id', managerIds)
        : { data: [], error: null };
    if (managersError) throw managersError;

    const managerNames = new Map((managers || []).map((manager) => [
        manager.user_id,
        `${manager.first_name || ''} ${manager.last_name || ''}`.trim() || 'Gestor não identificado',
    ]));

    return Promise.all(checkins.map(async (item: any) => ({
        ...item,
        checklist: await signChecklistPhotos(item.checklist),
        photos: await signCheckinPhotos(item.photo_paths, item.photos),
        corrections: (item.corrections || []).map((correction: any) => ({
            ...correction,
            manager_name: managerNames.get(correction.manager_user_id) || 'Gestor não identificado',
        })),
    })));
});
