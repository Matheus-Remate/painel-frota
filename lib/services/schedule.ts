'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cache } from 'react';

export type Reservation = {
    id: string;
    vehicle_id: string;
    driver_id: string;
    start_date: string;
    end_date: string;
    purpose: string;
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    vehicle?: any;
    driver?: {
        name: string;
    };
};

export const getReservations = cache(async () => {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('reservations')
        .select(`
            id,
            vehicle_id,
            driver_id,
            start_date,
            end_date,
            purpose,
            status,
            vehicle:vehicles(
                license_plate,
                model:models(
                    name,
                    brand:brands(name)
                )
            ),
            driver:drivers(name)
        `)
        .neq('status', 'CANCELLED')
        .order('start_date', { ascending: true });

    if (error) throw error;
    return (data as unknown) as Reservation[];
});

export const getReservationById = cache(async (id: string) => {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('reservations')
        .select(`
            id,
            vehicle_id,
            driver_id,
            start_date,
            end_date,
            purpose,
            status,
            vehicle:vehicles(
                id,
                license_plate,
                model:models(
                    name,
                    brand:brands(name)
                )
            ),
            driver:drivers(name)
        `)
        .eq('id', id)
        .single();

    if (error) return null;
    return (data as unknown) as Reservation;
});

export async function updateReservation(id: string, formData: FormData) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Não autenticado.' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single();
    if (!profile || !['admin', 'gestor'].includes(profile.role)) {
        return { success: false, error: 'Sem permissão.' };
    }

    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const driverId = String(formData.get('driverId') || '');
    if (!driverId) return { success: false, error: 'Selecione o condutor.' };

    const { error } = await supabase.rpc('update_reservation_for_pickup', {
        p_reservation_id: id, p_driver_id: driverId,
        p_start_date: startDate, p_end_date: endDate,
        p_purpose: String(formData.get('purpose') || ''),
    });

    if (error) return { success: false, error: error.message };

    revalidatePath('/dashboard/schedule');
    return { success: true };
}

export async function cancelReservation(id: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Não autenticado.' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single();
    if (!profile || !['admin', 'gestor'].includes(profile.role)) {
        return { success: false, error: 'Sem permissão.' };
    }

    const { error } = await supabase
        .from('reservations')
        .update({ status: 'CANCELLED' })
        .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/dashboard/schedule');
    return { success: true };
}
