import { getVehicles, getDrivers } from "@/lib/services/dashboard";
import { getOccurrenceTypes } from "@/lib/services/settings";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { OccurrenceForm } from "@/components/dashboard/occurrence-form";

export default async function NewOccurrencePage() {
    const [vehicles, drivers, types] = await Promise.all([
        getVehicles(),
        getDrivers(),
        getOccurrenceTypes()
    ]);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/occurrences"
                    className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Nova Ocorrência</h1>
                    <p className="text-slate-400 mt-1">Registre um novo evento na frota</p>
                </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <OccurrenceForm
                    vehicles={vehicles}
                    drivers={drivers}
                    types={types}
                />
            </div>
        </div>
    );
}
