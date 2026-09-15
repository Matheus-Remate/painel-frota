import { getLastCheckin, getUnresolvedOccurrences, getVehicleDetails } from '@/lib/services/mobile';
import { AlertTriangle, ArrowLeft, ArrowRight, Car, CheckCircle, Fuel, Gauge } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const STATUS = {
    IN_YARD: ['No pátio', 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'],
    ON_ROUTE: ['Em uso', 'text-blue-400 bg-blue-500/10 border-blue-500/20'],
    AWAITING_REPAIR: ['Aguardando reparo', 'text-amber-400 bg-amber-500/10 border-amber-500/20'],
    IN_MAINTENANCE: ['Em manutenção', 'text-amber-400 bg-amber-500/10 border-amber-500/20'],
} as const;

export default async function VehicleMobilePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const { id } = await params;
    const query = await searchParams;
    const token = typeof query.token === 'string' ? query.token : '';
    const vehicle = await getVehicleDetails(id, token);
    if (!vehicle) notFound();
    const [lastReturn, unresolved] = await Promise.all([getLastCheckin(id, token), getUnresolvedOccurrences(id, token)]);
    const status = STATUS[vehicle.status as keyof typeof STATUS] ?? ['Status desconhecido', 'text-slate-300 bg-slate-800 border-slate-700'];
    const tokenQuery = `token=${encodeURIComponent(token)}`;

    return (
        <main className="min-h-screen bg-slate-950 p-6 text-white">
            <div className="mx-auto max-w-md space-y-6 py-8">
                <header className="text-center">
                    <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full border border-slate-700 bg-slate-800"><Car className="size-8 text-emerald-500" /></div>
                    <h1 className="text-2xl font-bold">{vehicle.model?.brand?.name} {vehicle.model?.name}</h1>
                    <p className="mt-2 inline-block rounded border border-slate-800 bg-slate-900 px-3 py-1 font-mono text-lg text-emerald-400">{vehicle.license_plate}</p>
                    <div className={`mx-auto mt-3 w-fit rounded-full border px-3 py-1 text-xs font-semibold ${status[1]}`}>{status[0]}</div>
                </header>

                {(query.success === 'true' || query.checkout === 'success') && (
                    <div className="flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-300"><CheckCircle className="size-5 shrink-0" /><p>{query.checkout === 'success' ? 'Retirada registrada. Boa viagem!' : 'Devolução registrada e gestor notificado.'}</p></div>
                )}

                <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                    <h2 className="font-semibold">Condição para o próximo condutor</h2>
                    {lastReturn ? (
                        <div className="mt-4 space-y-3 text-sm text-slate-300">
                            <p>Última devolução por <strong className="text-white">{lastReturn.driver_name || 'não identificado'}</strong>, em {new Date(lastReturn.checked_in_at).toLocaleString('pt-BR')}.</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg bg-slate-950 p-3"><Gauge className="mb-1 size-4 text-emerald-400" /><span className="font-mono">{lastReturn.odometer} km</span></div>
                                <div className="rounded-lg bg-slate-950 p-3"><Fuel className="mb-1 size-4 text-amber-400" /><span>{lastReturn.fuel_level || 'Não informado'}</span></div>
                            </div>
                            {lastReturn.has_issues && <p className="flex gap-2 rounded-lg bg-amber-500/10 p-3 text-amber-300"><AlertTriangle className="size-5 shrink-0" />Há itens marcados para revisão. A retirada permanece bloqueada até liberação do gestor.</p>}
                            {!!(lastReturn.return_notes || lastReturn.repair_notes) && <p className="rounded-lg border border-slate-800 p-3">Observação: {lastReturn.return_notes || lastReturn.repair_notes}</p>}
                        </div>
                    ) : <p className="mt-3 text-sm text-slate-400">Ainda não existe devolução registrada para este veículo.</p>}
                    {unresolved.length > 0 && <p className="mt-3 text-sm text-amber-300">{unresolved.length} ocorrência(s) operacional(is) em aberto.</p>}
                </section>

                <div className="grid gap-3">
                    <Link aria-disabled={vehicle.status !== 'IN_YARD'} href={vehicle.status === 'IN_YARD' ? `/mobile/vehicle/${id}/checkout?${tokenQuery}` : '#'} className={`flex items-center justify-between rounded-2xl p-5 font-bold ${vehicle.status === 'IN_YARD' ? 'bg-emerald-600 hover:bg-emerald-500' : 'pointer-events-none bg-slate-800 text-slate-500'}`}>Retirada <ArrowRight className="size-5" /></Link>
                    <Link aria-disabled={vehicle.status !== 'ON_ROUTE'} href={vehicle.status === 'ON_ROUTE' ? `/mobile/vehicle/${id}/return?${tokenQuery}` : '#'} className={`flex items-center justify-between rounded-2xl border p-5 font-bold ${vehicle.status === 'ON_ROUTE' ? 'border-slate-700 bg-slate-800 hover:bg-slate-700' : 'pointer-events-none border-slate-800 bg-slate-900 text-slate-600'}`}>Devolução <ArrowLeft className="size-5" /></Link>
                </div>
                <p className="text-center text-xs text-slate-600">O QR identifica este veículo. Não compartilhe o endereço fora da operação.</p>
            </div>
        </main>
    );
}
