import { getVehicleDetails, getUnresolvedOccurrences, registerCheckout } from "@/lib/services/mobile";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, CheckCircle, Info } from "lucide-react";

export default async function CheckoutPage({ params }: { params: { id: string } }) {
    const vehicle = await getVehicleDetails(params.id);
    if (!vehicle) notFound();

    const unresolved = await getUnresolvedOccurrences(params.id);

    async function handleCheckout() {
        'use server';
        await registerCheckout(params.id);
        redirect(`/mobile/vehicle/${params.id}`); // Or to a success page
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href={`/mobile/vehicle/${params.id}`} className="p-2 -ml-2 text-slate-400 hover:text-white">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold">Retirada de Veículo</h1>
                    <p className="text-slate-400 text-sm">{vehicle.model.brand.name} {vehicle.model.name}</p>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-6">

                {/* Status Card */}
                <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Estado Atual</h2>

                    {unresolved.length === 0 ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-emerald-400">Nenhum problema reportado</h3>
                                <p className="text-emerald-500/70 text-sm mt-1">Este veículo não possui ocorrências em aberto.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                <span className="text-amber-400 font-bold">{unresolved.length} ocorrência(s) pendente(s)</span>
                            </div>

                            {unresolved.map((occ: any) => (
                                <div key={occ.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold px-2 py-1 bg-slate-700 rounded text-slate-300">
                                            {occ.type?.name || 'Geral'}
                                        </span>
                                        <span className="text-xs text-slate-500">{new Date(occ.date).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-slate-300 text-sm">{occ.description}</p>
                                    {occ.observation && (
                                        <p className="text-slate-500 text-xs mt-2 border-t border-slate-700 pt-2">
                                            Obs: {occ.observation}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3 text-blue-300 text-sm">
                    <Info className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>Ao confirmar a retirada, você assume a responsabilidade pelo veículo e ciência dos problemas listados acima.</p>
                </div>

            </div>

            {/* Bottom Action */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-slate-950 border-t border-slate-800">
                <form action={handleCheckout}>
                    <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/20 active:scale-[0.98] transition-all"
                    >
                        Confirmar Retirada
                    </button>
                </form>
            </div>
        </div>
    );
}
