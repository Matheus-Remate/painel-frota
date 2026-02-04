'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Save } from "lucide-react";
import { createOccurrence } from "@/lib/services/occurrences";

interface OccurrenceFormProps {
    vehicles: any[];
    drivers: any[];
    types: any[];
}

export function OccurrenceForm({ vehicles, drivers, types }: OccurrenceFormProps) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);

        try {
            const result = await createOccurrence(formData);

            if (result.success) {
                router.push('/dashboard/occurrences');
            } else {
                setError(result.error || "Erro ao criar ocorrência");
                setLoading(false);
            }
        } catch (e) {
            console.error(e);
            setError("Erro de conexão ou erro interno no servidor");
            setLoading(false);
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

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
                                {v.model?.brand?.name || (typeof v?.brand === 'string' ? v.brand : '') || ''} {v.model?.name || (typeof v?.model === 'string' ? v.model : '') || ''} - {v.license_plate}
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
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {loading ? "Salvando..." : "Salvar Ocorrência"}
                </button>
            </div>
        </form>
    );
}
