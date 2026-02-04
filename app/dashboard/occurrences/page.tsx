import Link from "next/link";
import { Plus, AlertTriangle, Calendar, Car, User } from "lucide-react";
import { getOccurrences } from "@/lib/services/occurrences";

export default async function OccurrencesPage() {
    const occurrences = await getOccurrences();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Ocorrências</h1>
                    <p className="text-slate-400 mt-1">Gestão de multas, sinistros e eventos da frota</p>
                </div>

                <Link
                    href="/dashboard/occurrences/new"
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors shadow-lg shadow-emerald-500/20"
                >
                    <Plus className="w-5 h-5" />
                    Nova Ocorrência
                </Link>
            </div>

            <div className="space-y-4">
                {occurrences.length === 0 ? (
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-12 text-center text-slate-500">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                        <p>Nenhuma ocorrência registrada.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {occurrences.map((occ: any) => (
                            <div key={occ.id} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-amber-500/10 text-amber-500 px-2 py-1 rounded text-xs font-bold border border-amber-500/20">
                                        {occ.type?.name}
                                    </div>
                                    <span className="text-slate-500 text-xs flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(occ.date).toLocaleDateString()}
                                    </span>
                                </div>

                                <h3 className="text-white font-bold mb-1 flex items-center gap-2">
                                    <Car className="w-4 h-4 text-emerald-500" />
                                    {occ.vehicle?.model?.brand?.name || (occ.vehicle as any)?.brand} {occ.vehicle?.model?.name || (occ.vehicle as any)?.model}
                                </h3>
                                <p className="text-slate-400 text-sm mb-4">{occ.vehicle?.license_plate}</p>

                                <div className="space-y-2 text-sm text-slate-300">
                                    <p className="line-clamp-2">{occ.description}</p>
                                    {occ.driver && (
                                        <div className="flex items-center gap-2 text-slate-400 pt-2 border-t border-slate-700/50">
                                            <User className="w-3 h-3" />
                                            {occ.driver.name}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
