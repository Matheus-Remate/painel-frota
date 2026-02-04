'use client';

import Link from "next/link";
import { ArrowLeft, Save, AlertCircle, Loader2, X } from "lucide-react";
import { createDriver } from "@/lib/actions/drivers";
import { useState } from "react";

export default function NewDriverPage() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);

        try {
            const result = await createDriver(formData);

            if (result && !result.success) {
                setError(result.error || "Erro desconhecido ao criar condutor");
                setLoading(false);
            }
        } catch (e) {
            console.error(e);
            setError("Erro de conexão ao salvar");
            setLoading(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/drivers"
                    className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Novo Condutor</h1>
                    <p className="text-slate-400 text-sm">Registre um novo motorista autorizado</p>
                </div>
            </div>

            <form action={handleSubmit} className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 sm:p-8 space-y-6">

                {/* Botão X para Cancelar */}
                <Link href="/dashboard/drivers" className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                </Link>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-slate-300">Nome Completo</label>
                        <input required name="name" placeholder="Ex: João da Silva" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none" />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="cpf" className="text-sm font-medium text-slate-300">CPF</label>
                        <input required name="cpf" placeholder="000.000.000-00" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none font-mono" />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="cnh_category" className="text-sm font-medium text-slate-300">Categoria CNH</label>
                            <select name="cnh_category" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none">
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                                <option value="E">E</option>
                                <option value="AB">AB</option>
                                <option value="AC">AC</option>
                                <option value="AD">AD</option>
                                <option value="AE">AE</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="cnh_expiration" className="text-sm font-medium text-slate-300">Validade CNH</label>
                            <input required type="date" name="cnh_expiration" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none [color-scheme:dark]" />
                        </div>
                    </div>
                </div>

                <div className="pt-6 flex justify-end gap-3 border-t border-slate-700/50 mt-6">
                    <Link href="/dashboard/drivers" className="px-6 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors font-medium">
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {loading ? 'Salvando...' : 'Salvar Condutor'}
                    </button>
                </div>

            </form>
        </div>
    );
}
