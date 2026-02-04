'use client';

import Link from "next/link";
import { ArrowLeft, Save, AlertCircle, Loader2, Calendar, Clock, X } from "lucide-react";
import { createReservation } from "@/lib/actions/schedule";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface ReservationFormProps {
    vehicles: any[];
    drivers: any[];
}

export default function ReservationForm({ vehicles, drivers }: ReservationFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
    const [step, setStep] = useState<1 | 2>(1); // 1: Dates, 2: Vehicle/Driver

    // State for inputs
    const [dates, setDates] = useState({ start: '', end: '' });

    async function handleCheckAvailability() {
        if (!dates.start || !dates.end) {
            setError("Selecione a data de início e fim.");
            return;
        }
        if (new Date(dates.start) >= new Date(dates.end)) {
            setError("A data final deve ser posterior à inicial.");
            return;
        }

        setChecking(true);
        setError(null);

        // Import dynamically to avoid server action binding issues if any
        const { checkAvailability } = await import("@/lib/actions/schedule");
        const result = await checkAvailability(dates.start, dates.end);

        setChecking(false);

        if (!result.success) {
            setError(result.error || "Erro ao verificar disponibilidade.");
            return;
        }

        // Filter vehicles
        const busyIds = result.busyVehicleIds || [];
        const available = vehicles.filter(v =>
            !busyIds.includes(v.id) && v.status !== 'IN_MAINTENANCE' // Optionally exclude maintenance too
        );

        setAvailableVehicles(available);

        if (available.length === 0) {
            setError("Nenhum veículo disponível para este período.");
        } else {
            setStep(2);
        }
    }

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);

        // Add dates manually since they might be in previous step or controlled
        formData.set('start_date', dates.start);
        formData.set('end_date', dates.end);

        const result = await createReservation(formData);

        if (result && !result.success) {
            setError(result.error || "Erro desconhecido.");
            setLoading(false);
        } else {
            router.push('/dashboard/schedule');
        }
    }

    return (
        <div className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 sm:p-8 space-y-6">
            {/* Botão X para Cancelar */}
            <Link href="/dashboard/schedule" className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors z-10">
                <X className="w-6 h-6" />
            </Link>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* STEP 1: DATES */}
            <div className={`space-y-6 ${step === 2 ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Data/Hora Início</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                required
                                type="datetime-local"
                                value={dates.start}
                                onChange={e => setDates(prev => ({ ...prev, start: e.target.value }))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none [color-scheme:dark]"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Data/Hora Fim Previsto</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                required
                                type="datetime-local"
                                value={dates.end}
                                onChange={e => setDates(prev => ({ ...prev, end: e.target.value }))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none [color-scheme:dark]"
                            />
                        </div>
                    </div>
                </div>

                {step === 1 && (
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleCheckAvailability}
                            disabled={checking || !dates.start || !dates.end}
                            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                            {checking ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                            Verificar Disponibilidade
                        </button>
                    </div>
                )}
            </div>

            {/* STEP 2: DETAILS */}
            {step === 2 && (
                <form action={handleSubmit} className="space-y-6 pt-6 border-t border-slate-700/50 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-brand-400 font-medium">Veículos Disponíveis ({availableVehicles.length})</h3>
                        <button type="button" onClick={() => setStep(1)} className="text-sm text-slate-400 hover:text-white underline">Alterar datas</button>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="vehicle_id" className="text-sm font-medium text-slate-300">Veículo</label>
                                <select
                                    required
                                    name="vehicle_id"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none"
                                >
                                    <option value="">Selecione um veículo...</option>
                                    {availableVehicles.map(v => {
                                        const modelName = typeof v.model === 'string'
                                            ? v.model
                                            : (v.model?.name || 'Modelo Desconhecido');
                                        const brandName = v.model?.brand?.name || v.brand || '';
                                        const fullName = brandName ? `${brandName} ${modelName}` : modelName;

                                        return (
                                            <option key={v.id} value={v.id}>
                                                {fullName} ({v.license_plate})
                                            </option>
                                        )
                                    })}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="driver_id" className="text-sm font-medium text-slate-300">Condutor</label>
                                <select
                                    required
                                    name="driver_id"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none"
                                >
                                    <option value="">Selecione um condutor...</option>
                                    {drivers.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="purpose" className="text-sm font-medium text-slate-300">Finalidade / Destino</label>
                            <textarea
                                required
                                name="purpose"
                                placeholder="Descreva o motivo da reserva ou destino..."
                                rows={3}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none resize-none"
                            />
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-3 border-t border-slate-700/50">
                        <Link href="/dashboard/schedule" className="px-6 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors font-medium">
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 rounded-lg bg-brand hover:bg-brand-950 text-white shadow-lg shadow-brand/20 transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Configurar Reserva
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
