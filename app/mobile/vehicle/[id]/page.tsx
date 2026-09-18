import EmergencyCheckoutForm from '@/components/mobile/emergency-checkout-form';
import { getActiveCheckout, getPublicReviewHistory, getScheduledPickup, getVehicleDetails } from '@/lib/services/mobile';
import { AlertTriangle, Car, ClipboardCheck, LogIn, LogOut, UserRound, Zap } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function VehicleMobilePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const { id } = await params;
    const query = await searchParams;
    const token = typeof query.token === 'string' ? query.token : '';
    const vehicle = await getVehicleDetails(id, token);
    if (!vehicle) notFound();

    const [activeCheckout, scheduledPickup, reviews] = await Promise.all([
        getActiveCheckout(id, token), getScheduledPickup(id, token), getPublicReviewHistory(id, token),
    ]);
    const inUse = vehicle.status === 'ON_ROUTE';
    const modelName = [vehicle.model?.brand?.name, vehicle.model?.name].filter(Boolean).join(' ') || 'Veículo';
    const queryToken = encodeURIComponent(token);
    const hubHref = `/mobile/vehicle/${id}?token=${queryToken}`;
    const emergencyMode = query.mode === 'emergency';

    return <main className="min-h-screen bg-slate-950 p-6 pb-12 text-white"><div className="mx-auto max-w-md space-y-6 py-6">
        <header className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center shadow-xl shadow-slate-950/30">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full border border-slate-700 bg-slate-950"><Car className="size-8 text-emerald-400" /></div>
            <h1 className="text-2xl font-bold">{modelName}</h1>
            {vehicle.nickname && <p className="mt-1 text-sm font-medium text-emerald-300">{vehicle.nickname}</p>}
            <p className="mt-3 text-lg font-semibold tracking-wide text-white">{vehicle.license_plate}</p>
            <div className={`mt-4 rounded-xl border p-3 text-sm ${inUse ? 'border-amber-400/30 bg-amber-400/10 text-amber-100' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'}`}>
                <p className="font-semibold">{inUse ? 'Veículo em uso' : vehicle.status === 'IN_YARD' ? 'Veículo no pátio' : 'Veículo indisponível'}</p>
                {inUse && <p className="mt-1 flex items-center justify-center gap-2 text-amber-50"><UserRound className="size-4" />Em uso por {activeCheckout?.driver_name || 'condutor não identificado'}</p>}
            </div>
        </header>

        {query.checkout === 'success' && <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-emerald-100">Retirada registrada com sucesso.</div>}

        <section className="space-y-3" aria-label="Operações do veículo">
            {!inUse && scheduledPickup ? <Link href={`/mobile/vehicle/${id}/checkout?token=${queryToken}`} className="flex items-center justify-between rounded-2xl bg-emerald-600 p-5 font-bold shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-300">
                <span className="flex items-center gap-3"><LogIn className="size-6" />Retirada</span><span aria-hidden="true">→</span>
            </Link> : <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-5 text-slate-500"><span className="flex items-center gap-3"><LogIn className="size-6" />Retirada</span><span className="max-w-48 text-right text-xs">{inUse ? 'Indisponível enquanto o veículo estiver em uso' : 'Disponível no horário de uma reserva ativa'}</span></div>}
            {scheduledPickup && !inUse && <p className="px-1 text-xs text-slate-400">Reserva prevista para {scheduledPickup.driver?.name || 'condutor informado'}.</p>}
            {inUse ? <Link href={`/mobile/vehicle/${id}/return?token=${queryToken}`} className="flex items-center justify-between rounded-2xl border border-sky-400/30 bg-sky-500/15 p-5 font-bold text-sky-50 transition hover:bg-sky-500/25 focus:outline-none focus:ring-2 focus:ring-sky-300"><span className="flex items-center gap-3"><LogOut className="size-6" />Devolução</span><span aria-hidden="true">→</span></Link> : <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-5 text-slate-500"><span className="flex items-center gap-3"><LogOut className="size-6" />Devolução</span><span className="text-xs">Disponível quando o veículo estiver em uso</span></div>}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <Link href={`${hubHref}&mode=emergency`} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 underline decoration-slate-600 underline-offset-4 hover:text-white"><Zap className="size-3.5 text-amber-300" />Retirada imediata</Link>
            {emergencyMode && <div className="mt-4 space-y-4"><div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100"><AlertTriangle className="size-5 shrink-0 text-amber-400" /><p>Use somente em urgência, quando não for possível seguir a retirada programada. A operação será registrada e os gestores serão notificados.</p></div>{!inUse && vehicle.status === 'IN_YARD' ? query.checkout !== 'success' && <EmergencyCheckoutForm vehicleId={id} token={token} /> : <p className="rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-300">A retirada imediata está indisponível porque este veículo não está no pátio.</p>}</div>}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="mb-3 flex items-center gap-2"><ClipboardCheck className="size-5 text-emerald-400" /><h2 className="font-semibold">Histórico de revisões</h2></div><div className="space-y-2 text-sm">{reviews.length ? reviews.map((review: any) => <div key={review.checked_in_at} className="flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2"><span>{new Date(review.checked_in_at).toLocaleDateString('pt-BR')}</span><span className={review.has_issues && !review.resolved ? 'text-amber-300' : 'text-emerald-300'}>{review.has_issues && !review.resolved ? `Pendente ${review.alert_level || ''}` : 'Revisão concluída'}</span></div>) : <p className="text-slate-400">Sem revisões registradas.</p>}</div></section>
    </div></main>;
}
