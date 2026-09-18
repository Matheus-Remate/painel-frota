import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, ClipboardCheck, TriangleAlert } from 'lucide-react';
import { VehicleStatusCards } from '@/components/dashboard/vehicle-status-cards';
import GanttChart from '@/components/dashboard/gantt-chart';
import QrDispatchPanel from '@/components/dashboard/qr-dispatch-panel';
import { getReservations } from '@/lib/services/schedule';
import { getVehicleQrPreviews, getVehicles } from '@/lib/services/dashboard';
import { getPendingRequests } from '@/lib/services/requests';
import OperationalTicker from '@/components/dashboard/operational-ticker';

function PanelSkeleton({ className = 'h-48' }: { className?: string }) { return <div className={`ops-panel animate-pulse bg-[#182232]/60 ${className}`} />; }

async function getDashboardData() { const [reservations, vehicles] = await Promise.all([getReservations().catch(() => []), getVehicles().catch(() => [])]); return { reservations, vehicles }; }
async function StatusSection() { const { reservations, vehicles } = await getDashboardData(); return <><OperationalTicker vehicles={vehicles} reservations={reservations} /><div className="pt-5"><VehicleStatusCards vehicles={vehicles} reservations={reservations} /></div></>; }
async function TimelineSection() { const { reservations, vehicles: rawVehicles } = await getDashboardData(); return <GanttChart reservations={reservations} vehicles={rawVehicles.map((vehicle: any) => ({ id: vehicle.id, model: typeof vehicle.model === 'string' ? vehicle.model : vehicle.model?.name || 'Veículo sem modelo', license_plate: vehicle.license_plate }))} />; }
async function QrSection() { return <QrDispatchPanel vehicles={await getVehicleQrPreviews().catch(() => [])} />; }
async function ApprovalSnapshot() {
    const requests = await getPendingRequests().catch(() => []);
    return <section className="ops-panel p-5"><div className="flex items-center justify-between border-b border-[#1c2637] pb-3"><div className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-amber-400" /><h2 className="text-sm font-extrabold uppercase text-white">Aprovações</h2></div><span className="ops-mono text-[10px] text-amber-300">{requests.length} NA FILA</span></div>{requests.length ? <div className="mt-4 space-y-3">{requests.slice(0, 3).map(request => <div key={request.id} className="rounded-lg border border-[#334460] bg-[#182232] p-3"><p className="truncate text-sm font-bold text-slate-100">{request.event_name}</p><p className="mt-1 text-xs text-slate-400">{request.driver_name || 'Condutor não informado'}</p><p className="mt-1 text-xs text-slate-500">{new Date(request.pickup_datetime).toLocaleDateString('pt-BR')}</p></div>)}</div> : <p className="py-5 text-center text-sm text-slate-400">Nenhuma aprovação pendente.</p>}<Link href="/dashboard/approvals" className="mt-4 flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-100">Abrir fila completa <ArrowRight className="h-4 w-4" /></Link></section>;
}
async function ReservationSnapshot() { const reservations = await getReservations().catch(() => []); return <section className="ops-panel p-5"><div className="flex items-center justify-between border-b border-[#1c2637] pb-3"><div><h2 className="text-sm font-extrabold uppercase text-white">Reservas</h2><p className="mt-1 text-xs text-slate-400">Próximas alocações</p></div><Link href="/dashboard/reservations" className="text-xs font-bold text-red-300">Ver todas</Link></div>{reservations.length ? <div className="mt-3 space-y-2">{reservations.slice(0, 3).map((item: any) => <Link key={item.id} href="/dashboard/reservations" className="block rounded-lg border border-[#334460] bg-[#182232] p-3 hover:bg-[#1e2b3e]"><p className="truncate text-sm font-bold text-slate-100">{item.purpose?.split(' - ')[0] || 'Reserva'}</p><p className="mt-1 text-xs text-slate-400">{item.driver_name || item.driver?.name || 'Condutor não informado'}</p></Link>)}</div> : <p className="py-5 text-center text-sm text-slate-400">Nenhuma reserva ativa.</p>}</section>; }

export default function DashboardPage() {
    return <div className="space-y-6">
        <Suspense fallback={<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"><PanelSkeleton className="h-24" /><PanelSkeleton className="h-24" /><PanelSkeleton className="h-24" /><PanelSkeleton className="h-24" /></div>}><StatusSection /></Suspense>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <section className="min-w-0 xl:col-span-8"><div className="ops-panel overflow-hidden"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#1c2637] px-5 py-4"><div><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-red-400" /><h1 className="text-sm font-extrabold uppercase tracking-wide text-white">Escala & alocação de veículos</h1><span className="ops-mono rounded border border-red-900/70 bg-red-950/40 px-2 py-0.5 text-[10px] text-red-200">HOJE</span></div><p className="mt-1 text-xs text-slate-400">Visão cronológica da frota, reservas e disponibilidade.</p></div><Link href="/dashboard/schedule" className="inline-flex items-center gap-1.5 text-xs font-bold text-red-300 hover:text-red-100">Ver agenda completa <ArrowRight className="h-4 w-4" /></Link></div><Suspense fallback={<PanelSkeleton className="m-5 h-80" />}><TimelineSection /></Suspense></div></section>
            <aside className="space-y-6 xl:col-span-4">
                <section className="ops-panel p-5"><div className="flex items-center justify-between border-b border-[#1c2637] pb-3"><div className="flex items-center gap-2"><TriangleAlert className="h-4 w-4 text-amber-400" /><h2 className="text-sm font-extrabold uppercase text-white">Reparos e alertas</h2></div><Link href="/dashboard/checkins" className="text-xs font-bold text-amber-300">Revisar</Link></div><p className="mt-4 text-sm font-semibold text-slate-200">Bloqueios e devoluções exigem confirmação.</p><p className="mt-1 text-xs leading-relaxed text-slate-400">Acesse revisões, classifique alertas e libere veículos somente após a validação operacional.</p><Link href="/dashboard/occurrences" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-red-300 hover:text-red-100">Ver ocorrências <ArrowRight className="h-4 w-4" /></Link></section>
                <Suspense fallback={<PanelSkeleton className="h-56" />}><ApprovalSnapshot /></Suspense>
                <Suspense fallback={<PanelSkeleton className="h-56" />}><ReservationSnapshot /></Suspense>
                <Suspense fallback={<PanelSkeleton className="h-96" />}><QrSection /></Suspense>
            </aside>
        </div>
    </div>;
}
