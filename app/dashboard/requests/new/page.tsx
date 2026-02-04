'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Send,
    Loader2,
    AlertCircle,
    CheckCircle,
    Calendar,
    Car,
    User,
    FileText
} from "lucide-react";
import { createRequest } from "@/lib/services/requests";
import { getModels, getBrands, type Model, type Brand } from "@/lib/services/settings";
import { getDrivers } from "@/lib/services/drivers";

export default function NewRequestPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [models, setModels] = useState<Model[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [selectedBrand, setSelectedBrand] = useState<string>('');
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setDataLoading(true);
        try {
            const [brandsData, modelsData, driversData] = await Promise.all([
                getBrands(),
                getModels(),
                getDrivers()
            ]);
            setBrands(brandsData);
            setModels(modelsData);
            setDrivers(driversData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setDataLoading(false);
        }
    }

    const filteredModels = selectedBrand
        ? models.filter(m => m.brand_id === selectedBrand)
        : models;

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);

        try {
            // Find selected driver name if using ID
            const driverId = formData.get('driverId') as string;
            if (driverId) {
                const driver = drivers.find(d => d.id === driverId);
                if (driver) {
                    formData.set('driverName', driver.name);
                }
            }

            const result = await createRequest(formData);

            if (result.success) {
                setShowSuccess(true);
            } else {
                setError(result.error || 'Erro ao criar solicitação');
            }
        } catch (e) {
            console.error(e);
            setError('Erro ao conectar com o servidor');
        } finally {
            setLoading(false);
        }
    }

    if (showSuccess) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-slate-800/50 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 rounded-full mb-4">
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Solicitação Enviada!
                    </h2>
                    <p className="text-slate-400 mb-6">
                        Sua reserva foi enviada com sucesso. Aguarde a confirmação no seu painel de solicitações.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link
                            href="/dashboard/requests"
                            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                        >
                            Ver Minhas Solicitações
                        </Link>
                        <button
                            onClick={() => { setShowSuccess(false); }}
                            className="px-6 py-2.5 border border-slate-600 text-slate-300 rounded-lg font-medium hover:bg-slate-700 transition-colors"
                        >
                            Nova Solicitação
                        </button>
                    </div>
                </div>
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
                    <h1 className="text-2xl font-bold text-white">Nova Solicitação</h1>
                    <p className="text-slate-400 text-sm">Solicite um veículo para seu evento</p>
                </div>
            </div>

            {/* Form */}
            <form action={handleSubmit} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 sm:p-8 space-y-6">
                {/* Error Alert */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Vehicle Selection */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-emerald-400 border-b border-slate-700 pb-2">
                        <Car className="w-5 h-5" />
                        <h2 className="text-lg font-semibold">Veículo</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-300">Marca (opcional)</label>
                            <select
                                value={selectedBrand}
                                onChange={(e) => setSelectedBrand(e.target.value)}
                                disabled={dataLoading}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
                            >
                                <option value="">Todas as marcas</option>
                                {brands.map(brand => (
                                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-300">Modelo Desejado *</label>
                            <select
                                name="modelId"
                                required
                                disabled={dataLoading}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
                            >
                                <option value="">Selecione um modelo</option>
                                {filteredModels.map(model => (
                                    <option key={model.id} value={model.id}>
                                        {(model.brand as any)?.name} {model.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Event Details */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-emerald-400 border-b border-slate-700 pb-2">
                        <FileText className="w-5 h-5" />
                        <h2 className="text-lg font-semibold">Detalhes do Evento</h2>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">Nome do Evento *</label>
                        <input
                            name="eventName"
                            required
                            placeholder="Ex: Reunião com cliente em São Paulo"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
                        />
                    </div>
                </div>

                {/* Date & Time */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-emerald-400 border-b border-slate-700 pb-2">
                        <Calendar className="w-5 h-5" />
                        <h2 className="text-lg font-semibold">Período</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-300">Data Retirada *</label>
                            <input
                                type="date"
                                name="pickupDatetime"
                                required
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-300">Data Devolução *</label>
                            <input
                                type="date"
                                name="returnDatetime"
                                required
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Driver */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-emerald-400 border-b border-slate-700 pb-2">
                        <User className="w-5 h-5" />
                        <h2 className="text-lg font-semibold">Condutor</h2>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">Condutor *</label>
                        <select
                            name="driverId"
                            required
                            disabled={dataLoading}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
                        >
                            <option value="">Selecione um condutor...</option>
                            {drivers.map(driver => (
                                <option key={driver.id} value={driver.id}>{driver.name}</option>
                            ))}
                        </select>
                        <input type="hidden" name="driverName" /> {/* Populated in handleSubmit */}
                    </div>
                </div>

                {/* Submit */}
                <div className="pt-4 flex gap-4">
                    <Link
                        href="/dashboard/requests"
                        className="px-6 py-2.5 border border-slate-600 text-slate-300 rounded-lg font-medium hover:bg-slate-700 transition-colors"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={loading || dataLoading}
                        className="flex-1 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium shadow-lg shadow-emerald-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                Enviar Solicitação
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
