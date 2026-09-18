import Link from "next/link";
import { Plus, AlertTriangle, Calendar, Car, User } from "lucide-react";
import { getOccurrences } from "@/lib/services/occurrences";
import OccurrenceActions from "@/components/dashboard/occurrence-actions";
import { createClient } from '@/lib/supabase/server';

export default async function OccurrencesPage() {
    const occurrences = await getOccurrences();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('first_name, last_name').eq('user_id', user?.id).maybeSingle();
    const managerName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Lançamentos e Ocorrência</h1>
                    <p className="text-slate-400 mt-1">Gestão de multas, sinistros e eventos da frota</p>
                </div>

                <Link
                    href="/dashboard/occurrences/new"
                    className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-950 text-white rounded-lg font-medium transition-colors shadow-lg shadow-brand/20"
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
                            <div key={occ.id} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800 transition-colors relative group">
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <OccurrenceActions id={occ.id} plate={occ.vehicle?.license_plate || ''} description={occ.description} level={occ.alert_level || 'MEDIUM'} status={occ.status} managerName={managerName} />
                                </div>
                                <div className="flex justify-between items-start mb-4 pr-8">
                                    <div className="bg-amber-500/10 text-amber-500 px-2 py-1 rounded text-xs font-bold border border-amber-500/20">
                                        {occ.type?.name}
                                    </div>
                                    {occ.status !== 'RESOLVED' && <span className="rounded border border-amber-500/30 px-2 py-1 text-xs text-amber-300">{occ.alert_level || 'MEDIUM'}</span>}
                                    <span className="text-slate-500 text-xs flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(occ.date).toLocaleDateString()}
                                    </span>
                                </div>

                                <h3 className="text-white font-bold mb-1 flex items-center gap-2">
                                    <Car className="w-4 h-4 text-brand" />
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
