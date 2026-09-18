import Link from 'next/link';
import ReservationsList from '@/components/schedule/ReservationsList';
import { getReservations } from '@/lib/services/schedule';
export default async function ReservationsPage() { const reservations = await getReservations(); return <div className="space-y-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold text-white">Reservas</h1><p className="mt-1 text-slate-400">Listagem, filtros e detalhes de todas as alocações.</p></div><Link href="/dashboard/schedule" className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800">Abrir agenda por veículo</Link></div><ReservationsList reservations={reservations} /></div>; }
