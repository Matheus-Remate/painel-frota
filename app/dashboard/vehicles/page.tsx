import Link from "next/link";
import { Plus, Car, ArrowLeft, Fuel, Gauge, QrCode } from "lucide-react";
import { getVehicles } from "@/lib/services/dashboard";
import { Suspense } from "react";
import VehicleFilters from "@/components/dashboard/vehicle-filters";
import { vehicleLabel, vehicleStatusMeta } from '@/lib/presentation/vehicle-label';

async function VehicleList({ query, status }: { query: string; status: string }) {
    const vehicles = await getVehicles();
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    const filteredVehicles = vehicles.filter((vehicle) => {
        const model = Array.isArray(vehicle.model) ? vehicle.model[0] : vehicle.model;
        const brand = Array.isArray(model?.brand) ? model.brand[0] : model?.brand;
        const haystack = `${vehicle.license_plate} ${vehicle.chassis} ${vehicle.nickname ?? ''} ${model?.name ?? ''} ${brand?.name ?? ''}`.toLocaleLowerCase('pt-BR');
        return (!normalized || haystack.includes(normalized)) && (!status || (vehicle.operational_status || vehicle.status) === status);
    });

    if (filteredVehicles.length === 0) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div className="ops-empty col-span-full">
                    <Car className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Nenhum veículo encontrado.</p>
                </div>
                {/* Add New Card */}
                <Link
                    href="/dashboard/vehicles/new"
                    className="flex h-[255px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#334460] p-6 transition-all hover:border-red-500/60 hover:bg-red-950/15"
                >
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-brand/20 group-hover:text-brand-400 transition-colors">
                        <Plus className="w-6 h-6 text-slate-400" />
                    </div>
                    <span className="text-slate-400 font-medium group-hover:text-brand-400">Adicionar Veículo</span>
                </Link>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredVehicles.map((vehicle) => {
                const operationalStatus = vehicle.operational_status || vehicle.status;
                return (
                <article key={vehicle.id} className="ops-card p-4"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><span className="ops-icon ops-icon-red"><Car className="size-4" /></span><span className="ops-plate">{vehicle.license_plate}</span></div><span className={vehicleStatusMeta(operationalStatus).className}>{vehicleStatusMeta(operationalStatus).label}</span></div><h3 className="mt-4 truncate text-base font-bold text-white">{vehicleLabel(vehicle)}</h3><p className="mt-1 text-xs text-slate-400">{vehicle.usage_category || 'Uso não categorizado'}</p><dl className="mt-4 grid grid-cols-2 gap-2 border-y border-[#26344d] py-3 text-xs"><div><dt className="text-slate-500">Odômetro</dt><dd className="mt-1 flex items-center gap-1 font-medium text-slate-200"><Gauge className="size-3 text-sky-300" />{vehicle.odometer?.toLocaleString('pt-BR') || '—'} km</dd></div><div><dt className="text-slate-500">Combustível</dt><dd className="mt-1 flex items-center gap-1 font-medium text-slate-200"><Fuel className="size-3 text-emerald-300" />{vehicle.fuel_type || '—'}</dd></div></dl><div className="mt-3 flex items-center justify-between"><span className="text-xs text-slate-500">Ano {vehicle.year || '—'}</span><Link href={`/dashboard/vehicles/${vehicle.id}`} className="ops-link"><QrCode className="size-3.5" />Ficha & QR</Link></div></article>);
            })}

            {/* Add New Card */}
            <Link
                href="/dashboard/vehicles/new"
                className="flex h-[255px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#334460] p-6 transition-all hover:border-red-500/60 hover:bg-red-950/15"
            >
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-brand/20 group-hover:text-brand-400 transition-colors">
                    <Plus className="w-6 h-6 text-slate-400" />
                </div>
                <span className="text-slate-400 font-medium group-hover:text-brand-400">Adicionar Veículo</span>
            </Link>
        </div>
    );
}

function VehicleSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 animate-pulse">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="ops-panel p-5 h-[255px]">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-slate-700 rounded-lg"></div>
                        <div className="w-20 h-6 bg-slate-700 rounded-full"></div>
                    </div>
                    <div className="w-3/4 h-6 bg-slate-700 rounded mb-2"></div>
                    <div className="w-1/2 h-8 bg-slate-700 rounded mb-4"></div>
                    <div className="space-y-3 mt-4">
                        <div className="w-full h-4 bg-slate-700 rounded"></div>
                        <div className="w-full h-4 bg-slate-700 rounded"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default async function VehiclesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
    const { q = '', status = '' } = await searchParams;
    return (
        <div className="space-y-6">
            <div className="ops-panel flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <p className="ops-label">Frota & Pátio</p><h1 className="text-2xl font-bold tracking-tight text-white">Painel de veículos</h1>
                        <p className="mt-1 text-sm text-slate-400">Status, ficha operacional e disponibilidade da frota.</p>
                    </div>
                </div>
                <Link
                    href="/dashboard/vehicles/new"
                    className="bg-brand hover:bg-brand-950 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-lg shadow-brand/20"
                >
                    <Plus className="w-4 h-4" />
                    Novo Veículo
                </Link>
            </div>

            <VehicleFilters initialQuery={q} initialStatus={status} />

            <Suspense fallback={<VehicleSkeleton />}>
                <VehicleList query={q} status={status} />
            </Suspense>
        </div>
    );
}
