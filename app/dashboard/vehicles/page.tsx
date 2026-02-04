import Link from "next/link";
import { Plus, Car, Search, Filter, ArrowLeft } from "lucide-react";
import { getVehicles } from "@/lib/services/dashboard";

export default async function VehiclesPage() {
    const vehicles = await getVehicles();

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
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-lg shadow-emerald-500/20"
                >
                    <Plus className="w-4 h-4" />
                    Novo Veículo
                </Link>
            </div>

            {/* Filters Bar */}
            <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 p-4 rounded-xl flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por placa, modelo ou chassi..."
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                    <Filter className="w-4 h-4" />
                    Filtros
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {vehicles.map((vehicle) => (
                    <div
                        key={vehicle.id}
                        className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 hover:border-emerald-500/30 transition-all hover:shadow-lg hover:shadow-emerald-500/10"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-slate-700/50 rounded-lg group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors">
                                <Car className="w-6 h-6" />
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${vehicle.status === 'IN_YARD' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                vehicle.status === 'ON_ROUTE' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                    vehicle.status === 'AWAITING_REPAIR' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                        'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                {vehicle.status === 'IN_YARD' && 'Em Pátio'}
                                {vehicle.status === 'ON_ROUTE' && 'Em Rota'}
                                {vehicle.status === 'AWAITING_REPAIR' && 'Aguardando Reparo'}
                                {vehicle.status === 'IN_MAINTENANCE' && 'Em Manutenção'}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-1">
                            {vehicle.model?.brand?.name || (typeof (vehicle as any)?.brand === 'string' ? (vehicle as any).brand : '') || ''} {vehicle.model?.name || (typeof (vehicle as any)?.model === 'string' ? (vehicle as any).model : '') || ''}
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

                {/* Empty State / Add New Card */}
                <Link
                    href="/dashboard/vehicles/new"
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 rounded-xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group cursor-pointer"
                >
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors">
                        <Plus className="w-6 h-6 text-slate-400" />
                    </div>
                    <span className="text-slate-400 font-medium group-hover:text-emerald-400">Adicionar Veículo</span>
                </Link>
            </div>
        </div>
    );
}
