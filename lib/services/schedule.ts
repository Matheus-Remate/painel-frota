'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cache } from 'react';

export type Reservation = {
    id: string;
    vehicle_id: string;
    driver_id: string | null;
    driver_name?: string | null;
    is_emergency?: boolean;
    start_date: string;
    end_date: string;
    purpose: string;
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    vehicle?: any;
    driver?: {
        name: string;
    };
    request?: { event_name: string; model_name: string | null; driver_name: string; pickup_datetime: string; return_datetime: string; requester?: { first_name: string; last_name: string } | null; approver?: { first_name: string; last_name: string } | null } | null;
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
    const reservations = (data || []) as unknown as Reservation[];
    const { data: approvedRequests, error: requestError } = await supabase.from('vehicle_requests').select(`vehicle_id, event_name, model_name, driver_name, pickup_datetime, return_datetime, requester:profiles!requester_id(first_name, last_name), approver:profiles!approved_by(first_name, last_name)`).eq('status', 'APPROVED');
    if (requestError) throw requestError;
    const requestByAllocation = new Map((approvedRequests || []).map((request: any) => [`${request.vehicle_id}:${new Date(request.pickup_datetime).getTime()}:${new Date(request.return_datetime).getTime()}`, request]));
    return reservations.map((reservation) => ({ ...reservation, request: requestByAllocation.get(`${reservation.vehicle_id}:${new Date(reservation.start_date).getTime()}:${new Date(reservation.end_date).getTime()}`) || null }));
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

    const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .select('vehicle_id, is_emergency')
        .eq('id', id)
        .single();
    if (reservationError || !reservation) return { success: false, error: 'Reserva não encontrada.' };
    if (reservation.is_emergency) return { success: false, error: 'Reservas emergenciais são encerradas pela devolução e não podem ser editadas.' };

    const { error } = await supabase.rpc('update_reservation_for_pickup', {
        p_reservation_id: id, p_driver_id: driverId,
        p_start_date: startDate, p_end_date: endDate,
        p_purpose: String(formData.get('purpose') || ''),
    });

    if (error) return { success: false, error: error.message };

    revalidatePath('/dashboard/schedule');
    revalidatePath(`/dashboard/vehicles/${reservation.vehicle_id}`);
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
