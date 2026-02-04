'use client';

import Link from "next/link";
import { ArrowLeft, Save, AlertCircle, Loader2, Calendar, Clock, X } from "lucide-react";
import { createReservation } from "@/lib/actions/schedule";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NewReservationPage() {
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch vehicles and drivers CLIENT SIDE for this form
    // Alternatively pass as props from server page, but let's keep it self-contained for now or consistency
    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient();
            const { data: vData } = await supabase.from('vehicles').select('*').order('model');
            const { data: dData } = await supabase.from('drivers').select('*').order('name');
            if (vData) setVehicles(vData);
            if (dData) setDrivers(dData);
        };
        fetchData();
    }, []);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);

        const result = await createReservation(formData);

        if (result && !result.success) {
            setError(result.error);
            setLoading(false);
        }
    }

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

            <form action={handleSubmit} className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 sm:p-8 space-y-6">
                {/* Botão X para Cancelar */}
                <Link href="/dashboard/schedule" className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                </Link>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {/* Seleção de Veículo e Condutor */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="vehicle_id" className="text-sm font-medium text-slate-300">Veículo</label>
                            <select
                                required
                                name="vehicle_id"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
                            >
                                <option value="">Selecione um veículo...</option>
                                {vehicles.map(v => (
                                    <option key={v.id} value={v.id}>
                                        {v.model} ({v.license_plate}) - {v.status === 'IN_YARD' ? 'Disponível' : 'Ocupado/Manut.'}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="driver_id" className="text-sm font-medium text-slate-300">Condutor</label>
                            <select
                                required
                                name="driver_id"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
                            >
                                <option value="">Selecione um condutor...</option>
                                {drivers.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Datas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="start_date" className="text-sm font-medium text-slate-300">Data/Hora Início</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    required
                                    type="datetime-local"
                                    name="start_date"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none [color-scheme:dark]"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="end_date" className="text-sm font-medium text-slate-300">Data/Hora Fim Previsto</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    required
                                    type="datetime-local"
                                    name="end_date"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none [color-scheme:dark]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Finalidade */}
                    <div className="space-y-2">
                        <label htmlFor="purpose" className="text-sm font-medium text-slate-300">Finalidade / Destino</label>
                        <textarea
                            required
                            name="purpose"
                            placeholder="Descreva o motivo da reserva ou destino..."
                            rows={3}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none resize-none"
                        />
                    </div>
                </div>

                <div className="pt-6 flex justify-end gap-3 border-t border-slate-700/50 mt-6">
                    <Link href="/dashboard/schedule" className="px-6 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors font-medium">
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {loading ? 'Confirmar Reserva' : 'Confirmar Reserva'}
                    </button>
                </div>

            </form>
        </div>
    );
}
