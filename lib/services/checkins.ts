'use server';

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function createCheckin(formData: FormData, lastKnownOdometer?: number) {
    const supabase = await createClient(); // Still needed for auth/storage session
    const adminSupabase = createAdminClient(); // Needed for RLS bypass on writes
    const vehicleId = formData.get('vehicleId') as string;

    try {
        // ... (parsing logic remains the same)
        const odometerStr = formData.get('odometer') as string;
        const odometer = parseInt(odometerStr) || lastKnownOdometer || 0;
        const notes = (formData.get('notes') as string) || '';
        const fuelLevel = (formData.get('fuelLevel') as string) || 'Não informado';
        const driverName = (formData.get('driverName') as string) || 'Condutor não identificado';
        const checklistJson = formData.get('checklist') as string;

        let checklist: any = {};
        if (checklistJson) {
            try {
                checklist = JSON.parse(checklistJson);
            } catch (e) {
                console.error('Error parsing checklist JSON:', e);
            }
        }

        // Ensure driver name is stored
        checklist.driver_name = driverName;

        const cleanliness = formData.get('status_0') === 'OK' ? 'OK' : 'ALERT';
        const tiresExterior = formData.get('status_1') === 'OK' ? 'OK' : 'ALERT';
        const dashLights = formData.get('status_2') === 'OK' ? 'OK' : 'ALERT';

        // Process Photos
        const photoUrls: string[] = [];
        const entries = Array.from(formData.entries());

        for (const [key, value] of entries) {
            if (value instanceof File && value.size > 0) {
                const isItemPhoto = key.startsWith('photo_');
                const fileExt = value.name.split('.').pop();
                const fileName = `${vehicleId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

                // Storage upload - keep using regular client (Bucket is public or session based)
                const { error: uploadError } = await supabase.storage
                    .from('checkin-photos')
                    .upload(fileName, value);

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('checkin-photos')
                        .getPublicUrl(fileName);

                    photoUrls.push(publicUrl);

                    if (isItemPhoto) {
                        const itemId = key.replace('photo_', '');
                        if (checklist[itemId]) {
                            checklist[itemId].photoUrl = publicUrl;
                        } else {
                            checklist[itemId] = { status: 'REVIEW', photoUrl: publicUrl };
                        }
                    }
                }
            }
        }

        const { data: { user } } = await supabase.auth.getUser();
        let driverId = null;

        if (user) {
            // Use admin to ensure we can read drivers if RLS is tight
            const { data: driver } = await adminSupabase
                .from('drivers')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();
            driverId = driver?.id;
        }

        const checkinData = {
            vehicle_id: vehicleId,
            driver_id: driverId,
            odometer,
            cleanliness_status: cleanliness,
            tires_exterior_status: tiresExterior,
            dash_lights_status: dashLights,
            repair_notes: notes,
            fuel_level: fuelLevel,
            photos: photoUrls,
            checklist: checklist,
            has_issues: photoUrls.length > 0 || notes.trim().length > 0 || (checklist && Object.values(checklist).some((v: any) => v.status !== 'OK')),
            checked_in_at: new Date().toISOString(),
        };

        const { error: insertError } = await adminSupabase
            .from('check_ins')
            .insert(checkinData);

        if (insertError) {
            console.error('DB Insert Error:', insertError);
            return { success: false, error: 'Erro ao salvar check-in.' };
        }

        // Update vehicle status using Admin to bypass RLS
        await adminSupabase
            .from('vehicles')
            .update({
                odometer: odometer,
                status: 'IN_YARD'
            })
            .eq('id', vehicleId);

        revalidatePath('/dashboard/checkins');
        revalidatePath('/dashboard/vehicles');
        revalidatePath(`/mobile/vehicle/${vehicleId}`);

        return { success: true };

    } catch (error: any) {
        console.error('CRITICAL ERROR in createCheckin:', error);
        return { success: false, error: 'Ocorreu um erro inesperado.' };
    }
}
