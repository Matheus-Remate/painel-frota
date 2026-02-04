import StatusCard from './status-card';

type VehicleStatus = 'IN_YARD' | 'ON_ROUTE' | 'AWAITING_REPAIR' | 'IN_MAINTENANCE';

interface VehicleStatusCardsProps {
    vehicles: any[];
    reservations: any[];
}

export async function VehicleStatusCards({ vehicles, reservations }: VehicleStatusCardsProps) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

    // Identificar IDs de veículos reservados hoje
    const reservedTodayIds = new Set(
        reservations
            .filter(r => {
                if (r.status === 'CANCELLED') return false;
                const start = new Date(r.start_date).getTime();
                const end = new Date(r.end_date).getTime();
                // Sobrepõe com o dia de hoje
                return (start <= endOfDay && end >= startOfDay);
            })
            .map(r => r.vehicle_id)
    );

    const counts: Record<VehicleStatus, number> = {
        IN_YARD: 0,
        ON_ROUTE: 0,
        AWAITING_REPAIR: 0,
        IN_MAINTENANCE: 0
    };

    const availableForList: any[] = [];

    vehicles.forEach(vehicle => {
        const isReserved = reservedTodayIds.has(vehicle.id);
        const currentStatus = vehicle.status as VehicleStatus;

        if (currentStatus === 'IN_YARD' && !isReserved) {
            counts.IN_YARD++;
            availableForList.push(vehicle);
        } else if (isReserved) {
            counts.ON_ROUTE++;
        } else {
            counts[currentStatus]++;
        }
    });

    const statuses: VehicleStatus[] = ['IN_YARD', 'ON_ROUTE', 'AWAITING_REPAIR', 'IN_MAINTENANCE'];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statuses.map((status) => (
                <StatusCard
                    key={status}
                    status={status}
                    count={counts[status]}
                    availableVehicles={status === 'IN_YARD' ? availableForList : undefined}
                />
            ))}
        </div>
    );
}
