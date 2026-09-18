import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, CarFront, ClipboardCheck, QrCode, TriangleAlert } from 'lucide-react';
import { VehicleStatusCards } from '@/components/dashboard/vehicle-status-cards';
import PendingApprovals from '@/components/dashboard/pending-approvals';
import GanttChart from '@/components/dashboard/gantt-chart';
import { getReservations } from '@/lib/services/schedule';
import { getVehicles } from '@/lib/services/dashboard';
import { getPendingRequests } from '@/lib/services/requests';

function PanelSkeleton({ className = 'h-48' }: { className?: string }) { return <div className={`ops-panel animate-pulse bg-[#182232]/60 ${className}`} />; }

async function StatusSection() {
    const [reservations, vehicles] = await Promise.all([getReservations(), getVehicles()]);
    return <VehicleStatusCards vehicles={vehicles} reservations={reservations} />;
}

async function TimelineSection() {
    const [reservations, rawVehicles] = await Promise.all([getReservations(), getVehicles()]);
    const vehicles = rawVehicles.map(vehicle => ({ id: vehicle.id, model: typeof vehicle.model === 'string' ? vehicle.model : (vehicle.model as any)?.name || 'Veículo sem modelo', license_plate: vehicle.license_plate }));
    return <GanttChart reservations={reservations} vehicles={vehicles} />;
}

async function ApprovalsSection() {
    const [reservations, rawVehicles, requests] = await Promise.all([getReservations(), getVehicles(), getPendingRequests()]);
    const vehicles = rawVehicles.map(vehicle => { const model = vehicle.model as any; return { id: vehicle.id, license_plate: vehicle.license_plate, model: typeof vehicle.model === 'string' ? vehicle.model : model?.name || '', brand: model?.brand?.name || '' }; });
    return <PendingApprovals requests={requests} vehicles={vehicles} reservations={reservations} />;
}

export default function DashboardPage() {
    return <div className="space-y-6">
        <section className="grid grid-cols-1 gap-3 lg:grid-cols-4"><Suspense fallback={<><PanelSkeleton className="h-20" /><PanelSkeleton className="h-20" /><PanelSkeleton className="h-20" /><PanelSkeleton className="h-20" /></>}><StatusSection /></Suspense></section>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <section className="xl:col-span-8"><div className="ops-panel overflow-hidden"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#1c2637] px-5 py-4"><div><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-red-400" /><h1 className="text-sm font-extrabold uppercase tracking-wide text-white">Escala & alocação de veículos</h1><span className="ops-mono rounded border border-red-900/70 bg-red-950/40 px-2 py-0.5 text-[10px] text-red-200">HOJE</span></div><p className="mt-1 text-xs text-slate-400">Visão cronológica da frota, reservas e disponibilidade.</p></div><Link href="/dashboard/schedule" className="inline-flex items-center gap-1.5 text-xs font-bold text-red-300 hover:text-red-100">Ver agenda completa <ArrowRight className="h-4 w-4" /></Link></div><Suspense fallback={<PanelSkeleton className="m-5 h-80" />}><TimelineSection /></Suspense></div></section>
            <aside className="space-y-6 xl:col-span-4">
                <section className="ops-panel p-5"><div className="flex items-center justify-between border-b border-[#1c2637] pb-3"><div className="flex items-center gap-2"><QrCode className="h-4 w-4 text-red-400" /><h2 className="text-sm font-extrabold uppercase text-white">Despacho por QR</h2></div><span className="ops-mono text-[10px] text-emerald-400">PRONTO</span></div><div className="mt-4 rounded-lg border border-dashed border-slate-600 bg-[#0b0f17]/70 p-5 text-center"><QrCode className="mx-auto h-12 w-12 text-slate-500" /><p className="mt-3 text-sm font-semibold text-slate-200">Operação de campo segura</p><p className="mt-1 text-xs leading-relaxed text-slate-400">Acesse a ficha de um veículo para imprimir ou renovar o QR de retirada e devolução.</p></div><Link href="/dashboard/vehicles" className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-[#334460] bg-[#182232] px-3 py-2.5 text-xs font-bold text-slate-100 hover:bg-[#1e2b3e]"><CarFront className="h-4 w-4" />Abrir frota e pátio</Link></section>
                <section className="ops-panel p-5"><div className="flex items-center justify-between border-b border-[#1c2637] pb-3"><div className="flex items-center gap-2"><TriangleAlert className="h-4 w-4 text-amber-400" /><h2 className="text-sm font-extrabold uppercase text-white">Operação crítica</h2></div><Link href="/dashboard/checkins" className="text-xs font-bold text-amber-300">Revisar</Link></div><p className="mt-4 text-sm font-semibold text-slate-200">Alertas e devoluções exigem confirmação.</p><p className="mt-1 text-xs leading-relaxed text-slate-400">A central de notificações mantém os eventos pendentes acessíveis em qualquer tela.</p><Link href="/dashboard/occurrences" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-red-300 hover:text-red-100">Ver ocorrências <ArrowRight className="h-4 w-4" /></Link></section>
            </aside>
        </div>
        <section className="ops-panel overflow-hidden"><div className="flex items-center justify-between border-b border-[#1c2637] px-5 py-4"><div className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-amber-400" /><h2 className="text-sm font-extrabold uppercase tracking-wide text-white">Fila de aprovações</h2></div><Link href="/dashboard/approvals" className="text-xs font-bold text-amber-300 hover:text-amber-100">Abrir fila completa</Link></div><div className="p-5"><Suspense fallback={<PanelSkeleton className="h-40" />}><ApprovalsSection /></Suspense></div></section>
    </div>;
}
