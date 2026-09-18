import ReturnForm from '@/components/mobile/return-form';
import { getActiveCheckout, getLastCheckin, getVehicleDetails } from '@/lib/services/mobile';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function ReturnPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ token?: string }> }) {
    const { id } = await params;
    const { token = '' } = await searchParams;
    const vehicle = await getVehicleDetails(id, token);
    if (!vehicle || vehicle.status !== 'ON_ROUTE') notFound();
    const [lastCheckin, checkout] = await Promise.all([getLastCheckin(id, token), getActiveCheckout(id, token)]);
    const lastOdometer = Number(vehicle.odometer || lastCheckin?.odometer || 0);
    return <main className="min-h-screen bg-slate-950 p-6 pb-24 text-white"><div className="mx-auto max-w-md">
        <header className="mb-8 flex items-center gap-4"><Link aria-label="Voltar" href={`/mobile/vehicle/${id}?token=${encodeURIComponent(token)}`} className="p-2 text-slate-400"><ArrowLeft /></Link><div><h1 className="text-xl font-bold">Registrar devolução</h1><p className="text-sm text-slate-400">{vehicle.license_plate} · preencha todos os dados</p></div></header>
        <ReturnForm vehicleId={id} token={token} lastOdometer={lastOdometer} driverName={checkout?.driver_name || ''} />
    </div></main>;
}
