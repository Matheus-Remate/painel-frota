'use client';

import { useState } from 'react';
import { resolveCheckin } from '@/lib/services/dashboard';
import { Check, Loader2, X } from 'lucide-react';

export default function CheckinActions({ checkinId }: { checkinId: string }) {
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [notes, setNotes] = useState('');

    async function handleResolve() {
        setLoading(true);
        const result = await resolveCheckin(checkinId, notes);
        if (result.success) {
            setShowModal(false);
        } else {
            alert('Erro ao resolver: ' + result.error);
        }
        setLoading(false);
    }

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-colors text-sm font-medium"
            >
                <Check className="w-4 h-4" />
                Resolver
            </button>

            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-8 w-full max-w-4xl space-y-6 relative animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Resolver Alerta</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Notas de Resolução</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="O que foi feito para resolver o problema?"
                                placeholder="O que foi feito para resolver o problema?"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-brand focus:border-transparent min-h-[200px] text-lg resize-y"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleResolve}
                                disabled={loading || !notes.trim()}
                                className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-950 text-white rounded-lg disabled:opacity-50"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Confirmar Resolução
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
