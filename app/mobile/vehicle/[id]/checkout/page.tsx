import CheckoutForm from '@/components/mobile/checkout-form';
import ReportList from '@/components/mobile/report-list';
import { getLastCheckin, getUnresolvedOccurrences, getVehicleDetails, getVehicleHistory } from '@/lib/services/mobile';
import { AlertTriangle, ArrowLeft, CheckCircle, Fuel, Gauge, History } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function CheckoutPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ token?: string }> }) {
    const { id } = await params;
    const { token = '' } = await searchParams;
    const vehicle = await getVehicleDetails(id, token);
    if (!vehicle) notFound();
    const [unresolved, history, lastReturn] = await Promise.all([getUnresolvedOccurrences(id, token), getVehicleHistory(id, token), getLastCheckin(id, token)]);
    const blocked = vehicle.status !== 'IN_YARD' || unresolved.length > 0 || lastReturn?.has_issues;

    return (
        <main className="min-h-screen bg-slate-950 p-6 pb-12 text-white"><div className="mx-auto max-w-md space-y-7">
            <header className="flex items-center gap-4"><Link aria-label="Voltar" href={`/mobile/vehicle/${id}?token=${encodeURIComponent(token)}`} className="p-2 text-slate-400"><ArrowLeft /></Link><div><h1 className="text-xl font-bold">Registrar retirada</h1><p className="text-sm text-slate-400">{vehicle.license_plate} · {vehicle.model?.brand?.name} {vehicle.model?.name}</p></div></header>
            <section className={`rounded-xl border p-4 ${blocked ? 'border-amber-500/30 bg-amber-500/10' : 'border-emerald-500/20 bg-emerald-500/10'}`}>
                <div className="flex gap-3">{blocked ? <AlertTriangle className="size-5 shrink-0 text-amber-400" /> : <CheckCircle className="size-5 shrink-0 text-emerald-400" />}<div><h2 className="font-semibold">{blocked ? 'Retirada bloqueada' : 'Veículo disponível'}</h2><p className="mt-1 text-sm text-slate-300">{blocked ? 'Há uso em andamento, manutenção ou pendência ainda não liberada pelo gestor.' : 'Confira os dados da última devolução antes de assumir a custódia.'}</p></div></div>
            </section>
            {lastReturn && <section className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl border border-slate-800 bg-slate-900 p-4"><Gauge className="mb-2 size-5 text-emerald-400" />{lastReturn.odometer} km</div><div className="rounded-xl border border-slate-800 bg-slate-900 p-4"><Fuel className="mb-2 size-5 text-amber-400" />{lastReturn.fuel_level || 'Não informado'}</div></section>}
            {!blocked && <CheckoutForm vehicleId={id} token={token} lastOdometer={Number(vehicle.odometer ?? 0)} />}
            <section><h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400"><History className="size-4" /> Últimas devoluções</h2><ReportList history={history} /></section>
        </div></main>
    );
}
