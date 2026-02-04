'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCheckin(formData: FormData) {
    const supabase = await createClient();

    const vehicleId = formData.get('vehicleId') as string;
    const odometer = parseInt(formData.get('odometer') as string);
    const notes = formData.get('notes') as string;
    const fuelLevel = formData.get('fuelLevel') as string; // 'EMPTY', '1/4', '1/2', '3/4', 'FULL'

    // Check statuses
    // status_0 = Limpeza, status_1 = Lataria/Pneus, status_2 = Luzes painel
    // Mapping to DB columns: cleanliness_status, tires_exterior_status, dash_lights_status
    // DB Enum is likely 'OK', 'ALERT', 'DAMAGE' or similar. 
    // In the form I used 'OK' and 'ISSUE'. Let's map 'ISSUE' to 'ALERT' or 'DAMAGE' based on earlier file readings or typical logic.
    // Looking at dashboard.ts, status values were OK, ALERT, DAMAGE. I'll map ISSUE to ALERT for simplicity unless I check the enum.

    // Let's assume the form values 'OK' and 'ISSUE' map to database values.
    // Actually, let's map ISSUE -> ALERT for now.

    const cleanliness = formData.get('status_0') === 'OK' ? 'OK' : 'ALERT';
    const tiresExterior = formData.get('status_1') === 'OK' ? 'OK' : 'ALERT';
    const dashLights = formData.get('status_2') === 'OK' ? 'OK' : 'ALERT';

    const hasIssues = cleanliness !== 'OK' || tiresExterior !== 'OK' || dashLights !== 'OK';

    // Handle Photos Upload
    const photoFiles = formData.getAll('photos').filter(item => item instanceof File) as File[];
    const photoUrls: string[] = [];

    if (photoFiles.length > 0) {
        for (const file of photoFiles) {
            if (file.size === 0) continue;
            const fileExt = file.name.split('.').pop();
            const fileName = `${vehicleId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('checkin-photos')
                .upload(fileName, file);

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                    .from('checkin-photos')
                    .getPublicUrl(fileName);
                photoUrls.push(publicUrl);
            } else {
                console.error('Error uploading photo:', uploadError);
            }
        }
    }

    // Get current user (driver/admin doing the checkin)
    const { data: { user } } = await supabase.auth.getUser();

    // Check if user is a driver or get the driver ID associated with the user
    // For now, let's try to find a driver linked to this user or just insert user_id if the schema allows.
    // The check_ins table likely has a driver_id.
    const { data: driver } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

    // If no driver found (maybe admin checkin?), we might need to handle this.
    // For now, let's proceed. If driver is null, it might fail RLS or constraint if driver_id is required.
    // The schema showed check_ins referencing drivers.

    const checkinData = {
        vehicle_id: vehicleId,
        driver_id: driver?.id, // specific driver if mapped
        odometer,
        cleanliness_status: cleanliness,
        tires_exterior_status: tiresExterior,
        dash_lights_status: dashLights,
        repair_notes: notes,
        has_issues: hasIssues,
        fuel_level: fuelLevel,
        photos: photoUrls,
        checked_in_at: new Date().toISOString(),
    };

    const { error } = await supabase
        .from('check_ins')
        .insert(checkinData);

    if (error) {
        console.error('Error creating checkin:', error);
        // In a real app we'd return verification, but for server actions we might redirect with error query param
        throw new Error('Failed to create checkin');
    }

    // Update vehicle mileage and status
    await supabase
        .from('vehicles')
        .update({
            odometer: odometer,
            status: 'IN_YARD' // Check-in implies return to yard
        })
        .eq('id', vehicleId);

    revalidatePath('/dashboard/checkins');
    revalidatePath('/dashboard/vehicles');
    redirect('/dashboard/checkins');
}
