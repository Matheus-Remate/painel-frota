'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createReservation(formData: FormData) {
    const supabase = await createClient();

    const vehicle_id = formData.get("vehicle_id") as string;
    const driver_id = formData.get("driver_id") as string;
    const start_date = formData.get("start_date") as string;
    const end_date = formData.get("end_date") as string;
    const purpose = formData.get("purpose") as string;

    if (!vehicle_id || !driver_id || !start_date || !end_date) {
        return { success: false, error: "Todos os campos obrigatórios devem ser preenchidos." };
    }

    // Validação básica de datas
    if (new Date(start_date) >= new Date(end_date)) {
        return { success: false, error: "A data final deve ser posterior à data inicial." };
    }

    // Verificar conflitos de horário para o mesmo veículo
    const { data: conflicts } = await supabase
        .from("reservations")
        .select("id")
        .eq("vehicle_id", vehicle_id)
        .neq("status", "CANCELLED")
        .lt("start_date", end_date) // Existing start < New end
        .gt("end_date", start_date); // Existing end > New start

    if (conflicts && conflicts.length > 0) {
        return { success: false, error: "Já existe uma reserva para este veículo neste horário." };
    }

    try {
        const { error } = await supabase
            .from("reservations")
            .insert({
                vehicle_id,
                driver_id,
                start_date,
                end_date,
                purpose,
                status: 'ACTIVE'
            });

        if (error) {
            console.error("Erro Supabase:", error);
            return { success: false, error: error.message };
        }

    } catch (e) {
        console.error("Erro interno:", e);
        return { success: false, error: "Erro ao criar reserva." };
    }

    revalidatePath("/dashboard/schedule");
    return { success: true };
}

export async function cancelReservation(id: string) {
    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from("reservations")
            .update({ status: 'CANCELLED' })
            .eq('id', id);

        if (error) throw error;

    } catch (e) {
        console.error("Erro ao cancelar reserva:", e);
        return { success: false, error: "Erro ao cancelar reserva." };
    }

    revalidatePath("/dashboard/schedule");
    return { success: true };
}

export async function checkAvailability(start_date: string, end_date: string) {
    const supabase = await createClient();

    // 1. Find all reservations that overlap with the requested period
    const { data: conflicts, error } = await supabase
        .from("reservations")
        .select("vehicle_id")
        .neq("status", "CANCELLED")
        .lt("start_date", end_date)
        .gt("end_date", start_date);

    if (error) {
        console.error("Error checking availability:", error);
        return { success: false, error: error.message };
    }

    // Extract IDs of busy vehicles
    const busyVehicleIds = conflicts.map(r => r.vehicle_id);

    return { success: true, busyVehicleIds };
}
