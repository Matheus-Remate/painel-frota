'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
    ArrowLeft,
    AlertCircle,
    Calendar,
    Car,
    User,
    Save,
    Loader2
} from "lucide-react";
import { updateRequest, getRequestById, type VehicleRequest } from "@/lib/services/requests";
import { getModels, getBrands, type Model, type Brand } from "@/lib/services/settings";

export default function EditRequestPage() {
    const router = useRouter();
    const params = useParams();
    const requestId = params.id as string;

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [request, setRequest] = useState<VehicleRequest | null>(null);

    const [brands, setBrands] = useState<Brand[]>([]);
    const [models, setModels] = useState<Model[]>([]);
    const [selectedBrand, setSelectedBrand] = useState<string>('');

    // Form fields (initialized when data loads)
    // We can let native form control handle inputs, but for brand/model select logic we need React state

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [requestData, brandsData, modelsData] = await Promise.all([
                getRequestById(requestId),
                getBrands(),
                getModels()
            ]);

            if (!requestData) {
                setError("Solicitação não encontrada");
                setPageLoading(false);
                return;
            }

            if (requestData.status !== 'PENDING') {
                setError("Apenas solicitações pendentes podem ser editadas");
                setPageLoading(false);
                return;
            }

            setRequest(requestData);
            setBrands(brandsData);
            setModels(modelsData);

            // Set initial selected brand based on model
            if (requestData.model_id) {
                const model = modelsData.find((m: any) => m.id === requestData.model_id);
                if (model) setSelectedBrand(model.brand_id);
            } else if (requestData.model?.brand?.name) { // Fallback if model_id is missing but model relation populated? (Less likely with my simple query)
                // Actually getRequestById DOES populate model.brand
                // Let's rely on model_id if possible logic or try to find brand by name
            }

        } catch (error) {
            console.error('Error loading data:', error);
            setError('Erro ao carregar dados');
        } finally {
            setPageLoading(false);
        }
    }

    const filteredModels = selectedBrand
        ? models.filter(m => m.brand_id === selectedBrand)
        : models;

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);
        try {
            const result = await updateRequest(requestId, formData);
            if (result.success) {
                router.push('/dashboard/requests');
                router.refresh();
            } else {
                setError(result.error || 'Erro ao atualizar solicitação');
            }
        } catch (e) {
            console.error(e);
            setError('Erro ao conectar com o servidor');
        } finally {
            setLoading(false);
        }
    }

    if (pageLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
        );
    }

    if (error || !request) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-bold text-white mb-2">Erro</h2>
                <p className="text-slate-400 mb-6">{error || 'Solicitação não encontrada'}</p>
                <Link href="/dashboard/requests" className="text-emerald-400 hover:text-emerald-300">
                    Voltar para Minhas Solicitações
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/requests"
                    className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Editar Solicitação</h1>
                    <p className="text-slate-400 text-sm">Atualize os dados da sua reserva</p>
                </div>
            </div>

            {/* Form */}
            <form action={handleSubmit} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 sm:p-8 space-y-6">

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                {/* Event Name */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Nome do Evento/Motivo</label>
                    <input
                        name="eventName"
                        defaultValue={request.event_name}
                        required
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                    />
                </div>

                {/* Vehicle Selection */}
                <div className="space-y-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-3 text-emerald-400">
                        <Car className="w-5 h-5" />
                        <h2 className="text-lg font-semibold">Preferência de Veículo</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Marca</label>
                            <select
                                value={selectedBrand}
                                onChange={(e) => setSelectedBrand(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                            >
                                <option value="">Qualquer Marca</option>
                                {brands.map(brand => (
                                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Modelo</label>
                            <select
                                name="modelId"
                                defaultValue={request.model_id || ''}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                            >
                                <option value="">Qualquer Modelo</option>
                                {filteredModels.map(model => (
                                    <option key={model.id} value={model.id}>{model.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Date/Time */}
                <div className="space-y-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-3 text-emerald-400">
                        <Calendar className="w-5 h-5" />
                        <h2 className="text-lg font-semibold">Data e Hora</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Data de Retirada</label>
                            <input
                                type="date"
                                name="pickupDatetime"
                                required
                                defaultValue={request.pickup_datetime?.slice(0, 10)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Data de Devolução</label>
                            <input
                                type="date"
                                name="returnDatetime"
                                required
                                defaultValue={request.return_datetime?.slice(0, 10)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Driver */}
                <div className="space-y-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-3 text-emerald-400">
                        <User className="w-5 h-5" />
                        <h2 className="text-lg font-semibold">Condutor</h2>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Nome do Condutor</label>
                        <input
                            name="driverName"
                            defaultValue={request.driver_name}
                            required
                            placeholder="Quem irá dirigir o veículo"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-6 flex justify-end gap-3">
                    <Link href="/dashboard/requests" className="px-6 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors font-medium">
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>

            </form>
        </div>
    );
}
