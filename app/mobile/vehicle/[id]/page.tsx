import { getVehicleDetails } from "@/lib/services/mobile";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowLeft, Car } from "lucide-react";

export default async function VehicleMobilePage({ params }: { params: { id: string } }) {
    const vehicle = await getVehicleDetails(params.id);

    if (!vehicle) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center justify-center">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                        <Car className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        {vehicle.model.brand.name} {vehicle.model.name}
                    </h1>
                    <div className="inline-block bg-slate-900 px-3 py-1 rounded text-lg font-mono text-emerald-500 border border-slate-800">
                        {vehicle.license_plate}
                    </div>
                    <p className="text-slate-500 text-sm">
                        {vehicle.year} • {vehicle.fuel_type} • {vehicle.usage_category}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-8">
                    <Link
                        href={`/mobile/vehicle/${params.id}/checkout`}
                        className="group relative overflow-hidden bg-emerald-600 hover:bg-emerald-500 rounded-2xl p-6 transition-all active:scale-95"
                    >
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">Retirada</h3>
                                <p className="text-emerald-100 text-sm">Iniciar uso do veículo</p>
                            </div>
                            <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
                    </Link>

                    <Link
                        href={`/mobile/vehicle/${params.id}/return`}
                        className="group relative overflow-hidden bg-slate-800 hover:bg-slate-700 rounded-2xl p-6 transition-all active:scale-95 border border-slate-700"
                    >
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">Devolução</h3>
                                <p className="text-slate-400 text-sm">Finalizar uso e check-in</p>
                            </div>
                            <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:-translate-x-1 transition-transform" />
                        </div>
                    </Link>
                </div>

                <div className="pt-12 text-center">
                    <p className="text-xs text-slate-600">
                        Painel de Frota &copy; {new Date().getFullYear()}
                    </p>
                </div>
            </div>
        </div>
    );
}
