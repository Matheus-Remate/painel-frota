'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Save } from "lucide-react";
import { createOccurrence, updateOccurrence } from "@/lib/services/occurrences";

interface OccurrenceFormProps {
    vehicles: any[];
    drivers: any[];
    types: any[];
    initialData?: any;
}

export function OccurrenceForm({ vehicles, drivers, types, initialData }: OccurrenceFormProps) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);

        try {
            let result;

            if (initialData) {
                result = await updateOccurrence(initialData.id, formData);
            } else {
                result = await createOccurrence(formData);
            }

            if (result.success) {
                router.push('/dashboard/occurrences');
            } else {
                setError(result.error || "Erro ao salvar ocorrência");
                setLoading(false);
            }
        } catch (e) {
            console.error(e);
            setError("Erro de conexão ou erro interno no servidor");
            setLoading(false);
        }
    }

    // Format date for datetime-local input (YYYY-MM-DDThh:mm)
    const formattedDate = initialData?.date
        ? new Date(initialData.date).toISOString().slice(0, 16)
        : '';

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
                        defaultValue={initialData?.vehicle_id || ''}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-brand/50 outline-none"
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
                        defaultValue={initialData?.type_id || ''}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-brand/50 outline-none"
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
                        defaultValue={formattedDate}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-brand/50 outline-none"
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
                        defaultValue={initialData?.cost || ''}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-brand/50 outline-none"
                    />
                </div>
            </div>

            {/* Driver */}
            {!initialData && <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Nível de atenção</label>
                <select name="alertLevel" defaultValue="MEDIUM" className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-white">
                    <option value="LOW">Baixo — atenção futura</option><option value="MEDIUM">Médio — pode viajar com atenção</option>
                    <option value="HIGH">Alto — não pode viajar</option><option value="URGENT">Urgente — não pode rodar</option>
                </select>
            </div>}

            {/* Driver */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Condutor (Opcional)</label>
                <select
                    name="driverId"
                    defaultValue={initialData?.driver_id || ''}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-brand/50 outline-none"
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
                    defaultValue={initialData?.description || ''}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-brand/50 outline-none resize-none"
                />
            </div>

            {/* Observation */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Observações Internas (Opcional)</label>
                <textarea
                    name="observation"
                    rows={2}
                    defaultValue={initialData?.observation || ''}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-brand/50 outline-none resize-none"
                />
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-brand hover:bg-brand-950 text-white rounded-lg font-medium transition-colors shadow-lg shadow-brand/20 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {loading ? "Salvando..." : (initialData ? "Atualizar Ocorrência" : "Salvar Ocorrência")}
                </button>
            </div>
        </form>
    );
}
