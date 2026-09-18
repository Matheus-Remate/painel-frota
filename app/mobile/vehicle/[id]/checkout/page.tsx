import CheckoutForm from '@/components/mobile/checkout-form';
import { getLastCheckin, getScheduledPickup, getUnresolvedOccurrences, getVehicleDetails, hasBlockingReturn } from '@/lib/services/mobile';
import { AlertTriangle, ArrowLeft, CheckCircle, ClipboardCheck, Fuel, Gauge } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { blocksTravel } from '@/lib/domain/alert-level';

export default async function CheckoutPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ token?: string }> }) {
    const { id } = await params;
    const { token = '' } = await searchParams;
    const vehicle = await getVehicleDetails(id, token);
    if (!vehicle) notFound();
    const [unresolved, pickup, lastReturn, oldBlockingReturn] = await Promise.all([getUnresolvedOccurrences(id, token), getScheduledPickup(id, token), getLastCheckin(id, token), hasBlockingReturn(id, token)]);
    const blocked = vehicle.status !== 'IN_YARD' || !pickup ||
        unresolved.some((item) => blocksTravel(item.alert_level)) ||
        oldBlockingReturn || Boolean(lastReturn?.has_issues && !lastReturn.resolved && blocksTravel(lastReturn.alert_level || 'HIGH'));
    const blockingReasons = [
        vehicle.status === 'ON_ROUTE' && 'O veículo já está em uso. Registre a devolução antes de uma nova retirada.',
        vehicle.status === 'AWAITING_REPAIR' && 'O veículo aguarda reparo ou liberação do gestor.',
        vehicle.status === 'IN_MAINTENANCE' && 'O veículo está em manutenção.',
        vehicle.status !== 'IN_YARD' && !['ON_ROUTE', 'AWAITING_REPAIR', 'IN_MAINTENANCE'].includes(vehicle.status) && 'O veículo não está disponível no pátio.',
        !pickup && 'Não há reserva ativa dentro da janela de retirada (até duas horas antes do horário marcado).',
        unresolved.some((item) => blocksTravel(item.alert_level)) && 'Há uma ocorrência de nível alto ou urgente ainda pendente.',
        oldBlockingReturn && 'Há uma devolução anterior com alerta alto ou urgente ainda pendente.',
        Boolean(lastReturn?.has_issues && !lastReturn.resolved && blocksTravel(lastReturn.alert_level || 'HIGH')) && `A última devolução possui alerta pendente${lastReturn?.alert_level ? ` (${lastReturn.alert_level})` : ''}.`,
    ].filter(Boolean) as string[];

    return (
        <main className="min-h-screen bg-slate-950 p-6 pb-12 text-white"><div className="mx-auto max-w-md space-y-7">
            <header className="flex items-center gap-4"><Link aria-label="Voltar" href={`/mobile/vehicle/${id}?token=${encodeURIComponent(token)}`} className="p-2 text-slate-400"><ArrowLeft /></Link><div><h1 className="text-xl font-bold">Registrar retirada</h1><p className="text-sm text-slate-400">{vehicle.license_plate} · {vehicle.model?.brand?.name} {vehicle.model?.name}</p></div></header>
            <section className={`rounded-xl border p-4 ${blocked ? 'border-amber-500/30 bg-amber-500/10' : 'border-emerald-500/20 bg-emerald-500/10'}`}>
                <div className="flex gap-3">{blocked ? <AlertTriangle className="size-5 shrink-0 text-amber-400" /> : <CheckCircle className="size-5 shrink-0 text-emerald-400" />}<div><h2 className="font-semibold">{blocked ? 'Retirada bloqueada' : 'Veículo disponível'}</h2>{blocked ? <><p className="mt-1 text-sm text-slate-200">Para proteger a operação, esta retirada não pode ser registrada agora.</p><ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-100">{blockingReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul><p className="mt-3 text-xs text-slate-300">Se a pendência já foi tratada, peça a um gestor para resolvê-la e atualize esta página.</p></> : <p className="mt-1 text-sm text-slate-300">Confira os dados da última devolução antes de assumir a custódia.</p>}</div></div>
            </section>
            {pickup && <section className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-200"><strong>Condutor previsto:</strong> {pickup.driver?.name}<br /><strong>Retirada:</strong> {new Date(pickup.start_date).toLocaleString('pt-BR')}<br /><strong>Devolução:</strong> {new Date(pickup.end_date).toLocaleString('pt-BR')}</section>}
            {lastReturn && <section className="grid grid-cols-2 gap-3 text-sm">{vehicle.qr_display_settings?.odometer !== false && <div className="rounded-xl border border-slate-800 bg-slate-900 p-4"><Gauge className="mb-2 size-5 text-emerald-400" />{lastReturn.odometer} km</div>}{vehicle.qr_display_settings?.fuel !== false && <div className="rounded-xl border border-slate-800 bg-slate-900 p-4"><Fuel className="mb-2 size-5 text-amber-400" />{lastReturn.fuel_level || 'Não informado'}</div>}</section>}
            {lastReturn && (lastReturn.return_notes || lastReturn.repair_notes || lastReturn.has_issues) && <section className={`rounded-xl border p-4 text-sm ${lastReturn.has_issues && !lastReturn.resolved ? 'border-amber-500/30 bg-amber-500/10 text-amber-100' : 'border-slate-800 bg-slate-900 text-slate-200'}`}><div className="flex gap-3"><ClipboardCheck className="size-5 shrink-0 text-emerald-400" /><div><h2 className="font-semibold">Última devolução</h2><p className="mt-1 text-slate-300">{lastReturn.has_issues ? `${lastReturn.resolved ? 'Apontamento resolvido' : 'Há apontamento pendente'}${lastReturn.alert_level ? ` · ${lastReturn.alert_level}` : ''}` : 'Sem apontamentos pendentes.'}</p>{(lastReturn.return_notes || lastReturn.repair_notes) && <p className="mt-3 whitespace-pre-wrap text-slate-200">{lastReturn.return_notes || lastReturn.repair_notes}</p>}</div></div></section>}
            {!blocked && pickup && <CheckoutForm vehicleId={id} token={token} reservationId={pickup.id} scheduledDriver={pickup.driver?.name || ''} lastOdometer={Number(vehicle.odometer ?? 0)} lastFuel={lastReturn?.fuel_level || ''} showOdometer={vehicle.qr_display_settings?.odometer !== false} showFuel={vehicle.qr_display_settings?.fuel !== false} />}
        </div></main>
    );
}
