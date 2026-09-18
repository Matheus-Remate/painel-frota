'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function requireQrVehicle(id: string, token: string) {
    if (!UUID_PATTERN.test(id) || !UUID_PATTERN.test(token)) return null;
    const admin = createAdminClient();
    const { data, error } = await admin
        .from('vehicles')
        .select('*, model:models(name, brand:brands(name))')
        .eq('id', id)
        .eq('qr_access_token', token)
        .is('deleted_at', null)
        .maybeSingle();
    if (error) console.error('Falha ao validar QR do veículo:', error.message);
    return data ?? null;
}

export async function getVehicleDetails(id: string, token: string) {
    return requireQrVehicle(id, token);
}

export async function getUnresolvedOccurrences(vehicleId: string, token: string) {
    if (!(await requireQrVehicle(vehicleId, token))) return [];
    const admin = createAdminClient();
    const { data, error } = await admin.from('occurrences')
        .select('id, date, description, status, alert_level, type:occurrence_types(name)')
        .eq('vehicle_id', vehicleId).neq('status', 'RESOLVED').order('date', { ascending: false });
    if (error) console.error('Falha ao buscar ocorrências:', error.message);
    return data ?? [];
}

export async function getLastCheckin(vehicleId: string, token: string) {
    if (!(await requireQrVehicle(vehicleId, token))) return null;
    const admin = createAdminClient();
    const { data, error } = await admin.from('check_ins')
        .select('id, checked_in_at, odometer, fuel_level, has_issues, resolved, alert_level, return_notes, repair_notes')
        .eq('vehicle_id', vehicleId).order('checked_in_at', { ascending: false }).limit(1).maybeSingle();
    if (error) console.error('Falha ao buscar última devolução:', error.message);
    return data ?? null;
}

export async function hasBlockingReturn(vehicleId: string, token: string) {
    if (!(await requireQrVehicle(vehicleId, token))) return false;
    const admin = createAdminClient();
    const { count } = await admin.from('check_ins').select('id', { count: 'exact', head: true })
        .eq('vehicle_id', vehicleId).eq('has_issues', true).eq('resolved', false)
        .in('alert_level', ['URGENT', 'HIGH']);
    return Boolean(count);
}

export async function getScheduledPickup(vehicleId: string, token: string) {
    if (!(await requireQrVehicle(vehicleId, token))) return null;
    const admin = createAdminClient();
    const now = new Date();
    const latestStart = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const { data, error } = await admin.from('reservations')
        .select('id, start_date, end_date, driver_id, driver:drivers(name)')
        .eq('vehicle_id', vehicleId).eq('status', 'ACTIVE')
        .gte('end_date', now.toISOString()).lte('start_date', latestStart.toISOString())
        .order('start_date', { ascending: true }).limit(1).maybeSingle();
    if (error) console.error('Falha ao consultar próxima retirada:', error.message);
    if (!data) return null;
    const driver = Array.isArray(data.driver) ? data.driver[0] : data.driver;
    return { ...data, driver: driver ?? null };
}

export async function getActiveCheckout(vehicleId: string, token: string) {
    const vehicle = await requireQrVehicle(vehicleId, token);
    if (!vehicle || vehicle.status !== 'ON_ROUTE') return null;
    const admin = createAdminClient();
    const { data } = await admin.from('vehicle_movements')
        .select('driver_name, driver_id, created_at').eq('vehicle_id', vehicleId)
        .eq('movement_type', 'CHECKOUT').order('created_at', { ascending: false }).limit(1).maybeSingle();
    return data ?? null;
}

export async function registerCheckout(formData: FormData) {
    const vehicleId = String(formData.get('vehicleId') ?? '');
    const token = String(formData.get('token') ?? '');
    const reservationId = String(formData.get('reservationId') ?? '');
    const driverName = String(formData.get('driverName') ?? '').trim();
    const odometer = Number(formData.get('odometer'));
    const notes = String(formData.get('notes') ?? '').trim();
    const fuelLevel = String(formData.get('fuelLevel') ?? '');
    const hasVariation = formData.get('hasVariation') === 'on';
    const acknowledged = formData.get('acknowledged') === 'on';
    const vehicle = await requireQrVehicle(vehicleId, token);

    if (!vehicle) return { success: false, error: 'QR Code inválido ou desativado.' };
    if (!UUID_PATTERN.test(reservationId)) return { success: false, error: 'Reserva inválida.' };
    if (driverName.length < 3) return { success: false, error: 'Informe o nome completo do condutor.' };
    if (!Number.isInteger(odometer) || odometer < Number(vehicle.odometer ?? 0)) {
        return { success: false, error: `O odômetro deve ser igual ou superior a ${vehicle.odometer ?? 0} km.` };
    }
    if (!acknowledged) return { success: false, error: 'Confirme que você conferiu as condições da última devolução.' };
    if (!['', 'EMPTY', '1/4', '1/2', '3/4', 'FULL'].includes(fuelLevel)) return { success: false, error: 'Combustível inválido.' };
    if (hasVariation && notes.length < 3) return { success: false, error: 'Descreva a divergência para o gestor.' };
    if (['AWAITING_REPAIR', 'IN_MAINTENANCE'].includes(vehicle.status)) {
        return { success: false, error: 'Veículo bloqueado para revisão ou manutenção. Procure o gestor da frota.' };
    }
    if (vehicle.status === 'ON_ROUTE') return { success: false, error: 'Este veículo já possui uma retirada em andamento.' };

    const admin = createAdminClient();
    const pickup = await getScheduledPickup(vehicleId, token);
    if (!pickup || pickup.id !== reservationId) return { success: false, error: 'Não há reserva ativa para esta retirada.' };
    if (!hasVariation && driverName !== pickup.driver?.name) return { success: false, error: 'Confirme o condutor previsto ou informe a divergência.' };
    if (!hasVariation && odometer !== Number(vehicle.odometer ?? 0)) return { success: false, error: 'Informe a divergência do odômetro.' };
    const lastReturn = await getLastCheckin(vehicleId, token);
    if (!hasVariation && fuelLevel !== (lastReturn?.fuel_level || '')) return { success: false, error: 'Informe a divergência do combustível.' };
    const { error: checkoutError } = await admin.rpc('register_vehicle_checkout', {
        p_vehicle_id: vehicleId, p_token: token, p_reservation_id: reservationId,
        p_driver_name: driverName, p_odometer: odometer, p_fuel_level: fuelLevel,
        p_notes: notes, p_has_variation: hasVariation,
    });
    if (checkoutError) return { success: false, error: 'Não foi possível registrar a retirada. Atualize a página e confira o status.' };

    revalidatePath(`/mobile/vehicle/${vehicleId}`);
    revalidatePath('/dashboard');
    return { success: true };
}

export async function registerEmergencyCheckout(formData: FormData) {
    const vehicleId = String(formData.get('vehicleId') ?? ''); const token = String(formData.get('token') ?? ''); const driverName = String(formData.get('driverName') ?? '').trim();
    if (!UUID_PATTERN.test(vehicleId) || !UUID_PATTERN.test(token) || driverName.length < 3) return { success: false, error: 'Informe o nome completo do condutor.' };
    const { error } = await createAdminClient().rpc('register_emergency_vehicle_checkout', { p_vehicle_id: vehicleId, p_token: token, p_driver_name: driverName });
    if (error) return { success: false, error: error.message || 'Retirada indisponível.' };
    revalidatePath(`/mobile/vehicle/${vehicleId}`); revalidatePath('/dashboard'); return { success: true };
}
