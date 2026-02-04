'use client';

import Link from "next/link";
import { useState } from "react";
import { updatePassword } from "@/lib/services/auth";
import { Car, Loader2, Eye, EyeOff, CheckCircle, AlertCircle, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);

        try {
            const result = await updatePassword(formData);

            if (result.success) {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } else {
                setError(result.error || "Erro ao atualizar senha");
            }
        } catch (e) {
            console.error(e);
            setError("Erro ao conectar com o servidor");
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <div className="w-full max-w-md">
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-xl text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-brand/20 rounded-full mb-4">
                        <CheckCircle className="w-8 h-8 text-brand-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Senha Atualizada!
                    </h2>
                    <p className="text-slate-400 mb-6">
                        Sua senha foi alterada com sucesso. Redirecionando para o login...
                    </p>
                    <div className="flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md">
            {/* Logo & Title */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand to-brand-800 rounded-2xl mb-4 shadow-lg shadow-brand/20">
                    <Car className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                    Nova Senha
                </h1>
                <p className="text-slate-400">
                    Digite sua nova senha abaixo
                </p>
            </div>

            {/* Form Card */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-xl">
                <form action={handleSubmit} className="space-y-6">
                    {/* Error Alert */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {/* Password Field */}
                    <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                            Nova Senha
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={8}
                                placeholder="Mínimo 8 caracteres"
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-12 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
                            Confirmar Nova Senha
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                minLength={8}
                                placeholder="Digite novamente"
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-12 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-brand to-brand-800 hover:from-brand-950 hover:to-brand-950 text-white font-semibold py-3 px-4 rounded-lg shadow-lg shadow-brand/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Atualizando...
                            </>
                        ) : (
                            "Atualizar Senha"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
