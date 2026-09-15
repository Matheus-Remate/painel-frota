'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { signChecklistPhotos } from './photos';

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
        .select('id, date, description, status, type:occurrence_types(name)')
        .eq('vehicle_id', vehicleId).neq('status', 'RESOLVED').order('date', { ascending: false });
    if (error) console.error('Falha ao buscar ocorrências:', error.message);
    return data ?? [];
}

export async function getLastCheckin(vehicleId: string, token: string) {
    if (!(await requireQrVehicle(vehicleId, token))) return null;
    const admin = createAdminClient();
    const { data, error } = await admin.from('check_ins')
        .select('id, checked_in_at, driver_name, odometer, fuel_level, has_issues, return_notes, repair_notes, checklist')
        .eq('vehicle_id', vehicleId).order('checked_in_at', { ascending: false }).limit(1).maybeSingle();
    if (error) console.error('Falha ao buscar última devolução:', error.message);
    return data ? { ...data, checklist: await signChecklistPhotos(data.checklist) } : null;
}

export async function registerCheckout(formData: FormData) {
    const vehicleId = String(formData.get('vehicleId') ?? '');
    const token = String(formData.get('token') ?? '');
    const driverName = String(formData.get('driverName') ?? '').trim();
    const odometer = Number(formData.get('odometer'));
    const acknowledged = formData.get('acknowledged') === 'on';
    const vehicle = await requireQrVehicle(vehicleId, token);

    if (!vehicle) return { success: false, error: 'QR Code inválido ou desativado.' };
    if (driverName.length < 3) return { success: false, error: 'Informe o nome completo do condutor.' };
    if (!Number.isInteger(odometer) || odometer < Number(vehicle.odometer ?? 0)) {
        return { success: false, error: `O odômetro deve ser igual ou superior a ${vehicle.odometer ?? 0} km.` };
    }
    if (!acknowledged) return { success: false, error: 'Confirme que você conferiu as condições da última devolução.' };
    if (['AWAITING_REPAIR', 'IN_MAINTENANCE'].includes(vehicle.status)) {
        return { success: false, error: 'Veículo bloqueado para manutenção. Procure o gestor da frota.' };
    }
    if (vehicle.status === 'ON_ROUTE') return { success: false, error: 'Este veículo já possui uma retirada em andamento.' };

    const admin = createAdminClient();
    const { error: checkoutError } = await admin.rpc('register_vehicle_checkout', {
        p_vehicle_id: vehicleId, p_token: token, p_driver_name: driverName, p_odometer: odometer,
    });
    if (checkoutError) return { success: false, error: 'Não foi possível registrar a retirada. Atualize a página e confira o status.' };

    revalidatePath(`/mobile/vehicle/${vehicleId}`);
    revalidatePath('/dashboard');
    return { success: true };
}

export async function getVehicleHistory(vehicleId: string, token: string) {
    if (!(await requireQrVehicle(vehicleId, token))) return [];
    const admin = createAdminClient();
    const { data, error } = await admin.from('check_ins')
        .select('id, checked_in_at, driver_name, has_issues, resolved, resolved_at, resolution_notes, fuel_level, odometer, checklist')
        .eq('vehicle_id', vehicleId).order('checked_in_at', { ascending: false }).limit(5);
    if (error) console.error('Falha ao buscar histórico:', error.message);
    return Promise.all((data ?? []).map(async (item) => ({ ...item, checklist: await signChecklistPhotos(item.checklist) })));
}
