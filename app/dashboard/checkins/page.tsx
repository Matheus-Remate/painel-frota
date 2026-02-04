import Link from "next/link";
import { Search, Filter, AlertTriangle, CheckCircle, XCircle, Calendar, MapPin, Gauge, ArrowLeft, History } from "lucide-react";
import { getCheckins } from "@/lib/services/dashboard";
import CheckinActions from "@/components/dashboard/checkin-actions";

export default async function CheckinsPage() {
    const allCheckins = await getCheckins();

    // Filter Alert items (Issues and Not Resolved)
    const alerts = allCheckins.filter((c: any) => c.has_issues && !c.resolved);
    const history = allCheckins.filter((c: any) => !c.has_issues || c.resolved);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Revisão e Alertas</h1>
                        <p className="text-slate-400 mt-1">Gerencie alertas de veículos e histórico de check-ins</p>
                    </div>
                </div>

                <Link
                    href="/dashboard/checkins/new"
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors shadow-lg shadow-emerald-500/20"
                >
                    <CheckCircle className="w-5 h-5" />
                    Novo Check-in
                </Link>
            </div>

            {/* ACTIONABLE ALERTS SECTION */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-500 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    <h2 className="text-lg font-bold">Alertas Pendentes ({alerts.length})</h2>
                </div>

                {alerts.length === 0 ? (
                    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-8 text-center text-slate-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500/50" />
                        <p>Nenhum alerta pendente. Frota operando normalmente.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {alerts.map((checkin: any) => (
                            <CheckinCard key={checkin.id} checkin={checkin} isAlert={true} />
                        ))}
                    </div>
                )}
            </div>

            {/* HISTORY SECTION */}
            <div className="space-y-4 pt-8 border-t border-slate-700/50">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <History className="w-5 h-5" />
                    <h2 className="text-lg font-bold">Histórico Recente</h2>
                </div>

                {history.length === 0 ? (
                    <p className="text-slate-500">Nenhum histórico disponível.</p>
                ) : (
                    <div className="space-y-4">
                        {history.map((checkin: any) => (
                            <CheckinCard key={checkin.id} checkin={checkin} isAlert={false} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function CheckinCard({ checkin, isAlert }: { checkin: any, isAlert: boolean }) {
    return (
        <div className={`bg-slate-800/50 backdrop-blur-sm border rounded-xl p-6 transition-all hover:bg-slate-800/80 group ${isAlert ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-700/50'
            }`}>
            <div className="flex flex-col lg:flex-row gap-6">
                <div className={`w-2 h-full rounded-full hidden lg:block ${checkin.has_issues ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>

                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-xl font-bold text-white">
                                    {checkin.vehicle?.model ? `${checkin.vehicle.model.brand.name} ${checkin.vehicle.model.name}` : 'Veículo Removido'}
                                </span>
                                <span className="text-sm font-mono bg-slate-900 px-2 py-1 rounded text-slate-400 border border-slate-700">
                                    {checkin.vehicle?.license_plate || '---'}
                                </span>
                            </div>
                            <div className="text-slate-400 flex items-center gap-2 text-sm">
                                <User className="w-4 h-4" />
                                {checkin.driver?.name || 'Motorista Desconhecido'}
                            </div>
                        </div>
                        <div className="text-right">
                            {/* Actions for Alert */}
                            {isAlert && (
                                <div className="mb-2">
                                    <CheckinActions checkinId={checkin.id} />
                                </div>
                            )}

                            {!isAlert && checkin.resolved && (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-2">
                                    <CheckCircle className="w-3 h-3" />
                                    RESOLVIDO
                                </div>
                            )}

                            <div className="text-slate-500 text-sm flex items-center justify-end gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(checkin.checked_in_at).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <StatusItem label="Limpeza" status={checkin.cleanliness_status} />
                        <StatusItem label="Luzes Painel" status={checkin.dash_lights_status} />
                        <StatusItem label="Pneus/Lataria" status={checkin.tires_exterior_status} />
                        <div className="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/50">
                            <span className="text-slate-300 font-medium text-sm">Combustível</span>
                            <span className="text-xs font-bold text-emerald-400">{checkin.fuel_level || 'N/A'}</span>
                        </div>
                    </div>

                    {checkin.photos && checkin.photos.length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">Fotos Anexadas</h4>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {checkin.photos.map((photo: string, index: number) => (
                                    <a href={photo} target="_blank" rel="noopener noreferrer" key={index} className="block w-20 h-20 rounded-lg overflow-hidden border border-slate-700 hover:border-emerald-500 transition-colors shrink-0">
                                        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${photo})` }} />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {checkin.has_issues && (
                        <div className="mt-6 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                            <h4 className="text-amber-400 text-sm font-bold mb-1 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Relato de Problema
                            </h4>
                            <p className="text-slate-300 text-sm">{checkin.repair_notes}</p>

                            {checkin.resolved && (
                                <div className="mt-3 pt-3 border-t border-amber-500/20">
                                    <p className="text-xs text-emerald-400 font-bold mb-1">RESOLUÇÃO:</p>
                                    <p className="text-slate-400 text-sm">{checkin.resolution_notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatusItem({ label, status }: { label: string, status: 'OK' | 'ALERT' | 'DAMAGE' }) {
    const colors = {
        'OK': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        'ALERT': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        'DAMAGE': 'text-red-400 bg-red-500/10 border-red-500/20',
    };

    return (
        <div className={`flex items-center justify-between p-3 rounded-lg border ${colors[status]} bg-opacity-50`}>
            <span className="text-slate-300 font-medium text-sm">{label}</span>
            <span className="text-xs font-bold">{status}</span>
        </div>
    )
}

function User({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
    )
}
