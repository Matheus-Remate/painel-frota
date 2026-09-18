'use client';

import { useState, useEffect } from "react";
import { Search, Filter, AlertTriangle, CheckCircle, Calendar, User, History, X, Camera, ChevronDown, XCircle, Check, Loader2 } from "lucide-react";
import { correctCheckinData, resolveCheckin, setCheckinAlertLevel } from "@/lib/services/dashboard";
import { useRouter } from "next/navigation";
import { requiresReleaseDeclaration } from '@/lib/domain/alert-level';

type Checkin = any; // Ideally import type

export default function CheckinsList({ initialCheckins, userRole, managerName }: { initialCheckins: Checkin[], userRole: string, managerName: string }) {
    const [checkins, setCheckins] = useState<Checkin[]>(initialCheckins);
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'SOLVED'>('PENDING');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // RESOLVE MODAL STATE
    const [checkinToResolve, setCheckinToResolve] = useState<string | null>(null);
    const [resolveNotes, setResolveNotes] = useState('');
    const [isResolving, setIsResolving] = useState(false);
    const [levelTarget, setLevelTarget] = useState<Checkin | null>(null);
    const [newLevel, setNewLevel] = useState('MEDIUM');
    const [levelReason, setLevelReason] = useState('');
    const [confirmedDeclaration, setConfirmedDeclaration] = useState(false);
    const [savingLevel, setSavingLevel] = useState(false);
    const [correctionTarget, setCorrectionTarget] = useState<Checkin | null>(null);
    const [correctedOdometer, setCorrectedOdometer] = useState(0);
    const [correctedFuel, setCorrectedFuel] = useState('');
    const [correctedNotes, setCorrectedNotes] = useState('');
    const [correctionReason, setCorrectionReason] = useState('');
    const [savingCorrection, setSavingCorrection] = useState(false);
    const router = useRouter();

    // Sync state when props change (after router.refresh finishes)
    useEffect(() => {
        setCheckins(prev => {
            return initialCheckins.map(newItem => {
                // If the server now says it's resolved, great!
                if (newItem.resolved) return newItem;

                // If server still says pending, check if we resolved it locally
                const localItem = prev.find(p => p.id === newItem.id);
                if (localItem?.resolved) {
                    return { ...newItem, resolved: true, resolution_notes: localItem.resolution_notes };
                }
                return newItem;
            });
        });
    }, [initialCheckins]);

    async function handleResolveConfirm() {
        if (!checkinToResolve) return;
        setIsResolving(true);
        const result = await resolveCheckin(checkinToResolve, resolveNotes);
        if (result.success) {
            // Update local state immediately for instant feedback
            setCheckins(prev => prev.map(c =>
                c.id === checkinToResolve
                    ? { ...c, resolved: true, resolution_notes: resolveNotes }
                    : c
            ));
            setCheckinToResolve(null);
            setResolveNotes('');
            router.refresh();
        } else {
            alert('Erro ao resolver: ' + result.error);
        }
        setIsResolving(false);
    }

    async function handleLevelChange() {
        if (!levelTarget) return;
        setSavingLevel(true);
        const result = await setCheckinAlertLevel(levelTarget.id, newLevel, levelReason, confirmedDeclaration);
        setSavingLevel(false);
        if (!result.success) { alert(result.error || 'Não foi possível alterar o nível.'); return; }
        setCheckins(prev => prev.map(item => item.id === levelTarget.id ? { ...item, alert_level: newLevel } : item));
        setLevelTarget(null);
        setLevelReason('');
        setConfirmedDeclaration(false);
        router.refresh();
    }

    async function handleCorrection() {
        if (!correctionTarget) return;
        setSavingCorrection(true);
        const result = await correctCheckinData(correctionTarget.id, correctedOdometer, correctedFuel, correctedNotes, correctionReason);
        setSavingCorrection(false);
        if (!result.success) { alert(result.error || 'Não foi possível corrigir os dados.'); return; }
        setCorrectionTarget(null);
        setCorrectionReason('');
        router.refresh();
    }

    function openCorrection(item: Checkin) {
        setCorrectionTarget(item);
        setCorrectedOdometer(Number(item.odometer || 0));
        setCorrectedFuel(item.fuel_level || '');
        setCorrectedNotes(item.return_notes || '');
        setCorrectionReason('');
    }

    // FILTER LOGIC
    const filteredCheckins = checkins.filter(c => {
        // Status Filter
        if (filterStatus === 'PENDING') {
            if (!c.has_issues || c.resolved) return false;
        }
        if (filterStatus === 'SOLVED') {
            if (!c.resolved) return false;
        }

        // Search Filter (Vehicle or Plate)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const brand = c.vehicle?.model?.brand?.name?.toLowerCase() || '';
            const model = c.vehicle?.model?.name?.toLowerCase() || '';
            const plate = c.vehicle?.license_plate?.toLowerCase() || '';
            const vehicleString = `${brand} ${model} ${plate}`;
            if (!vehicleString.includes(term)) return false;
        }

        return true;
    });

    return (
        <div className="space-y-6">
            {/* CONTROLS */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
                    <FilterButton
                        active={filterStatus === 'PENDING'}
                        onClick={() => setFilterStatus('PENDING')}
                        icon={<AlertTriangle className="w-4 h-4" />}
                        label="Pendentes"
                        count={checkins.filter(c => c.has_issues && !c.resolved).length}
                        color="amber"
                    />
                    <FilterButton
                        active={filterStatus === 'SOLVED'}
                        onClick={() => setFilterStatus('SOLVED')}
                        icon={<CheckCircle className="w-4 h-4" />}
                        label="Resolvidos"
                        count={checkins.filter(c => c.resolved).length}
                        color="emerald"
                    />
                    <FilterButton
                        active={filterStatus === 'ALL'}
                        onClick={() => setFilterStatus('ALL')}
                        icon={<History className="w-4 h-4" />}
                        label="Todos"
                        count={checkins.length}
                        color="slate"
                    />
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar veículo ou placa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-brand outline-none"
                    />
                </div>
            </div>

            {/* LIST */}
            <div className="space-y-4">
                {filteredCheckins.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800/50">
                        <Filter className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Nenhum check-in encontrado com os filtros atuais.</p>
                    </div>
                ) : (
                    filteredCheckins.map(checkin => (
                        <CheckinCard
                            key={checkin.id}
                            checkin={checkin}
                            userRole={userRole}
                            onImageClick={setSelectedImage}
                            onResolveClick={(id) => setCheckinToResolve(id)}
                            onLevelClick={(item) => { setLevelTarget(item); setNewLevel(item.alert_level || 'HIGH'); }}
                            onCorrectionClick={openCorrection}
                            isLatest={checkins.find(item => item.vehicle_id === checkin.vehicle_id)?.id === checkin.id}
                        />
                    ))
                )}
            </div>

            {/* LIGHTBOX */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedImage(null)}
                >
                    <button className="absolute top-4 right-4 text-white hover:text-gray-300 p-2">
                        <X className="w-8 h-8" />
                    </button>
                    <img
                        src={selectedImage}
                        alt="Full screen"
                        className="max-w-full max-h-screen object-contain rounded-lg shadow-2xl"
                    />
                </div>
            )}

            {/* RESOLVE MODAL */}
            {correctionTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"><div className="w-full max-w-xl space-y-4 rounded-xl border border-slate-700 bg-slate-900 p-6 text-white">
                <h3 className="text-xl font-bold">Corrigir dados da última devolução</h3>
                <p className="text-sm text-slate-300">{correctionTarget.vehicle?.license_plate}. O valor anterior e a justificativa ficam no histórico de auditoria.</p>
                <label className="block text-sm">Odômetro (km)<input type="number" min="0" value={correctedOdometer} onChange={event => setCorrectedOdometer(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-3" /></label>
                <label className="block text-sm">Combustível<select value={correctedFuel} onChange={event => setCorrectedFuel(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-3"><option value="">Selecione</option><option value="EMPTY">Vazio</option><option value="1/4">1/4</option><option value="1/2">1/2</option><option value="3/4">3/4</option><option value="FULL">Cheio</option></select></label>
                <label className="block text-sm">Observações<textarea value={correctedNotes} onChange={event => setCorrectedNotes(event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-3" /></label>
                <label className="block text-sm">Motivo da correção<textarea value={correctionReason} onChange={event => setCorrectionReason(event.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-3" /></label>
                <div className="flex justify-end gap-3"><button type="button" onClick={() => setCorrectionTarget(null)} className="rounded-lg border border-slate-600 px-4 py-2">Cancelar</button><button type="button" onClick={handleCorrection} disabled={savingCorrection || !correctedFuel || correctionReason.trim().length < 10} className="rounded-lg bg-emerald-600 px-4 py-2 disabled:opacity-50">{savingCorrection ? 'Salvando...' : 'Salvar correção'}</button></div>
            </div></div>}
            {levelTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"><div className="w-full max-w-xl space-y-4 rounded-xl border border-slate-700 bg-slate-900 p-6 text-white">
                <h3 className="text-xl font-bold">Classificar pendência</h3>
                <p className="text-sm text-slate-300">{levelTarget.vehicle?.license_plate} · {levelTarget.return_notes || 'Pendência registrada na devolução'}</p>
                <select value={newLevel} onChange={(event) => { setNewLevel(event.target.value); setConfirmedDeclaration(false); }} className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3">
                    <option value="URGENT">Urgente — não pode rodar</option><option value="HIGH">Alto — não pode viajar</option>
                    <option value="MEDIUM">Médio — pode viajar com atenção</option><option value="LOW">Baixo — pode viajar, com pendência registrada</option>
                </select>
                <textarea value={levelReason} onChange={(event) => setLevelReason(event.target.value)} placeholder="Justificativa da classificação (mínimo 10 caracteres)" className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3" rows={3} />
                {requiresReleaseDeclaration(levelTarget.alert_level || 'HIGH', newLevel) && <label className="block rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100"><input type="checkbox" checked={confirmedDeclaration} onChange={(event) => setConfirmedDeclaration(event.target.checked)} className="mr-2" />{managerName} declara que o veículo de placa {levelTarget.vehicle?.license_plate}, mesmo com a pendência {levelTarget.return_notes || 'registrada'}, está apto a rodar. Está ciente de que o veículo poderá sair para viagem e de que esta declaração será considerada na análise de qualquer dano.</label>}
                <div className="flex justify-end gap-3"><button type="button" onClick={() => setLevelTarget(null)} className="rounded-lg border border-slate-600 px-4 py-2">Cancelar</button><button type="button" onClick={handleLevelChange} disabled={savingLevel || levelReason.trim().length < 10 || (requiresReleaseDeclaration(levelTarget.alert_level || 'HIGH', newLevel) && !confirmedDeclaration)} className="rounded-lg bg-amber-600 px-4 py-2 disabled:opacity-50">{savingLevel ? 'Salvando...' : 'Registrar decisão'}</button></div>
            </div></div>}
            {checkinToResolve && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-8 w-full max-w-4xl space-y-6 relative animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Resolver Alerta</h3>
                            <button onClick={() => setCheckinToResolve(null)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Notas de Resolução</label>
                            <textarea
                                value={resolveNotes}
                                onChange={(e) => setResolveNotes(e.target.value)}
                                placeholder="O que foi feito para resolver o problema?"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-brand focus:border-transparent min-h-[200px] text-lg resize-y"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setCheckinToResolve(null)}
                                className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleResolveConfirm}
                                disabled={isResolving || !resolveNotes.trim()}
                                className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-950 text-white rounded-lg disabled:opacity-50"
                            >
                                {isResolving && <Loader2 className="w-4 h-4 animate-spin" />}
                                Confirmar Resolução
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function FilterButton({ active, onClick, icon, label, count, color }: any) {
    const activeClasses = {
        amber: 'bg-amber-500/10 text-amber-500 border-amber-500/50',
        emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50',
        slate: 'bg-slate-700 text-white border-slate-600'
    };

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all whitespace-nowrap ${active
                ? activeClasses[color as keyof typeof activeClasses]
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
        >
            {icon}
            {label}
            <span className="ml-1 text-xs opacity-60 bg-black/20 px-1.5 py-0.5 rounded-full">{count}</span>
        </button>
    )
}

function CheckinCard({
    checkin,
    userRole,
    onImageClick,
    onResolveClick,
    onLevelClick,
    onCorrectionClick,
    isLatest
}: {
    checkin: any,
    userRole: string,
    onImageClick: (url: string) => void,
    onResolveClick: (id: string) => void
    onLevelClick: (checkin: any) => void
    onCorrectionClick: (checkin: any) => void
    isLatest: boolean
}) {
    const isAlert = checkin.has_issues && !checkin.resolved;
    const isResolved = checkin.resolved;
    const canResolve = (userRole === 'admin' || userRole === 'gestor') && isAlert;

    // Helper to get nested safe values
    const getVehicleName = () => {
        try {
            const m = Array.isArray(checkin.vehicle?.model) ? checkin.vehicle.model[0] : checkin.vehicle?.model;
            const b = Array.isArray(m?.brand) ? m.brand[0] : m?.brand;
            return `${b?.name || ''} ${m?.name || ''}`.trim() || 'Veículo Desconhecido';
        } catch (e) { return 'Erro Modelo'; }
    };

    return (
        <div className={`bg-slate-800/40 backdrop-blur-sm border rounded-xl p-5 transition-all hover:bg-slate-800/60 group ${isAlert ? 'border-amber-500/30 shadow-[0_0_15px_-3px_rgba(245,158,11,0.1)]' : 'border-slate-700/50'
            }`}>
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <span className="text-lg font-bold text-white tracking-tight">
                            {getVehicleName()}
                        </span>
                        <span className="text-xs font-mono bg-slate-950 px-2 py-1 rounded text-slate-400 border border-slate-800">
                            {checkin.vehicle?.license_plate || '---'}
                        </span>
                        {isAlert && <span className="text-[10px] font-bold bg-amber-500 text-amber-950 px-2 py-0.5 rounded uppercase">Alerta</span>}
                        {isAlert && <span className="text-[10px] font-bold rounded border border-amber-500/40 px-2 py-0.5 text-amber-300">{checkin.alert_level || 'HIGH'}</span>}
                        {isResolved && <span className="text-[10px] font-bold bg-emerald-500 text-emerald-950 px-2 py-0.5 rounded uppercase">Resolvido</span>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {checkin.driver?.name || checkin.checklist?.driver_name || 'Motorista não id.'}
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(checkin.checked_in_at).toLocaleString()}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-start">
                    {/* RESOLVE BUTTON (GREEN) */}
                    {isLatest && (userRole === 'admin' || userRole === 'gestor') && <button onClick={() => onCorrectionClick(checkin)} className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300">Corrigir dados QR</button>}
                    {canResolve && (
                        <div className="scale-90 origin-right">
                            <button onClick={() => onLevelClick(checkin)} className="mr-2 rounded-lg border border-amber-500/30 px-3 py-1.5 text-sm text-amber-300">Classificar</button>
                            <button
                                onClick={() => onResolveClick(checkin.id)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-colors text-sm font-medium"
                            >
                                <Check className="w-4 h-4" />
                                Resolver
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* CHECKLIST GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
                {checkin.checklist && Object.keys(checkin.checklist).length > 0 ? (
                    // Dynamic render
                    Object.entries(checkin.checklist).map(([key, value]: [string, any]) => {
                        if (key === 'driver_name') return null;
                        const labelMap: any = { 'limpeza': 'Limpeza', 'motor': 'Motor', 'pneus': 'Pneus', 'freios': 'Freios', 'outros': 'Outros' };
                        return (
                            <StatusItem
                                key={key}
                                label={labelMap[key] || key}
                                status={value.status}
                                note={value.notes}
                                photoUrl={value.photoUrl}
                                onImageClick={onImageClick}
                            />
                        );
                    })
                ) : (
                    // Legacy render
                    <>
                        <StatusItem label="Limpeza" status={checkin.cleanliness_status} />
                        <StatusItem label="Luzes Painel" status={checkin.dash_lights_status} />
                        <StatusItem label="Lataria/Pneus" status={checkin.tires_exterior_status} />
                    </>
                )}

                {/* Fuel (Always last) */}
                <div className="flex flex-col justify-center p-3 rounded-lg border border-slate-700/50 bg-slate-800/30">
                    <span className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Combustível</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-white">{checkin.fuel_level || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* RESOLUTION NOTES (If resolved) */}
            {checkin.resolved && checkin.resolution_notes && (
                <div className="mt-4 bg-emerald-900/10 border border-emerald-500/20 rounded-lg p-3">
                    <p className="text-xs text-emerald-400 font-bold mb-1 uppercase">Resolução:</p>
                    <p className="text-sm text-slate-300">{checkin.resolution_notes}</p>
                </div>
            )}

            {checkin.corrections?.length > 0 && (
                <details className="mt-4 rounded-lg border border-sky-500/20 bg-sky-950/10 p-3 text-sm text-slate-200">
                    <summary className="cursor-pointer font-medium text-sky-200">Histórico de correções auditáveis ({checkin.corrections.length})</summary>
                    <div className="mt-3 space-y-3 border-t border-sky-500/15 pt-3">
                        {checkin.corrections.map((correction: any) => (
                            <div key={correction.id} className="space-y-1 rounded-md bg-slate-950/40 p-3 text-xs">
                                <p><span className="text-slate-400">Registrada por:</span> {correction.manager_name} em {new Date(correction.created_at).toLocaleString('pt-BR')}</p>
                                <p><span className="text-slate-400">Odômetro:</span> {correction.previous_odometer} km → {correction.corrected_odometer} km · <span className="text-slate-400">Combustível:</span> {correction.previous_fuel || 'não informado'} → {correction.corrected_fuel || 'não informado'}</p>
                                {correction.previous_notes !== correction.corrected_notes && <p><span className="text-slate-400">Observações:</span> {correction.previous_notes || 'sem observações'} → {correction.corrected_notes || 'sem observações'}</p>}
                                <p><span className="text-slate-400">Justificativa:</span> {correction.reason}</p>
                            </div>
                        ))}
                    </div>
                </details>
            )}
        </div>
    );
}

function StatusItem({ label, status, note, photoUrl, onImageClick }: { label: string, status: string, note?: string, photoUrl?: string, onImageClick?: (url: string) => void }) {
    const isIssue = status !== 'OK';

    // Status badges
    const statusConfig = {
        'OK': { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: null },
        'ALERT': { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle },
        'DAMAGE': { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle },
        'REVIEW': { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle }, // Map Review to Alert
        'ISSUE': { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['ALERT'];

    return (
        <div className={`relative p-3 rounded-lg border ${config.border} ${config.bg} flex flex-col gap-2 transition-all hover:brightness-110`}>
            <div className="flex justify-between items-start">
                <span className="text-slate-300 text-sm font-medium">{label}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${config.color} bg-black/20`}>
                    {status === 'REVIEW' ? 'ATENÇÃO' : status}
                </span>
            </div>

            {/* Note Display (Inside Card) */}
            {note && (
                <div className="text-xs text-white/70 bg-black/20 p-2 rounded border border-white/5 mt-1 italic">
                    "{note}"
                </div>
            )}

            {/* Photo Action */}
            {photoUrl && (
                <button
                    onClick={() => onImageClick && onImageClick(photoUrl)}
                    className="mt-auto flex items-center justify-center gap-2 w-full py-1.5 bg-black/30 hover:bg-black/50 text-white rounded text-xs font-medium transition-colors group/btn border border-white/10"
                >
                    <Camera className="w-3 h-3" />
                    Ver Foto
                </button>
            )}
        </div>
    );
}
