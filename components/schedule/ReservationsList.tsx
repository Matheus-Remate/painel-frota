'use client';
import { Reservation } from "@/lib/services/schedule";
import ReservationActions from "./ReservationActions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReservationDetailsButton from './reservation-details-button';
import { useMemo, useState } from 'react';
import { CalendarRange, CarFront, CheckCircle2, Clock3, Route } from 'lucide-react';
import { vehicleLabel } from '@/lib/presentation/vehicle-label';

export default function ReservationsList({ reservations }: { reservations: Reservation[] }) {
    const [query, setQuery] = useState(''); const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all'); const [showOlder, setShowOlder] = useState(false); const now = new Date();
    const visibleReservations = useMemo(() => reservations.filter((reservation) => { const text = `${reservation.purpose || ''} ${reservation.driver_name || reservation.driver?.name || ''} ${reservation.vehicle?.license_plate || ''} ${vehicleLabel(reservation.vehicle)}`.toLocaleLowerCase('pt-BR'); const start = new Date(reservation.start_date); const end = new Date(reservation.end_date); const state = now >= start && now <= end ? 'active' : end < now ? 'completed' : 'upcoming'; const olderThanWeek = end.getTime() < now.getTime() - 7 * 24 * 60 * 60 * 1000; return text.includes(query.toLocaleLowerCase('pt-BR')) && (filter === 'all' || filter === state) && (showOlder || !olderThanWeek); }), [reservations, query, filter, showOlder]);
    if (!reservations || reservations.length === 0) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 text-center">
                <p className="text-slate-400">Nenhuma reserva encontrada no período.</p>
            </div>
        );
    }

    return (
        <div className="ops-panel overflow-hidden">
            <div className="border-b border-[#26344d] p-4 sm:p-5"><div className="grid gap-3 sm:grid-cols-3"><div className="ops-card flex items-center gap-3 p-3"><Route className="size-4 text-sky-300" /><div><p className="ops-label">Em uso</p><p className="text-lg font-bold text-white">{reservations.filter(r => now >= new Date(r.start_date) && now <= new Date(r.end_date)).length}</p></div></div><div className="ops-card flex items-center gap-3 p-3"><Clock3 className="size-4 text-amber-300" /><div><p className="ops-label">Próximas</p><p className="text-lg font-bold text-white">{reservations.filter(r => new Date(r.start_date) > now).length}</p></div></div><div className="ops-card flex items-center gap-3 p-3"><CheckCircle2 className="size-4 text-emerald-300" /><div><p className="ops-label">Concluídas</p><p className="text-lg font-bold text-white">{reservations.filter(r => new Date(r.end_date) < now).length}</p></div></div></div></div>
            <div className="space-y-4 border-b border-[#26344d] p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="ops-icon ops-icon-red"><CalendarRange className="size-4" /></span><div><h2 className="ops-heading">Reservas e alocações</h2><p className="ops-subtitle">Clique em uma reserva para ver os dados operacionais.</p></div></div><span className="ops-plate">{visibleReservations.length} RESERVAS</span></div><div className="flex flex-col gap-3 sm:flex-row"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar evento, condutor, placa ou apelido" className="flex-1 rounded-lg border border-[#334460] bg-[#0b111c] px-3 py-2.5 text-sm text-white outline-none focus:border-sky-400" /><div className="flex flex-wrap gap-2">{[['all','Todas'],['active','Em uso'],['upcoming','Próximas'],['completed','Concluídas']].map(([value,label]) => <button key={value} onClick={() => setFilter(value as any)} className={`rounded-md border px-3 py-2 text-xs font-semibold ${filter === value ? 'border-red-500 bg-[#990000] text-white' : 'border-[#334460] bg-[#141e2e] text-slate-300 hover:bg-[#1e2b3e]'}`}>{label}</button>)}<button onClick={() => setShowOlder(value => !value)} className={`rounded-md border px-3 py-2 text-xs font-semibold ${showOlder ? 'border-amber-500 bg-amber-950 text-amber-100' : 'border-[#334460] bg-[#141e2e] text-slate-300 hover:bg-[#1e2b3e]'}`}>{showOlder ? 'Ocultar anteriores' : 'Exibir anteriores'}</button></div></div></div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-[#0b111c] text-slate-300 uppercase text-[11px] font-medium">
                        <tr>
                            <th className="px-6 py-4">Veículo</th>
                            <th className="px-6 py-4">Evento / Motivo</th>
                            <th className="px-6 py-4">Condutor</th>
                            <th className="px-6 py-4">Período</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#26344d]">
                        {visibleReservations.map((reservation) => {
                            const startDate = new Date(reservation.start_date);
                            const endDate = new Date(reservation.end_date);

                            const isPast = endDate < new Date();
                            const isActive = new Date() >= startDate && new Date() <= endDate;

                            let statusLabel = 'Agendado';
                            let statusColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';

                            if (isPast) {
                                statusLabel = 'Concluído';
                                statusColor = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
                            } else if (isActive) {
                                statusLabel = 'Em Andamento';
                                statusColor = 'bg-brand/10 text-brand-400 border-brand/20';
                            }

                            return (
                                <tr key={reservation.id} className="transition-colors hover:bg-[#182232]">
                                    <td className="px-6 py-4 font-medium text-white">
                                        <div className="flex flex-col">
                                            <span>{vehicleLabel(reservation.vehicle)}</span><span className="mt-1 flex items-center gap-1 text-xs text-slate-500"><CarFront className="size-3" />{reservation.vehicle?.license_plate || 'Placa não identificada'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="line-clamp-2" title={reservation.purpose}>{reservation.purpose?.split(' - ')[0]}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {reservation.driver_name || reservation.driver?.name || 'Não atribuído'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 text-xs">
                                            <span className="whitespace-nowrap">
                                                Início: {format(startDate, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                            </span>
                                            <span className="whitespace-nowrap">
                                                Fim: {format(endDate, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor}`}>
                                            {statusLabel}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ReservationDetailsButton reservation={reservation} className="mr-2 rounded-lg border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700" />
                                        <ReservationActions id={reservation.id} status={reservation.status === 'CANCELLED' ? 'CANCELLED' : (isPast ? 'COMPLETED' : 'ACTIVE')} />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
