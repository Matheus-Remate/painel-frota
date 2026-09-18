'use client';

import { useState } from "react";
import { Calendar, Car, MoreVertical, Pencil, Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { deleteOccurrence, setOccurrenceAlertLevel } from "@/lib/services/occurrences";
import { useRouter } from "next/navigation";
import { requiresReleaseDeclaration } from '@/lib/domain/alert-level';

interface OccurrenceActionsProps {
    id: string;
    plate: string;
    description: string;
    level: string;
    status: string;
    managerName: string;
}

export default function OccurrenceActions({ id, plate, description, level, status, managerName }: OccurrenceActionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showLevel, setShowLevel] = useState(false);
    const [newLevel, setNewLevel] = useState(level);
    const [reason, setReason] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    async function handleDelete() {
        if (!confirm("Tem certeza que deseja excluir esta ocorrência?")) return;

        setIsDeleting(true);
        const result = await deleteOccurrence(id);

        if (!result.success) {
            alert(result.error);
        } else {
            router.refresh();
        }
        setIsDeleting(false);
        setIsOpen(false);
    }

    async function handleLevelChange() {
        setSaving(true);
        const result = await setOccurrenceAlertLevel(id, newLevel, reason, confirmed);
        setSaving(false);
        if (!result.success) { alert(result.error || 'Não foi possível classificar.'); return; }
        setShowLevel(false);
        setIsOpen(false);
        router.refresh();
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
                <MoreVertical className="w-5 h-5" />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    ></div>
                    <div className="absolute right-0 top-full mt-1 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20 py-1 overflow-hidden">
                        <Link
                            href={`/dashboard/occurrences/${id}/edit`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors w-full"
                        >
                            <Pencil className="w-4 h-4" />
                            Editar
                        </Link>
                        {status !== 'RESOLVED' && <button onClick={() => setShowLevel(true)} className="w-full px-4 py-2 text-left text-sm text-amber-300 hover:bg-slate-800">Classificar alerta</button>}
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors w-full text-left"
                        >
                            <Trash2 className="w-4 h-4" />
                            {isDeleting ? "Excluindo..." : "Excluir"}
                        </button>
                    </div>
                </>
            )}
            {showLevel && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"><div className="w-full max-w-xl space-y-4 rounded-xl border border-slate-700 bg-slate-900 p-6 text-white">
                <h3 className="text-xl font-bold">Classificar ocorrência</h3>
                <p className="text-sm text-slate-300">{plate} · {description}</p>
                <select value={newLevel} onChange={(event) => { setNewLevel(event.target.value); setConfirmed(false); }} className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3"><option value="URGENT">Urgente — não pode rodar</option><option value="HIGH">Alto — não pode viajar</option><option value="MEDIUM">Médio — pode viajar com atenção</option><option value="LOW">Baixo — pode viajar ciente da pendência</option></select>
                <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="Justificativa (mínimo 10 caracteres)" className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3" />
                {requiresReleaseDeclaration(level, newLevel) && <label className="block rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mr-2" />{managerName} declara que o veículo {plate}, mesmo com a pendência {description}, está apto a rodar. Está ciente de que poderá sair para viagem e que esta declaração será considerada na análise de qualquer dano.</label>}
                <div className="flex justify-end gap-3"><button onClick={() => setShowLevel(false)} className="rounded-lg border border-slate-600 px-4 py-2">Cancelar</button><button onClick={handleLevelChange} disabled={saving || reason.trim().length < 10 || (requiresReleaseDeclaration(level, newLevel) && !confirmed)} className="rounded-lg bg-amber-600 px-4 py-2 disabled:opacity-50">Registrar decisão</button></div>
            </div></div>}
        </div>
    );
}
