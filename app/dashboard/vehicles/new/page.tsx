'use client';

import Link from "next/link";
import { ArrowLeft, Save, AlertCircle, Loader2, X } from "lucide-react";
import { createVehicle } from "@/lib/actions/vehicles";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBrands, getModels, getUsageCategories, type Brand, type Model, type UsageCategory } from "@/lib/services/settings";

export default function NewVehiclePage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [models, setModels] = useState<Model[]>([]);
    const [usageCategories, setUsageCategories] = useState<UsageCategory[]>([]);
    const [selectedBrandId, setSelectedBrandId] = useState<string>('');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [brandsData, modelsData, usageData] = await Promise.all([
                getBrands(),
                getModels(),
                getUsageCategories()
            ]);
            setBrands(brandsData);
            setModels(modelsData);
            setUsageCategories(usageData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setDataLoading(false);
        }
    }

    const filteredModels = selectedBrandId
        ? models.filter(m => m.brand_id === selectedBrandId)
        : [];

    const selectedBrand = brands.find(b => b.id === selectedBrandId);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);

        // modelId is already in formData from the select name="modelId"

        try {
            const result = await createVehicle(formData);

            if (result && !result.success) {
                setError(result.error || "Erro desconhecido ao criar veículo");
                setLoading(false);
            } else if (result?.success) {
                router.push('/dashboard/vehicles');
            }
        } catch (e) {
            console.error(e);
            setError("Erro de conexão ou erro interno no servidor");
            setLoading(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/vehicles"
                    className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Novo Veículo</h1>
                    <p className="text-slate-400 text-sm">Cadastre um novo veículo na frota</p>
                </div>
            </div>

            <form action={handleSubmit} className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 sm:p-8 space-y-8">

                {/* Hidden fields with default values */}

                {/* Botão X para Cancelar */}
                <Link href="/dashboard/vehicles" className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                </Link>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                {/* Dados Básicos */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-emerald-400 border-b border-slate-700 pb-2">Dados Básicos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="brandId" className="text-sm font-medium text-slate-300">Marca *</label>
                            <select
                                name="brandId"
                                required
                                disabled={dataLoading}
                                value={selectedBrandId}
                                onChange={(e) => setSelectedBrandId(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
                            >
                                <option value="">Selecione uma marca</option>
                                {brands.map(brand => (
                                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="modelId" className="text-sm font-medium text-slate-300">Modelo *</label>
                            <select
                                name="modelId"
                                required
                                disabled={dataLoading || !selectedBrandId}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none disabled:opacity-50"
                            >
                                <option value="">{selectedBrandId ? 'Selecione um modelo' : 'Selecione uma marca primeiro'}</option>
                                {filteredModels.map(model => (
                                    <option key={model.id} value={model.id}>{model.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="license_plate" className="text-sm font-medium text-slate-300">Placa *</label>
                            <input required name="license_plate" placeholder="ABC-1234" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none font-mono uppercase" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="color" className="text-sm font-medium text-slate-300">Cor *</label>
                            <input required name="color" placeholder="Ex: Branco" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="year" className="text-sm font-medium text-slate-300">Ano Fabricação *</label>
                            <input required type="number" name="year" min="1990" max="2100" placeholder="2024" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="fuel_type" className="text-sm font-medium text-slate-300">Combustível</label>
                            <select name="fuel_type" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none">
                                <option value="Diesel">Diesel</option>
                                <option value="Gasolina">Gasolina</option>
                                <option value="Etanol">Etanol</option>
                                <option value="Flex">Flex</option>
                                <option value="Elétrico">Elétrico</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="usage_category" className="text-sm font-medium text-slate-300">Tipo de Uso</label>
                            <select
                                name="usage_category"
                                required
                                disabled={dataLoading}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
                            >
                                <option value="">Selecione o tipo</option>
                                {usageCategories.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Documentação */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-emerald-400 border-b border-slate-700 pb-2">Documentação</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="chassis" className="text-sm font-medium text-slate-300">Chassi</label>
                            <input name="chassis" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none font-mono uppercase" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="renavam" className="text-sm font-medium text-slate-300">RENAVAM</label>
                            <input name="renavam" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none font-mono" />
                        </div>
                    </div>
                </div>

                <div className="pt-6 flex justify-end gap-3">
                    <Link href="/dashboard/vehicles" className="px-6 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors font-medium">
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={loading || dataLoading}
                        className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {loading ? 'Salvando...' : 'Salvar Veículo'}
                    </button>
                </div>

            </form>
        </div>
    );
}
