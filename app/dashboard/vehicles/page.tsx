import Link from "next/link";
import { Plus, Car, Search, ArrowLeft } from "lucide-react";
import { getVehicles } from "@/lib/services/dashboard";
import { Suspense } from "react";

async function VehicleList({ query, status }: { query: string; status: string }) {
    const vehicles = await getVehicles();
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    const filteredVehicles = vehicles.filter((vehicle) => {
        const model = Array.isArray(vehicle.model) ? vehicle.model[0] : vehicle.model;
        const brand = Array.isArray(model?.brand) ? model.brand[0] : model?.brand;
        const haystack = `${vehicle.license_plate} ${vehicle.chassis} ${model?.name ?? ''} ${brand?.name ?? ''}`.toLocaleLowerCase('pt-BR');
        return (!normalized || haystack.includes(normalized)) && (!status || vehicle.status === status);
    });

    if (filteredVehicles.length === 0) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <div className="col-span-full py-12 text-center bg-slate-800/30 rounded-xl border border-slate-700/50">
                    <Car className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Nenhum veículo encontrado.</p>
                </div>
                {/* Add New Card */}
                <Link
                    href="/dashboard/vehicles/new"
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 rounded-xl hover:border-brand/50 hover:bg-brand/5 transition-all group cursor-pointer h-[280px]"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVehicles.map((vehicle) => (
                <div
                    key={vehicle.id}
                    className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 hover:border-brand/30 transition-all hover:shadow-lg hover:shadow-brand/10"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-slate-700/50 rounded-lg group-hover:bg-brand/20 group-hover:text-brand-400 transition-colors">
                            <Car className="w-6 h-6" />
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${vehicle.status === 'IN_YARD' ? 'bg-brand/10 text-brand-400 border-brand/20' :
                            vehicle.status === 'ON_ROUTE' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                vehicle.status === 'AWAITING_REPAIR' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                    'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                            {vehicle.status === 'IN_YARD' && 'Em Pátio'}
                            {vehicle.status === 'ON_ROUTE' && 'Em Rota'}
                            {vehicle.status === 'AWAITING_REPAIR' && 'Bloqueado para revisão'}
                            {vehicle.status === 'IN_MAINTENANCE' && 'Em Manutenção'}
                        </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1">
                        {(() => {
                            const modelObj = (Array.isArray(vehicle.model) ? vehicle.model[0] : vehicle.model) as { name?: string; brand?: { name?: string } | { name?: string }[] } | null;
                            const modelName = modelObj?.name || 'Modelo Desconhecido';

                            const brandData = modelObj?.brand;
                            const brandName = Array.isArray(brandData) ? brandData[0]?.name : brandData?.name || (vehicle as any).brand || '';

                            return `${brandName} ${modelName}`.trim();
                        })()}
                    </h3>
                    <p className="text-2xl font-mono text-slate-300 mb-4">{vehicle.license_plate}</p>

                    <div className="space-y-2 text-sm text-slate-400">
                        <div className="flex justify-between">
                            <span>Ano:</span>
                            <span className="text-slate-300">{vehicle.year}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Combustível:</span>
                            <span className="text-slate-300">{vehicle.fuel_type}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Uso:</span>
                            <span className="text-slate-300">{vehicle.usage_category}</span>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-700/50 flex gap-2">
                        <Link
                            href={`/dashboard/vehicles/${vehicle.id}`}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-sm py-2 rounded-lg text-white transition-colors text-center"
                        >
                            Detalhes
                        </Link>
                    </div>
                </div>
            ))}

            {/* Add New Card */}
            <Link
                href="/dashboard/vehicles/new"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 rounded-xl hover:border-brand/50 hover:bg-brand/5 transition-all group cursor-pointer h-[280px]"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 h-[280px]">
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Veículos</h1>
                        <p className="text-slate-400 mt-1">Gerencie a frota de veículos da empresa</p>
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

            <form className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 p-4 rounded-xl flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        name="q"
                        defaultValue={q}
                        placeholder="Buscar por placa, modelo ou chassi..."
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50"
                    />
                </div>
                <select name="status" defaultValue={status} className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-slate-300"><option value="">Todos os status</option><option value="IN_YARD">No pátio</option><option value="ON_ROUTE">Em uso</option><option value="AWAITING_REPAIR">Bloqueado para revisão</option><option value="IN_MAINTENANCE">Em manutenção</option></select>
                <button className="rounded-lg bg-brand px-5 py-2 font-medium text-white">Buscar</button>
            </form>

            <Suspense fallback={<VehicleSkeleton />}>
                <VehicleList query={q} status={status} />
            </Suspense>
        </div>
    );
}
