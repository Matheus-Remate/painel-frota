'use client';

import Link from "next/link";
import { ArrowLeft, Save, AlertCircle, Loader2, X } from "lucide-react";
import { createDriver, updateDriver } from "@/lib/actions/drivers";
import { useState } from "react";
import { useRouter } from "next/navigation";


import { UserProfile } from "@/lib/services/auth";

interface DriverFormProps {
    initialData?: {
        id: string;
        name: string;
        cpf: string;
        cnh_category: string;
        cnh_expiration: string;
        user_id?: string | null;
    } | null;
    users: UserProfile[];
}

export function DriverForm({ initialData, users }: DriverFormProps) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);

        try {
            let result;

            if (initialData) {
                result = await updateDriver(initialData.id, formData);
            } else {
                result = await createDriver(formData);
            }

            if (result && !result.success) {
                setError(result.error || "Erro desconhecido ao salvar condutor");
                setLoading(false);
            } else if (initialData) {
                router.push('/dashboard/drivers');
                router.refresh();
            }
        } catch (e) {
            console.error(e);
            setError("Erro de conexão ao salvar");
            setLoading(false);
        }
    }

    return (
        <form action={handleSubmit} className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 sm:p-8 space-y-6">

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
                    <input
                        required
                        name="name"
                        defaultValue={initialData?.name || ''}
                        placeholder="Ex: João da Silva"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="cpf" className="text-sm font-medium text-slate-300">CPF</label>
                    <input
                        required
                        name="cpf"
                        defaultValue={initialData?.cpf || ''}
                        placeholder="000.000.000-00"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none font-mono"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="user_id" className="text-sm font-medium text-slate-300">Vincular Usuário do Sistema (Opcional)</label>
                    <select
                        name="user_id"
                        defaultValue={initialData?.user_id || ''}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none"
                    >
                        <option value="">Nenhum usuário vinculado</option>
                        {users.map((user) => (
                            <option key={user.user_id} value={user.user_id}>
                                {user.first_name} {user.last_name} ({user.email})
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-slate-500">
                        Vincular um usuário permite que ele visualize seus dados de condutor no perfil.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="cnh_category" className="text-sm font-medium text-slate-300">Categoria CNH</label>
                        <select
                            name="cnh_category"
                            defaultValue={initialData?.cnh_category || 'B'}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none"
                        >
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
                        <input
                            required
                            type="date"
                            name="cnh_expiration"
                            defaultValue={initialData?.cnh_expiration ? new Date(initialData.cnh_expiration).toISOString().split('T')[0] : ''}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none [color-scheme:dark]"
                        />
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
                    className="px-6 py-2.5 rounded-lg bg-brand hover:bg-brand-950 text-white shadow-lg shadow-brand/20 transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {loading ? 'Salvando...' : (initialData ? 'Atualizar Condutor' : 'Salvar Condutor')}
                </button>
            </div>

        </form>
    );
}
