'use client';
import { Reservation } from "@/lib/services/schedule";
import ReservationActions from "./ReservationActions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReservationDetailsButton from './reservation-details-button';
import { useMemo, useState } from 'react';

export default function ReservationsList({ reservations }: { reservations: Reservation[] }) {
    const [query, setQuery] = useState(''); const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all'); const [showOlder, setShowOlder] = useState(false); const now = new Date();
    const visibleReservations = useMemo(() => reservations.filter((reservation) => { const text = `${reservation.purpose || ''} ${reservation.driver_name || reservation.driver?.name || ''} ${reservation.vehicle?.license_plate || ''}`.toLocaleLowerCase('pt-BR'); const start = new Date(reservation.start_date); const end = new Date(reservation.end_date); const state = now >= start && now <= end ? 'active' : end < now ? 'completed' : 'upcoming'; const olderThanWeek = end.getTime() < now.getTime() - 7 * 24 * 60 * 60 * 1000; return text.includes(query.toLocaleLowerCase('pt-BR')) && (filter === 'all' || filter === state) && (showOlder || !olderThanWeek); }), [reservations, query, filter, showOlder]);
    if (!reservations || reservations.length === 0) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 text-center">
                <p className="text-slate-400">Nenhuma reserva encontrada no período.</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border-y sm:border border-slate-700/50 sm:rounded-xl overflow-hidden mt-8 -mx-4 sm:mx-0">
            <div className="p-4 sm:p-6 border-b border-slate-700/50 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold text-white">Listagem de Reservas</h2><p className="text-sm text-slate-400">Clique em detalhes para abrir a alocação completa.</p></div><span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-300">{visibleReservations.length} reservas</span></div>
                <div className="flex flex-col gap-3 sm:flex-row"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar evento, condutor ou placa" className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" /><div className="flex flex-wrap gap-2">{[['all','Todas'],['active','Em uso'],['upcoming','Próximas'],['completed','Concluídas']].map(([value,label]) => <button key={value} onClick={() => setFilter(value as any)} className={`rounded-lg px-3 py-2 text-xs ${filter === value ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-700'}`}>{label}</button>)}<button onClick={() => setShowOlder(value => !value)} className={`rounded-lg px-3 py-2 text-xs ${showOlder ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-700'}`}>{showOlder ? 'Ocultar anteriores' : 'Exibir eventos anteriores'}</button></div></div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-900/50 text-slate-200 uppercase text-xs font-medium">
                        <tr>
                            <th className="px-6 py-4">Veículo</th>
                            <th className="px-6 py-4">Evento / Motivo</th>
                            <th className="px-6 py-4">Condutor</th>
                            <th className="px-6 py-4">Período</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
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
                                <tr key={reservation.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">
                                        <div className="flex flex-col">
                                            <span>{reservation.vehicle?.model?.name || 'Modelo não ident.'}{reservation.vehicle?.nickname ? ` (${reservation.vehicle.nickname})` : ''}</span>
                                            <span className="text-xs text-slate-500">
                                                {reservation.vehicle?.model?.brand?.name} · {reservation.vehicle?.license_plate}
                                            </span>
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
