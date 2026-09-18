'use client';

import { createCheckin } from "@/lib/services/checkins";
import { useState } from "react";
import { Camera, Check, AlertCircle, Gauge, Fuel, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { compressPhoto } from '@/lib/utils/compress-photo';

const CHECKLIST_ITEMS = [
    { id: 'limpeza', label: 'Limpeza Interna' },
    { id: 'motor', label: 'Estado do Motor' },
    { id: 'pneus', label: 'Pneus e Lataria' },
    { id: 'freios', label: 'Freios' },
    { id: 'outros', label: 'Outros Itens' }
];

interface ChecklistState {
    [key: string]: {
        status: 'OK' | 'REVIEW';
        severity?: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
        notes?: string;
        photo?: File | null;
    }
}

export default function ReturnForm({ vehicleId, token, lastOdometer, driverName }: { vehicleId: string; token: string; lastOdometer: number; driverName: string }) {
    const [submitting, setSubmitting] = useState(false);
    const [checklist, setChecklist] = useState<ChecklistState>(
        CHECKLIST_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: { status: 'OK' } }), {})
    );
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [photoStatus, setPhotoStatus] = useState<Record<string, 'processing' | 'error' | 'ready'>>({});
    const photoReady = Object.values(photoStatus).every(status => status === 'ready');

    const handleStatusChange = (id: string, status: 'OK' | 'REVIEW') => {
        setChecklist(prev => ({
            ...prev,
            [id]: { ...prev[id], status }
        }));
    };

    const handleNoteChange = (id: string, note: string) => {
        setChecklist(prev => ({
            ...prev,
            [id]: { ...prev[id], notes: note }
        }));
    };

    const handleSeverityChange = (id: string, severity: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW') => {
        setChecklist(prev => ({ ...prev, [id]: { ...prev[id], severity } }));
    };

    const handlePhotoChange = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoStatus(prev => ({ ...prev, [id]: 'processing' }));
        try {
            const processed = await compressPhoto(file);
            setChecklist(prev => ({ ...prev, [id]: { ...prev[id], photo: processed } }));
            setError(null);
            setPhotoStatus(prev => ({ ...prev, [id]: 'ready' }));
        } catch (cause) {
            setPhotoStatus(prev => ({ ...prev, [id]: 'error' }));
            setError(cause instanceof Error ? cause.message : 'Não foi possível reduzir a foto.');
        }
    };

    const [isSuccess, setIsSuccess] = useState(false);

    async function handleSubmit(formData: FormData) {
        if (!photoReady) {
            setError('Aguarde o processamento da foto ou escolha outra imagem antes de enviar.');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            // Prepare dynamic checklist data
            const checklistData: Record<string, { status: 'OK' | 'REVIEW'; notes: string; severity?: string }> = {};

            // Append files and build JSON
            Object.entries(checklist).forEach(([key, value]) => {
                checklistData[key] = {
                    status: value.status,
                    notes: value.notes || '',
                    ...(value.status === 'REVIEW' ? { severity: value.severity || 'MEDIUM' } : {}),
                };

                // Add specific photos to formData with unique names
                if (value.photo) {
                    formData.append(`photo_${key}`, value.photo);
                }
            });

            // Add the JSON blob
            formData.append('checklist', JSON.stringify(checklistData));

            // Legacy mapping
            formData.append('status_0', checklist['limpeza']?.status === 'OK' ? 'OK' : 'ISSUE');
            formData.append('status_1', checklist['pneus']?.status === 'OK' ? 'OK' : 'ISSUE');
            formData.append('status_2', 'OK');

            const result = await createCheckin(formData);

            if (result.success) {
                setIsSuccess(true);
                // Redirect after a short delay
                setTimeout(() => {
                    router.push(`/mobile/vehicle/${vehicleId}?token=${encodeURIComponent(token)}&success=true`);
                }, 2000);
            } else {
                setError(result.error || 'Erro ao enviar. Tente novamente.');
                setSubmitting(false);
            }
        } catch {
            setError('Falha na comunicação com o servidor.');
            setSubmitting(false);
        }
    }

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Check className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Check-in Realizado!</h2>
                <p className="text-slate-400">Os dados foram salvos e o gestor foi notificado.</p>
                <p className="text-xs text-slate-500 pt-10">Redirecionando...</p>
            </div>
        );
    }

    return (
        <form action={handleSubmit} className="space-y-8 pb-10">
            <input type="hidden" name="vehicleId" value={vehicleId} />
            <input type="hidden" name="token" value={token} />

            {/* 0. Identificação */}
            <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-white">
                    <User className="w-5 h-5 text-indigo-500" />
                    Nome do Condutor
                </label>
                <input
                    type="text"
                    name="driverName"
                    defaultValue={driverName}
                    placeholder="Seu nome completo"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-lg text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
            </div>

            {/* 1. Odômetro e Combustível (Critical Data) */}
            <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 space-y-6">
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Dados do Veículo</h3>

                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-white">
                        <Gauge className="w-5 h-5 text-emerald-500" />
                        Odômetro Final (km)
                    </label>
                    <input
                        type="number"
                        name="odometer"
                        placeholder={`Mínimo: ${lastOdometer || 0}`}
                        required
                        min={lastOdometer}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-lg text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                </div>

                <div className="space-y-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-white">
                        <Fuel className="w-5 h-5 text-amber-500" />
                        Nível de Combustível
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                        {[
                            { val: 'EMPTY', label: 'E' },
                            { val: '1/4', label: '1/4' },
                            { val: '1/2', label: '1/2' },
                            { val: '3/4', label: '3/4' },
                            { val: 'FULL', label: 'F' }
                        ].map((level) => (
                            <label key={level.val} className="cursor-pointer">
                                <input
                                    type="radio"
                                    name="fuelLevel"
                                    value={level.val}
                                    className="peer hidden"
                                    required
                                />
                                <div className="text-center py-4 rounded-xl bg-slate-950 border-2 border-slate-800 peer-checked:border-emerald-500 peer-checked:bg-emerald-500/10 peer-checked:text-emerald-400 text-sm font-bold text-slate-500 transition-all active:scale-95">
                                    {level.label}
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 space-y-2">
                <label htmlFor="return-notes" className="text-sm font-medium text-white">Observações gerais da devolução</label>
                <textarea id="return-notes" name="notes" rows={3} placeholder="Ex.: local da chave, abastecimento ou informação para o próximo condutor" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none focus:border-emerald-500" />
            </div>

            {error && <div role="alert" className="flex gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}

            {/* 2. Checklist Dinâmico */}
            <div className="space-y-4">
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider px-2">Checklist de Entrega</h3>

                {CHECKLIST_ITEMS.map((item) => (
                    <div key={item.id} className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                        <div className="p-4 flex items-center justify-between">
                            <span className="font-medium text-slate-200">{item.label}</span>

                            <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => handleStatusChange(item.id, 'OK')}
                                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${checklist[item.id].status === 'OK'
                                        ? 'bg-emerald-600 text-white shadow-lg'
                                        : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    OK
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleStatusChange(item.id, 'REVIEW')}
                                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${checklist[item.id].status === 'REVIEW'
                                        ? 'bg-amber-600 text-white shadow-lg'
                                        : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    Revisar
                                </button>
                            </div>
                        </div>

                        {/* Expandable Area for Issues */}
                        {checklist[item.id].status === 'REVIEW' && (
                            <div className="p-4 pt-0 animate-in slide-in-from-top-2 duration-200 space-y-3">
                                <textarea
                                    placeholder={`Descreva o problema com ${item.label}...`}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                    rows={2}
                                    onChange={(e) => handleNoteChange(item.id, e.target.value)}
                                    required
                                />

                                <label className="block text-sm text-slate-300">Gravidade observada
                                    <select value={checklist[item.id].severity || 'MEDIUM'} onChange={(event) => handleSeverityChange(item.id, event.target.value as 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW')} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white">
                                        <option value="LOW">Baixo — atenção futura</option>
                                        <option value="MEDIUM">Médio — pode viajar com atenção</option>
                                        <option value="HIGH">Alto — não pode viajar</option>
                                        <option value="URGENT">Urgente — não pode rodar</option>
                                    </select>
                                </label>

                                <div className="relative">
                                    <input
                                        type="file"
                                        id={`camera-${item.id}`}
                                        accept="image/*"
                                        capture="environment"
                                        className="hidden"
                                        onChange={(e) => handlePhotoChange(item.id, e)}
                                    />
                                    <label
                                        htmlFor={`camera-${item.id}`}
                                        className={`flex items-center justify-center gap-2 w-full p-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${checklist[item.id].photo
                                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                                            : 'border-slate-700 hover:bg-slate-800 text-slate-400'
                                            }`}
                                    >
                                        <Camera className="w-5 h-5" />
                                        <span className="text-sm font-medium">
                                            {checklist[item.id].photo
                                                ? 'Foto anexada (Toque para trocar)'
                                                : 'Tirar Foto do Problema'}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* 3. Submit Button */}
            <div className="pt-10 pb-10">
                <button
                    type="submit"
                    disabled={submitting || !photoReady}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-bold py-4 rounded-xl shadow-xl shadow-emerald-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    {submitting ? (
                        'Enviando...'
                    ) : (
                        <>
                            <Check className="w-6 h-6" />
                            Confirmar Devolução
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
