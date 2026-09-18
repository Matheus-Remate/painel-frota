'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
    ArrowLeft,
    AlertCircle,
    Calendar,
    Car,
    User,
    Save,
    Loader2
} from "lucide-react";
import { updateReservation, getReservationById } from "@/lib/services/schedule";
import { type Reservation } from "@/lib/services/schedule";
import { getDrivers } from '@/lib/services/dashboard';

export default function EditReservationPage() {
    const router = useRouter();
    const params = useParams();
    const reservationId = params.id as string;

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reservation, setReservation] = useState<Reservation | null>(null);
    const [drivers, setDrivers] = useState<Array<{ id: string; name: string }>>([]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [data, driverOptions] = await Promise.all([getReservationById(reservationId), getDrivers()]);
            setDrivers(driverOptions.map(driver => ({ id: driver.id, name: driver.name })));
            if (!data) {
                setError("Reserva não encontrada");
            } else {
                setReservation(data);
            }
        } catch (error) {
            console.error('Error loading reservation:', error);
            setError('Erro ao carregar dados');
        } finally {
            setPageLoading(false);
        }
    }

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);
        try {
            const result = await updateReservation(reservationId, formData);
            if (result.success) {
                router.push('/dashboard/schedule');
                router.refresh();
            } else {
                setError(result.error || 'Erro ao atualizar reserva');
            }
        } catch (e) {
            console.error(e);
            setError('Erro ao conectar com o servidor');
        } finally {
            setLoading(false);
        }
    }

    if (pageLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
        );
    }

    if (error || !reservation) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-bold text-white mb-2">Erro</h2>
                <p className="text-slate-400 mb-6">{error || 'Reserva não encontrada'}</p>
                <Link href="/dashboard/schedule" className="text-emerald-400 hover:text-emerald-300">
                    Voltar ao Cronograma
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/schedule"
                    className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Editar Reserva</h1>
                    <p className="text-slate-400 text-sm">Atualize os detalhes do agendamento</p>
                </div>
            </div>

            {/* Form */}
            <form action={handleSubmit} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 sm:p-8 space-y-6">

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                {/* Veículo (Informativo apenas por enquanto) */}
                <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                        <Car className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Veículo Selecionado</p>
                        <p className="font-semibold text-white">
                            {reservation.vehicle?.model?.brand?.name || (typeof (reservation.vehicle as any)?.brand === 'string' ? (reservation.vehicle as any).brand : '') || ''} {reservation.vehicle?.model?.name || (typeof (reservation.vehicle as any)?.model === 'string' ? (reservation.vehicle as any).model : '') || ''}
                        </p>
                        <p className="text-xs text-slate-500">{reservation.vehicle?.license_plate}</p>
                    </div>
                </div>

                {/* Event Name */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Motivo / Evento</label>
                    <input
                        name="purpose"
                        defaultValue={reservation.purpose}
                        required
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                    />
                </div>

                {/* Date/Time */}
                <div className="space-y-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-3 text-emerald-400">
                        <Calendar className="w-5 h-5" />
                        <h2 className="text-lg font-semibold">Período da Reserva</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Início</label>
                            <input
                                type="datetime-local"
                                name="startDate"
                                required
                                defaultValue={reservation.start_date?.slice(0, 16)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Fim</label>
                            <input
                                type="datetime-local"
                                name="endDate"
                                required
                                defaultValue={reservation.end_date?.slice(0, 16)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <label className="block space-y-2 text-sm text-slate-300">Condutor previsto para o QR
                    <select name="driverId" required defaultValue={reservation.driver_id} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-white">
                        <option value="">Selecione um condutor</option>
                        {drivers.map(driver => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
                    </select>
                </label>

                {/* Actions */}
                <div className="pt-6 flex justify-end gap-3">
                    <Link href="/dashboard/schedule" className="px-6 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors font-medium">
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>

            </form>
        </div>
    );
}
