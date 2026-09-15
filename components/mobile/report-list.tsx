'use client';

import { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2, MessageSquare } from "lucide-react";

interface Report {
    id: string;
    checked_in_at: string;
    driver_name?: string | null;
    has_issues: boolean;
    resolved: boolean;
    resolved_at?: string;
    resolution_notes?: string;
    fuel_level?: string | null;
    odometer?: number;
    checklist?: Record<string, { status?: string; notes?: string; photoUrl?: string } | string>;
}

export default function ReportList({ history }: { history: Report[] }) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (history.length === 0) {
        return (
            <div className="text-slate-500 text-sm italic text-center py-6 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
                Nenhuma devolução registrada recentemente.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {history.map((record) => {
                const isExpanded = expandedId === record.id;
                const date = new Date(record.checked_in_at).toLocaleDateString('pt-BR');
                const time = new Date(record.checked_in_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                // Get issues from checklist
                const issues = record.checklist ?
                    Object.entries(record.checklist)
                        .filter(([, value]) => typeof value === 'object' && value?.status === 'REVIEW')
                        .map(([key, value]) => ({
                            item: key.charAt(0).toUpperCase() + key.slice(1),
                            notes: typeof value === 'object' ? value.notes : ''
                        })) : [];

                return (
                    <div key={record.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-all duration-200">
                        <button
                            onClick={() => toggleExpand(record.id)}
                            className="w-full text-left p-4 flex items-center justify-between active:bg-slate-800/50"
                        >
                            <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="text-[10px] text-slate-500 font-medium">
                                        {date} às {time}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!record.has_issues || record.resolved ? (
                                        <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                                            <CheckCircle2 className="w-3 h-3" />
                                            {record.has_issues ? 'Resolvido' : 'Sem alerta'}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-amber-500 text-[10px] font-bold uppercase tracking-wider">
                                            <AlertCircle className="w-3 h-3" />
                                            Pendente
                                        </div>
                                    )}
                                </div>
                            </div>
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                        </button>

                        {isExpanded && (
                            <div className="px-4 pb-4 pt-0 border-t border-slate-800/50 animate-in slide-in-from-top-1 duration-200">
                                <div className="mt-4 space-y-4">
                                    <p className="text-sm text-slate-300">Condutor: <strong>{record.driver_name || 'Não identificado'}</strong> · {record.odometer ?? 0} km · combustível {record.fuel_level || 'não informado'}.</p>
                                    <div>
                                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <MessageSquare className="w-3 h-3 text-brand" />
                                            Observações do Condutor
                                        </h4>
                                        <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3 space-y-3">
                                            {issues.length > 0 ? (
                                                issues.map((issue, idx) => (
                                                    <div key={idx} className="space-y-1">
                                                        <div className="text-xs font-bold text-slate-400">{issue.item}:</div>
                                                        <div className="text-sm text-slate-200">{issue.notes || 'Sem observações adicionais.'}</div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-sm text-slate-400 italic">Relatado como problema, mas sem notas específicas.</div>
                                            )}
                                        </div>
                                    </div>

                                    {record.resolved && record.resolution_notes && (
                                        <div>
                                            <h4 className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Nota de Resolução
                                            </h4>
                                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3 text-sm text-emerald-400/90 italic">
                                                "{record.resolution_notes}"
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
