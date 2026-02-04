'use client';

import Link from "next/link";
import { useState } from "react";
import { requestPasswordReset } from "@/lib/services/auth";
import { Car, Loader2, ArrowLeft, Mail, CheckCircle, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);

        try {
            const result = await requestPasswordReset(formData);

            if (result.success) {
                setSuccess(true);
            } else {
                setError("Erro ao enviar e-mail de recuperação");
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
                        E-mail Enviado!
                    </h2>
                    <p className="text-slate-400 mb-6">
                        Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para o login
                    </Link>
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
                    Esqueceu a Senha?
                </h1>
                <p className="text-slate-400">
                    Digite seu e-mail para receber um link de recuperação
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

                    {/* Email Field */}
                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                            E-mail
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                autoComplete="email"
                                placeholder="seu@email.com"
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none transition-all"
                            />
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
                                Enviando...
                            </>
                        ) : (
                            "Enviar Link de Recuperação"
                        )}
                    </button>

                    {/* Back to Login */}
                    <Link
                        href="/login"
                        className="flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para o login
                    </Link>
                </form>
            </div>
        </div>
    );
}
