import { createClient } from '@/lib/supabase/server';

type VehicleStatus = 'IN_YARD' | 'ON_ROUTE' | 'AWAITING_REPAIR' | 'IN_MAINTENANCE';

export async function getVehicleStatusCounts() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('vehicles')
        .select('status');

    if (error) throw error;

    const counts: Record<VehicleStatus, number> = {
        IN_YARD: 0,
        ON_ROUTE: 0,
        AWAITING_REPAIR: 0,
        IN_MAINTENANCE: 0
    };

    data.forEach((vehicle: { status: VehicleStatus }) => {
        counts[vehicle.status]++;
    });

    return counts;
}

export async function isVehicleAvailable(
    vehicleId: string,
    startDate: Date,
    endDate: Date
): Promise<boolean> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .rpc('is_vehicle_available', {
            vehicle_uuid: vehicleId,
            start_dt: startDate.toISOString(),
            end_dt: endDate.toISOString()
        });

    if (error) {
        console.error('Erro ao verificar disponibilidade:', error);
        return false;
    }

    return data as boolean;
}
