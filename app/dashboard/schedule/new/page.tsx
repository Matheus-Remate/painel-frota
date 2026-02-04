import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ReservationForm from "./form";
import { getVehicles, getDrivers } from "@/lib/services/dashboard";

export default async function NewReservationPage() {
    const [vehicles, drivers] = await Promise.all([
        getVehicles(),
        getDrivers()
    ]);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/schedule"
                    className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Nova Reserva</h1>
                    <p className="text-slate-400 text-sm">Agende o uso de um veículo</p>
                </div>
            </div>

            <ReservationForm vehicles={vehicles} drivers={drivers} />
        </div>
    );
}
