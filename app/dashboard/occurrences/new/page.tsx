import { getVehicles, getDrivers } from "@/lib/services/dashboard";
import { getOccurrenceTypes } from "@/lib/services/settings";
import { createOccurrence } from "@/lib/services/occurrences";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";

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
                <form action={createOccurrence} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Vehicle */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Veículo</label>
                            <select
                                name="vehicleId"
                                required
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                            >
                                <option value="">Selecione um veículo...</option>
                                {vehicles.map((v: any) => (
                                    <option key={v.id} value={v.id}>
                                        {v.model?.brand?.name || (typeof (v as any)?.brand === 'string' ? (v as any).brand : '') || ''} {v.model?.name || (typeof (v as any)?.model === 'string' ? (v as any).model : '') || ''} - {v.license_plate}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Type */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Tipo de Ocorrência</label>
                            <select
                                name="typeId"
                                required
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                            >
                                <option value="">Selecione o tipo...</option>
                                {types.map((t: any) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Date */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Data e Hora</label>
                            <input
                                type="datetime-local"
                                name="date"
                                required
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                            />
                        </div>

                        {/* Cost */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Custo (R$)</label>
                            <input
                                type="number"
                                name="cost"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                            />
                        </div>
                    </div>

                    {/* Driver */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Condutor (Opcional)</label>
                        <select
                            name="driverId"
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                        >
                            <option value="">Buscar automaticamente na escala...</option>
                            {drivers.map((d: any) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500">Deixe em branco para tentar vincular automaticamente com base na data.</p>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Descrição</label>
                        <textarea
                            name="description"
                            required
                            rows={3}
                            placeholder="Descreva o que aconteceu..."
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none resize-none"
                        />
                    </div>

                    {/* Observation */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Observações Internas (Opcional)</label>
                        <textarea
                            name="observation"
                            rows={2}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none resize-none"
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <SubmitButton text="Salvar Ocorrência" />
                    </div>
                </form>
            </div>
        </div>
    );
}
