import { getVehicleStatusCounts } from '@/lib/services/vehicle-status';
import { Car, Route, Wrench, AlertTriangle } from 'lucide-react';

type VehicleStatus = 'IN_YARD' | 'ON_ROUTE' | 'AWAITING_REPAIR' | 'IN_MAINTENANCE';

const statusConfig = {
    IN_YARD: {
        label: 'Em Pátio',
        icon: Car,
        color: 'bg-green-500',
        gradient: 'from-green-500 to-emerald-500',
        textColor: 'text-green-500'
    },
    ON_ROUTE: {
        label: 'Em Rota',
        icon: Route,
        color: 'bg-blue-500',
        gradient: 'from-blue-500 to-cyan-500',
        textColor: 'text-blue-500'
    },
    AWAITING_REPAIR: {
        label: 'Aguardando Reparo',
        icon: AlertTriangle,
        color: 'bg-yellow-500',
        gradient: 'from-yellow-500 to-orange-500',
        textColor: 'text-yellow-500'
    },
    IN_MAINTENANCE: {
        label: 'Em Manutenção',
        icon: Wrench,
        color: 'bg-red-500',
        gradient: 'from-red-500 to-pink-500',
        textColor: 'text-red-500'
    }
};

export async function VehicleStatusCards() {
    const counts = await getVehicleStatusCounts();

    const statuses: VehicleStatus[] = ['IN_YARD', 'ON_ROUTE', 'AWAITING_REPAIR', 'IN_MAINTENANCE'];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statuses.map((status) => {
                const config = statusConfig[status];
                const Icon = config.icon;
                const count = counts[status];

                return (
                    <div
                        key={status}
                        className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-shadow duration-300"
                    >
                        {/* Gradiente decorativo */}
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${config.gradient} opacity-10 rounded-full -mr-16 -mt-16`} />

                        <div className="relative p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-xl ${config.color} bg-opacity-10`}>
                                    <Icon className={`w-6 h-6 ${config.textColor}`} />
                                </div>
                                <span className="text-3xl font-bold text-slate-800 dark:text-white">
                                    {count}
                                </span>
                            </div>

                            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                {config.label}
                            </h3>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
