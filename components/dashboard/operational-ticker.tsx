import { AlertTriangle, CarFront, CircleCheck, Route } from 'lucide-react';

export default function OperationalTicker({ vehicles, reservations }: { vehicles: any[]; reservations: any[] }) {
    const activeReservations = reservations.filter((item) => item.status === 'ACTIVE').length;
    const available = vehicles.filter((item) => (item.operational_status || item.status) === 'IN_YARD').length;
    const inRoute = vehicles.filter((item) => (item.operational_status || item.status) === 'ON_ROUTE').length;
    const blocked = vehicles.filter((item) => ['AWAITING_REPAIR', 'IN_MAINTENANCE'].includes(item.operational_status || item.status)).length;
    const items = [
        { label: 'Disponíveis', value: available, icon: CircleCheck, tone: 'text-emerald-300' },
        { label: 'Em operação', value: inRoute, icon: Route, tone: 'text-sky-300' },
        { label: 'Bloqueados', value: blocked, icon: AlertTriangle, tone: 'text-amber-300' },
        { label: 'Reservas ativas', value: activeReservations, icon: CarFront, tone: 'text-slate-200' },
    ];
    return <section aria-label="Resumo operacional" className="ops-ticker"><div className="mx-auto flex max-w-[1920px] items-center gap-2 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8"><span className="ops-mono shrink-0 text-[10px] font-bold tracking-[.16em] text-slate-500">OPERAÇÃO AO VIVO</span>{items.map((item) => { const Icon = item.icon; return <span key={item.label} className="inline-flex shrink-0 items-center gap-1.5 border-l border-[#26344d] px-3 text-xs text-slate-400"><Icon className={`h-3.5 w-3.5 ${item.tone}`} /><strong className="ops-mono text-slate-100">{item.value}</strong>{item.label}</span>; })}{!vehicles.length && <span className="text-xs text-slate-500">Conecte os dados da frota para visualizar o resumo.</span>}</div></section>;
}
