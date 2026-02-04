'use client';

import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { createUsageCategory, deleteUsageCategory, type UsageCategory } from "@/lib/services/settings";

interface UsageCategoriesTabProps {
    categories: UsageCategory[];
    onRefresh: () => void;
    showModal: boolean;
    setShowModal: (show: boolean) => void;
    setMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void;
}

export function UsageCategoriesTab({
    categories,
    onRefresh,
    showModal,
    setShowModal,
    setMessage
}: UsageCategoriesTabProps) {
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        try {
            const result = await createUsageCategory(formData);

            if (result.success) {
                setMessage({ type: 'success', text: 'Categoria de uso criada!' });
                setShowModal(false);
                onRefresh();
            } else {
                setMessage({ type: 'error', text: result.error || 'Erro ao criar categoria' });
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Tem certeza que deseja excluir esta categoria? Isso pode afetar a exibição de veículos vinculados.')) return;

        const result = await deleteUsageCategory(id);
        if (result.success) {
            setMessage({ type: 'success', text: 'Categoria excluída!' });
            onRefresh();
        } else {
            setMessage({ type: 'error', text: result.error || 'Erro ao excluir categoria' });
        }
    }

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white">Categorias de Uso</h3>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-950 text-white rounded-lg font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Nova Categoria
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                    <div
                        key={category.id}
                        className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-700 rounded-lg"
                    >
                        <span className="text-white font-medium">{category.name}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleDelete(category.id)}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-4">Nova Categoria de Uso</h3>
                        <form action={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Nome</label>
                                <input
                                    name="name"
                                    required
                                    placeholder="Ex: Fixo, Reserva, etc."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-950 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
