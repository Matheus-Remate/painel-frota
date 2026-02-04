import { getVehicles, getDrivers } from "@/lib/services/dashboard";
import { getOccurrenceTypes } from "@/lib/services/settings";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { OccurrenceForm } from "@/components/dashboard/occurrence-form";
import { getOccurrenceById } from "@/lib/services/occurrences";
import { notFound } from "next/navigation";

export default async function EditOccurrencePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const [vehicles, drivers, types, occurrence] = await Promise.all([
        getVehicles(),
        getDrivers(),
        getOccurrenceTypes(),
        getOccurrenceById(id)
    ]);

    if (!occurrence) {
        notFound();
    }

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
                    <h1 className="text-3xl font-bold tracking-tight text-white">Editar Ocorrência</h1>
                    <p className="text-slate-400 mt-1">Atualize as informações do evento</p>
                </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <OccurrenceForm
                    vehicles={vehicles}
                    drivers={drivers}
                    types={types}
                    initialData={occurrence}
                />
            </div>
        </div>
    );
}
