import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import GanttChart from "@/components/dashboard/gantt-chart";
import ReservationsList from "@/components/schedule/ReservationsList";
import { getReservations } from "@/lib/services/schedule";
import { getVehicles } from "@/lib/services/dashboard";

export default async function SchedulePage() {
    const [reservations, vehiclesRaw] = await Promise.all([
        getReservations(),
        getVehicles()
    ]);

    // Simplificar veículos para o componente
    const vehicles = vehiclesRaw.map(v => {
        const modelObj = v.model as any;
        const modelName = typeof v.model === 'string' ? v.model : (modelObj?.name || '');
        const brandName = modelObj?.brand?.name || '';
        return {
            id: v.id,
            model: modelName,
            brand: brandName,
            license_plate: v.license_plate
        };
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Voltar ao Dashboard"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Reservas</h1>
                        <p className="text-slate-400 mt-1">Visualize e gerencie a utilização da frota no tempo</p>
                    </div>
                </div>
            </div>

            <GanttChart reservations={reservations} vehicles={vehicles} />

            <ReservationsList reservations={reservations} />
        </div>
    );
}
