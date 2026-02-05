import { getVehicleDetails, getUnresolvedOccurrences, registerCheckout, getVehicleHistory } from "@/lib/services/mobile";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, History } from "lucide-react";
import ReportList from "@/components/mobile/report-list";

export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const vehicle = await getVehicleDetails(id);
    if (!vehicle) notFound();

    const unresolved = await getUnresolvedOccurrences(id);
    const history = await getVehicleHistory(id);

    // Data atual formatada (pt-BR)
    const now = new Date();
    const currentDate = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const currentTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    async function handleCheckout() {
        'use server';
        await registerCheckout(id);
        redirect(`/mobile/vehicle/${id}`);
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 pb-32">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href={`/mobile/vehicle/${id}`} className="p-2 -ml-2 text-slate-400 hover:text-white">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold">Retirada de Veículo</h1>
                    <p className="text-slate-400 text-sm">{vehicle.model?.brand?.name || ''} {vehicle.model?.name || ''}</p>
                </div>
            </div>

            {/* Time Display */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center mb-8">
                <div className="flex flex-col items-center gap-2">
                    <Clock className="w-8 h-8 text-emerald-500 mb-1" />
                    <div className="text-3xl font-bold text-white tracking-tight">{currentTime}</div>
                    <div className="text-slate-400 text-sm font-medium uppercase tracking-wide">{currentDate}</div>
                </div>
            </div>

            <div className="space-y-8">

                {/* Status Section */}
                <div>
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Estado Atual</h2>
                    {unresolved.length === 0 ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-emerald-400">Tudo Certo</h3>
                                <p className="text-emerald-500/70 text-sm mt-1">Veículo liberado sem pendências.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-amber-400">Atenção Necessária</h3>
                                <p className="text-amber-500/70 text-sm mt-1">Existem {unresolved.length} ocorrências em aberto.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* History Section - Reports only */}
                <div>
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Últimos Report
                    </h2>
                    <ReportList history={history} />
                </div>

            </div>

            {/* Bottom Action */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-slate-950/80 backdrop-blur-md border-t border-slate-800">
                <form action={handleCheckout}>
                    <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        Confirmar Retirada
                    </button>
                    <p className="text-center text-xs text-slate-500 mt-3">
                        Ao confirmar, você registra o início da utilização.
                    </p>
                </form>
            </div>
        </div>
    );
}
