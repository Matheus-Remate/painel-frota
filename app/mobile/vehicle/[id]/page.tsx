import EmergencyCheckoutForm from '@/components/mobile/emergency-checkout-form';
import { getVehicleDetails } from '@/lib/services/mobile';
import { AlertTriangle, Car } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function VehicleMobilePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const { id } = await params;
    const query = await searchParams;
    const token = typeof query.token === 'string' ? query.token : '';
    const vehicle = await getVehicleDetails(id, token);
    if (!vehicle) notFound();
    return <main className="min-h-screen bg-slate-950 p-6 text-white"><div className="mx-auto max-w-md space-y-6 py-10">
        <header className="text-center"><div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full border border-slate-700 bg-slate-900"><Car className="size-8 text-emerald-400" /></div><h1 className="text-2xl font-bold">Retirada imediata</h1><p className="mt-2 text-sm text-amber-300">Somente em urgência</p></header>
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100"><div className="flex gap-3"><AlertTriangle className="size-5 shrink-0 text-amber-400" /><p>Use este acesso apenas quando não for possível aguardar o fluxo normal de reserva. A retirada será registrada e os gestores serão notificados.</p></div></section>
        {query.checkout === 'success' ? <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-emerald-200">Retirada emergencial registrada.</div> : <EmergencyCheckoutForm vehicleId={id} token={token} />}
    </div></main>;
}
