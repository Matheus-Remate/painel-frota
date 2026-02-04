'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { cache } from 'react';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'CANCELLED';

export interface VehicleRequest {
    id: string;
    requester_id: string;
    model_id: string | null;
    model_name: string | null;
    event_name: string;
    pickup_datetime: string;
    return_datetime: string;
    driver_name: string;
    status: RequestStatus;
    vehicle_id: string | null;
    approved_by: string | null;
    denial_reason: string | null;
    driver_id?: string | null;
    created_at: string;
    updated_at: string;
    model?: {
        name: string;
        brand: {
            name: string;
        };
    };
    vehicle?: {
        id: string;
        brand: string;
        model: string;
        license_plate: string;
    };
    requester?: {
        first_name: string;
        last_name: string;
        email: string;
    };
}

/**
 * Create a new vehicle request (Solicitante)
 */
export async function createRequest(formData: FormData) {
    const supabase = await createClient();

    // Get current user's profile
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Não autenticado.' };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!profile) {
        return { success: false, error: 'Perfil não encontrado.' };
    }

    // Get model name for backup
    const modelId = formData.get('modelId') as string;
    let modelName = null;

    if (modelId) {
        const { data: model } = await supabase
            .from('models')
            .select('name, brand:brands(name)')
            .eq('id', modelId)
            .single();

        if (model) {
            modelName = `${(model.brand as any)?.name} ${model.name}`;
        }
    }

    // Convert date to datetime format (add default time if only date provided)
    const pickupDate = formData.get('pickupDatetime') as string;
    const returnDate = formData.get('returnDatetime') as string;

    // If only date, append default times (08:00 for pickup, 18:00 for return)
    const pickupDatetime = pickupDate.includes('T') ? pickupDate : `${pickupDate}T08:00:00`;
    const returnDatetime = returnDate.includes('T') ? returnDate : `${returnDate}T18:00:00`;

    const driverId = formData.get('driverId') as string || null;
    let driverName = formData.get('driverName') as string;

    // If driverId is provided, ensure we have the most up-to-date name
    if (driverId) {
        const { data: driver } = await supabase
            .from('drivers')
            .select('name')
            .eq('id', driverId)
            .single();
        if (driver) driverName = driver.name;
    }

    const requestData = {
        requester_id: profile.id,
        model_id: modelId || null,
        model_name: modelName,
        event_name: formData.get('eventName') as string,
        pickup_datetime: pickupDatetime,
        return_datetime: returnDatetime,
        driver_id: driverId,
        driver_name: driverName,
        status: 'PENDING',
    };

    const { error } = await supabase
        .from('vehicle_requests')
        .insert(requestData);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/requests');
    revalidatePath('/dashboard/approvals');
    return { success: true };
}

/**
 * Get requests for current user (Solicitante view)
 */
export async function getMyRequests(): Promise<VehicleRequest[]> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!profile) return [];

    const { data, error } = await supabase
        .from('vehicle_requests')
        .select(`
            *,
            model:models(name, brand:brands(name)),
            vehicle:vehicles(
                id, 
                license_plate,
                model:models(
                    name,
                    brand:brands(name)
                )
            )
        `)
        .eq('requester_id', profile.id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as VehicleRequest[] || [];
}

/**
 * Get pending requests (Gestor/Admin view)
 */
export const getPendingRequests = cache(async (): Promise<VehicleRequest[]> => {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('vehicle_requests')
        .select(`
            *,
            model:models(name, brand:brands(name)),
            requester:profiles!requester_id(first_name, last_name, email)
        `)
        .eq('status', 'PENDING')
        .order('pickup_datetime', { ascending: true });

    if (error) throw error;
    return data as VehicleRequest[] || [];
});

/**
 * Get all requests (Gestor/Admin view)
 */
export const getAllRequests = cache(async (): Promise<VehicleRequest[]> => {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('vehicle_requests')
        .select(`
            *,
            model:models(name, brand:brands(name)),
            vehicle:vehicles(
                id, 
                license_plate,
                model:models(
                    name,
                    brand:brands(name)
                )
            ),
            requester:profiles!requester_id(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as VehicleRequest[] || [];
});

/**
 * Approve a request and assign a vehicle (Gestor/Admin)
 */
export async function approveRequest(requestId: string, vehicleId: string) {
    const supabase = await createClient();

    // Get current user's profile for approved_by
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Não autenticado.' };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('user_id', user.id)
        .single();

    if (!profile || !['admin', 'gestor'].includes(profile.role)) {
        return { success: false, error: 'Sem permissão para aprovar solicitações.' };
    }

    // Get the request details
    const { data: request } = await supabase
        .from('vehicle_requests')
        .select('*')
        .eq('id', requestId)
        .single();

    if (!request) {
        return { success: false, error: 'Solicitação não encontrada.' };
    }

    // Check vehicle availability
    const { data: conflicts } = await supabase
        .from('reservations')
        .select('id')
        .eq('vehicle_id', vehicleId)
        .neq('status', 'CANCELLED')
        .or(`and(start_date.lte.${request.return_datetime},end_date.gte.${request.pickup_datetime})`);

    if (conflicts && conflicts.length > 0) {
        return { success: false, error: 'Veículo não disponível nas datas solicitadas.' };
    }

    // Update request status
    const { error: updateError } = await supabase
        .from('vehicle_requests')
        .update({
            status: 'APPROVED',
            vehicle_id: vehicleId,
            approved_by: profile.id,
        })
        .eq('id', requestId);

    if (updateError) {
        return { success: false, error: updateError.message };
    }

    // Create reservation in the schedule
    const adminClient = createAdminClient();

    const { error: reservationError } = await adminClient
        .from('reservations')
        .insert({
            vehicle_id: vehicleId,
            driver_id: request.driver_id, // Link to the driver
            start_date: request.pickup_datetime,
            end_date: request.return_datetime,
            purpose: `${request.event_name} - Condutor: ${request.driver_name}`,
            status: 'ACTIVE',
        });

    if (reservationError) {
        // Rollback the request update
        await supabase
            .from('vehicle_requests')
            .update({ status: 'PENDING', vehicle_id: null, approved_by: null })
            .eq('id', requestId);

        return { success: false, error: 'Erro ao criar reserva: ' + reservationError.message };
    }

    revalidatePath('/dashboard/requests');
    revalidatePath('/dashboard/approvals');
    revalidatePath('/dashboard/schedule');
    revalidatePath('/dashboard');
    return { success: true };
}

/**
 * Deny a request (Gestor/Admin)
 */
export async function denyRequest(requestId: string, reason: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Não autenticado.' };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('user_id', user.id)
        .single();

    if (!profile || !['admin', 'gestor'].includes(profile.role)) {
        return { success: false, error: 'Sem permissão para negar solicitações.' };
    }

    const { error } = await supabase
        .from('vehicle_requests')
        .update({
            status: 'DENIED',
            denial_reason: reason,
            approved_by: profile.id,
        })
        .eq('id', requestId);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/requests');
    revalidatePath('/dashboard/approvals');
    return { success: true };
}

/**
 * Get available vehicles for a date range (shows ALL vehicles, checks availability)
 */
export async function getAvailableVehicles(modelId: string | null, pickupDate: string, returnDate: string) {
    const supabase = await createClient();

    // Get all vehicles that are not deleted
    const { data: vehicles } = await supabase
        .from('vehicles')
        .select(`
            *,
            model:models(
                id,
                name,
                brand:brands(id, name)
            )
        `)
        .is('deleted_at', null)
        .neq('usage_category', 'Fixo')
        .order('created_at', { ascending: false });

    if (!vehicles || vehicles.length === 0) {
        return [];
    }

    // Optimization: Fetch ALL conflicting reservations for this period in one query
    const { data: allConflicts } = await supabase
        .from('reservations')
        .select('vehicle_id')
        .neq('status', 'CANCELLED')
        .or(`and(start_date.lt.${returnDate},end_date.gt.${pickupDate})`);

    // Map of vehicle IDs that have conflicts
    const conflictedVehicleIds = new Set(allConflicts?.map(c => c.vehicle_id) || []);

    // Check availability for each vehicle
    const vehiclesWithStatus = vehicles.map(vehicle => ({
        ...vehicle,
        isAvailable: !conflictedVehicleIds.has(vehicle.id)
    }));

    // Sort: Available first, then by license plate
    return vehiclesWithStatus.sort((a, b) => {
        if (a.isAvailable === b.isAvailable) {
            return a.license_plate.localeCompare(b.license_plate);
        }
        return a.isAvailable ? -1 : 1;
    });
}

/**
 * Update an existing request (Solicitante) - only if PENDING
 */
export async function updateRequest(requestId: string, formData: FormData) {
    const supabase = await createClient();

    // Verification of ownership is important
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Não autenticado.' };

    const { data: request } = await supabase
        .from('vehicle_requests')
        .select('requester_id, status')
        .eq('id', requestId)
        .single();

    if (!request) return { success: false, error: 'Solicitação não encontrada.' };

    // Check ownership
    const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
    if (request.requester_id !== profile?.id) {
        return { success: false, error: 'Sem permissão.' };
    }

    if (request.status !== 'PENDING') {
        return { success: false, error: 'Apenas solicitações pendentes podem ser editadas.' };
    }

    // Logic similar to createRequest for parsing fields
    const modelId = formData.get('modelId') as string;
    let modelName = null;
    if (modelId) {
        const { data: model } = await supabase.from('models').select('name, brand:brands(name)').eq('id', modelId).single();
        if (model) modelName = `${(model.brand as any)?.name} ${model.name}`;
    }

    const pickupDate = formData.get('pickupDatetime') as string;
    const returnDate = formData.get('returnDatetime') as string;
    const pickupDatetime = pickupDate.includes('T') ? pickupDate : `${pickupDate}T08:00:00`;
    const returnDatetime = returnDate.includes('T') ? returnDate : `${returnDate}T18:00:00`;

    const driverId = formData.get('driverId') as string || null;
    let driverName = formData.get('driverName') as string;

    if (driverId) {
        const { data: driver } = await supabase.from('drivers').select('name').eq('id', driverId).single();
        if (driver) driverName = driver.name;
    }

    const updateData = {
        model_id: modelId || null,
        model_name: modelName,
        event_name: formData.get('eventName') as string,
        pickup_datetime: pickupDatetime,
        return_datetime: returnDatetime,
        driver_id: driverId,
        driver_name: driverName,
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
        .from('vehicle_requests')
        .update(updateData)
        .eq('id', requestId);

    if (error) return { success: false, error: error.message };

    revalidatePath('/dashboard/requests');
    revalidatePath('/dashboard/approvals');
    return { success: true };
}

/**
 * Delete (Cancel) a request (Solicitante) - only if PENDING
 */
export async function deleteRequest(requestId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Não autenticado.' };

    const { data: request } = await supabase
        .from('vehicle_requests')
        .select('requester_id, status')
        .eq('id', requestId)
        .single();

    if (!request) return { success: false, error: 'Solicitação não encontrada.' };

    const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
    if (request.requester_id !== profile?.id) {
        return { success: false, error: 'Sem permissão.' };
    }

    if (request.status !== 'PENDING') {
        return { success: false, error: 'Apenas solicitações pendentes podem ser canceladas.' };
    }

    const { error } = await supabase
        .from('vehicle_requests')
        .delete() // Physically delete for now as per "deletar" request, or status update if preferred. 
        // User asked "deletar", and "cancelar" usually implies soft delete.
        // Given I added CANCELLED type, I should probably UPDATE to CANCELLED.
        // But user explicitly said "deletar".
        // Let's stick to DELETE for PENDING requests.
        .eq('id', requestId);

    if (error) return { success: false, error: error.message };

    revalidatePath('/dashboard/requests');
    revalidatePath('/dashboard/approvals');
    return { success: true };
}

export async function getRequestById(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('vehicle_requests')
        .select(`
            *,
            model:models(id, name, brand:brands(name))
        `)
        .eq('id', id)
        .single();

    if (error) return null;
    return data as VehicleRequest;
}
