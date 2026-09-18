'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { CHECKIN_BUCKET } from '@/lib/services/photos';
import { revalidatePath } from 'next/cache';

type ChecklistItem = { status: 'OK' | 'REVIEW'; notes: string; severity?: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'; photoPath?: string };
type Checklist = Record<string, ChecklistItem>;

const ALLOWED_FUEL = new Set(['EMPTY', '1/4', '1/2', '3/4', 'FULL']);
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

function parseChecklist(raw: FormDataEntryValue | null): Checklist | null {
    try {
        const value = JSON.parse(String(raw ?? '{}')) as unknown;
        if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
        const entries = Object.entries(value);
        if (!entries.length) return null;
        const checklist: Checklist = {};
        for (const [key, item] of entries) {
            if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
            const candidate = item as Record<string, unknown>;
            if (candidate.status !== 'OK' && candidate.status !== 'REVIEW') return null;
            const notes = String(candidate.notes ?? '').trim();
            if (candidate.status === 'REVIEW' && notes.length < 3) return null;
            const severity = candidate.severity;
            if (candidate.status === 'REVIEW' && !['URGENT', 'HIGH', 'MEDIUM', 'LOW'].includes(String(severity))) return null;
            checklist[key] = { status: candidate.status, notes,
                ...(candidate.status === 'REVIEW' ? { severity: severity as ChecklistItem['severity'] } : {}) };
        }
        return checklist;
    } catch {
        return null;
    }
}

export async function createCheckin(formData: FormData) {
    const vehicleId = String(formData.get('vehicleId') ?? '');
    const token = String(formData.get('token') ?? '');
    const driverName = String(formData.get('driverName') ?? '').trim();
    const returnNotes = String(formData.get('notes') ?? '').trim();
    const odometer = Number(formData.get('odometer'));
    const fuelLevel = String(formData.get('fuelLevel') ?? '');
    const checklist = parseChecklist(formData.get('checklist'));
    const admin = createAdminClient();

    const { data: vehicle } = await admin.from('vehicles')
        .select('id, license_plate, odometer, status')
        .eq('id', vehicleId).eq('qr_access_token', token).is('deleted_at', null).maybeSingle();
    if (!vehicle) return { success: false, error: 'QR Code inválido ou desativado.' };
    if (driverName.length < 3) return { success: false, error: 'Informe o nome completo do condutor.' };
    if (!Number.isInteger(odometer) || odometer < Number(vehicle.odometer ?? 0)) {
        return { success: false, error: `O odômetro deve ser igual ou superior a ${vehicle.odometer ?? 0} km.` };
    }
    if (!ALLOWED_FUEL.has(fuelLevel)) return { success: false, error: 'Informe o nível de combustível.' };
    if (!checklist) return { success: false, error: 'Revise todos os itens e descreva cada problema informado.' };

    const photos = Array.from(formData.entries()).filter(
        (entry): entry is [string, File] => entry[0].startsWith('photo_') && entry[1] instanceof File && entry[1].size > 0,
    );
    if (photos.some(([key]) => !checklist[key.slice('photo_'.length)])) {
        return { success: false, error: 'Uma foto não corresponde a um item do checklist.' };
    }
    if (photos.some(([, file]) => !ALLOWED_IMAGE_TYPES.has(file.type) || file.size > MAX_PHOTO_BYTES)) {
        return { success: false, error: 'As fotos devem ser JPEG, PNG, WebP ou HEIC e ter no máximo 5 MB.' };
    }

    const uploadedPaths: string[] = [];
    try {
        for (const [key, value] of photos) {
            const itemId = key.slice('photo_'.length);
            const extension = value.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg';
            const path = `${vehicleId}/${crypto.randomUUID()}.${extension}`;
            const { error } = await admin.storage.from(CHECKIN_BUCKET).upload(path, value, { contentType: value.type, upsert: false });
            if (error) throw new Error(`Falha ao enviar foto: ${error.message}`);
            checklist[itemId].photoPath = path;
            uploadedPaths.push(path);
        }

        const hasIssues = Object.values(checklist).some((item) => item.status === 'REVIEW');
        const { error: insertError } = await admin.rpc('register_vehicle_return', {
            p_vehicle_id: vehicleId, p_token: token, p_driver_name: driverName, p_odometer: odometer,
            p_fuel_level: fuelLevel, p_notes: returnNotes, p_checklist: checklist,
            p_photo_paths: uploadedPaths, p_has_issues: hasIssues,
        });
        if (insertError) throw new Error(`Falha ao salvar devolução: ${insertError.message}`);

        revalidatePath('/dashboard/checkins');
        revalidatePath('/dashboard/vehicles');
        revalidatePath(`/mobile/vehicle/${vehicleId}`);
        return { success: true };
    } catch (error) {
        if (uploadedPaths.length) await admin.storage.from(CHECKIN_BUCKET).remove(uploadedPaths);
        console.error('Falha ao registrar devolução:', error);
        return { success: false, error: 'Não foi possível registrar a devolução. Os dados não foram confirmados.' };
    }
}
