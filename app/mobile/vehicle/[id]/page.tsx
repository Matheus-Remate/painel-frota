import EmergencyCheckoutForm from '@/components/mobile/emergency-checkout-form';
import { getPublicReviewHistory, getVehicleDetails } from '@/lib/services/mobile';
import { AlertTriangle, Car, ClipboardCheck } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function VehicleMobilePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const { id } = await params;
    const query = await searchParams;
    const token = typeof query.token === 'string' ? query.token : '';
    const vehicle = await getVehicleDetails(id, token);
    if (!vehicle) notFound();
    const reviews = await getPublicReviewHistory(id, token);
    const status = vehicle.status === 'ON_ROUTE' ? 'Em uso' : vehicle.status === 'IN_YARD' ? 'No pátio' : 'Indisponível';
    return <main className="min-h-screen bg-slate-950 p-6 text-white"><div className="mx-auto max-w-md space-y-6 py-10">
        <header className="text-center"><div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full border border-slate-700 bg-slate-900"><Car className="size-8 text-emerald-400" /></div><h1 className="text-2xl font-bold">Retirada imediata</h1><p className="mt-2 text-sm text-amber-300">Somente em urgência</p><p className="mt-3 inline-flex rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-200">Status de uso: {status}</p></header>
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100"><div className="flex gap-3"><AlertTriangle className="size-5 shrink-0 text-amber-400" /><p>Use este acesso apenas quando não for possível aguardar o fluxo normal de reserva. A retirada será registrada e os gestores serão notificados.</p></div></section>
        {query.checkout === 'success' ? <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-emerald-200">Retirada emergencial registrada.</div> : <EmergencyCheckoutForm vehicleId={id} token={token} />}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="mb-3 flex items-center gap-2"><ClipboardCheck className="size-5 text-emerald-400" /><h2 className="font-semibold">Histórico de revisões</h2></div><div className="space-y-2 text-sm">{reviews.length ? reviews.map((review: any) => <div key={review.checked_in_at} className="flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2"><span>{new Date(review.checked_in_at).toLocaleDateString('pt-BR')}</span><span className={review.has_issues && !review.resolved ? 'text-amber-300' : 'text-emerald-300'}>{review.has_issues && !review.resolved ? `Pendente ${review.alert_level || ''}` : 'Revisão concluída'}</span></div>) : <p className="text-slate-400">Sem revisões registradas.</p>}</div></section>
    </div></main>;
}
