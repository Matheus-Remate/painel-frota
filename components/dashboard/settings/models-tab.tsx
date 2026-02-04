'use client';

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { createModel, updateModel, deleteModel, type Model, type Brand } from "@/lib/services/settings";

interface ModelsTabProps {
    initialModels: Model[];
    initialBrands: Brand[];
}

export function ModelsTab({ initialModels, initialBrands }: ModelsTabProps) {
    const [models, setModels] = useState<Model[]>(initialModels);
    const [brands] = useState<Brand[]>(initialBrands);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingModel, setEditingModel] = useState<Model | null>(null);
    const [filterBrand, setFilterBrand] = useState<string>('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const filteredModels = filterBrand
        ? models.filter(m => m.brand_id === filterBrand)
        : models;

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        try {
            const result = editingModel
                ? await updateModel(editingModel.id, formData)
                : await createModel(formData);

            if (result.success) {
                setMessage({ type: 'success', text: editingModel ? 'Modelo atualizado!' : 'Modelo criado!' });
                setShowModal(false);
                setEditingModel(null);
                window.location.reload();
            } else {
                setMessage({ type: 'error', text: result.error || 'Erro ao salvar modelo' });
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Tem certeza que deseja excluir este modelo?')) return;

        const result = await deleteModel(id);
        if (result.success) {
            setMessage({ type: 'success', text: 'Modelo excluído!' });
            window.location.reload();
        } else {
            setMessage({ type: 'error', text: result.error || 'Erro ao excluir modelo' });
        }
    }

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="text-lg font-semibold text-white">Modelos de Veículos</h3>
                <div className="flex gap-3">
                    <select
                        value={filterBrand}
                        onChange={(e) => setFilterBrand(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-300"
                    >
                        <option value="">Todas as Marcas</option>
                        {brands.map(brand => (
                            <option key={brand.id} value={brand.id}>{brand.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => { setEditingModel(null); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Modelo
                    </button>
                </div>
            </div>

            {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {message.text}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700">
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Modelo</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Marca</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredModels.map((model) => (
                            <tr key={model.id} className="border-b border-slate-700/50">
                                <td className="py-3 px-4 text-white font-medium">{model.name}</td>
                                <td className="py-3 px-4 text-slate-400">{(model.brand as any)?.name || '-'}</td>
                                <td className="py-3 px-4">
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => { setEditingModel(model); setShowModal(true); }}
                                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(model.id)}
                                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredModels.length === 0 && (
                            <tr>
                                <td colSpan={3} className="py-8 text-center text-slate-400">
                                    Nenhum modelo cadastrado
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-4">
                            {editingModel ? 'Editar Modelo' : 'Novo Modelo'}
                        </h3>
                        <form action={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Marca</label>
                                <select
                                    name="brandId"
                                    defaultValue={editingModel?.brand_id}
                                    required
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white"
                                >
                                    <option value="">Selecione uma marca</option>
                                    {brands.map(brand => (
                                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Nome do Modelo</label>
                                <input
                                    name="name"
                                    defaultValue={editingModel?.name}
                                    required
                                    placeholder="Ex: Argo"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setEditingModel(null); }}
                                    className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
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
