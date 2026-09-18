'use client';

import { updateReservation } from '@/lib/services/schedule';
import { CalendarDays, Edit3, Loader2, User, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Reservation = {
    id: string;
    driver_id: string | null;
    driver_name?: string | null;
    start_date: string;
    end_date: string;
    purpose: string | null;
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    is_emergency?: boolean;
    driver?: { name: string } | { name: string }[] | null;
};

function driverName(reservation: Reservation) {
    const driver = Array.isArray(reservation.driver) ? reservation.driver[0] : reservation.driver;
    return reservation.driver_name || driver?.name || 'Não atribuído';
}

function localDateTime(value: string) {
    return value ? new Date(value).toISOString().slice(0, 16) : '';
}

export default function VehicleReservationsCard({ reservations, drivers }: { reservations: Reservation[]; drivers: Array<{ id: string; name: string }> }) {
    const router = useRouter();
    const [editing, setEditing] = useState<Reservation | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const now = new Date();

    async function submit(formData: FormData) {
        if (!editing) return;
        setLoading(true);
        setError(null);
        const result = await updateReservation(editing.id, formData);
        if (!result.success) {
            setError(result.error || 'Não foi possível atualizar a reserva.');
            setLoading(false);
            return;
        }
        setEditing(null);
        setLoading(false);
        router.refresh();
    }

    return <section className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <div className="mb-5 flex items-start justify-between gap-4"><div><h3 className="flex items-center gap-2 text-lg font-bold text-emerald-400"><CalendarDays className="size-5" />Eventos reservados para este veículo</h3><p className="mt-1 text-sm text-slate-400">Agenda, condutor e período vinculados ao veículo.</p></div><span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-300">{reservations.length} {reservations.length === 1 ? 'registro' : 'registros'}</span></div>
        <div className="space-y-3">{reservations.length ? reservations.map((reservation) => {
            const inProgress = reservation.status === 'ACTIVE' && new Date(reservation.start_date) <= now && new Date(reservation.end_date) >= now;
            const canEdit = reservation.status === 'ACTIVE' && !reservation.is_emergency;
            return <article key={reservation.id} className="rounded-xl border border-slate-700/70 bg-slate-900/60 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold text-white">{reservation.purpose || 'Sem evento informado'}</h4>{reservation.is_emergency ? <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">Emergencial</span> : <span className={`rounded-full border px-2 py-0.5 text-xs ${inProgress ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-blue-500/30 bg-blue-500/10 text-blue-300'}`}>{inProgress ? 'Em andamento' : reservation.status === 'COMPLETED' ? 'Concluída' : 'Agendada'}</span>}</div><p className="mt-2 flex items-center gap-2 text-sm text-slate-300"><User className="size-4 text-slate-500" />{driverName(reservation)}</p><p className="mt-2 text-xs text-slate-400">{new Date(reservation.start_date).toLocaleString('pt-BR')} — {new Date(reservation.end_date).toLocaleString('pt-BR')}</p></div>{canEdit && <button type="button" onClick={() => { setError(null); setEditing(reservation); }} className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-500/30 px-3 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/10"><Edit3 className="size-4" />Editar</button>}</div></article>;
        }) : <p className="rounded-lg border border-dashed border-slate-700 p-5 text-center text-sm text-slate-400">Nenhum evento ou reserva alocado a este veículo.</p>}</div>
        {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-reservation-title"><form action={submit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"><div className="mb-6 flex items-start justify-between gap-4"><div><h2 id="edit-reservation-title" className="text-xl font-bold text-white">Editar reserva do veículo</h2><p className="mt-1 text-sm text-slate-400">A alteração verifica conflitos de agenda e bloqueios operacionais.</p></div><button type="button" onClick={() => setEditing(null)} disabled={loading} aria-label="Fechar modal" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="size-5" /></button></div>{error && <p role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}<div className="space-y-4"><label className="block text-sm text-slate-300">Evento reservado<textarea name="purpose" required defaultValue={editing.purpose || ''} rows={3} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm text-slate-300">Início<input type="datetime-local" name="startDate" required defaultValue={localDateTime(editing.start_date)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500 [color-scheme:dark]" /></label><label className="block text-sm text-slate-300">Fim<input type="datetime-local" name="endDate" required defaultValue={localDateTime(editing.end_date)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500 [color-scheme:dark]" /></label></div><label className="block text-sm text-slate-300">Condutor<select name="driverId" required defaultValue={editing.driver_id || ''} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500"><option value="">Selecione um condutor</option>{drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}</select></label></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setEditing(null)} disabled={loading} className="rounded-lg border border-slate-600 px-4 py-2.5 text-slate-300 hover:bg-slate-800">Cancelar</button><button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white hover:bg-emerald-500 disabled:opacity-60">{loading && <Loader2 className="size-4 animate-spin" />}{loading ? 'Salvando...' : 'Salvar alterações'}</button></div></form></div>}
    </section>;
}
