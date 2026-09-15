'use client';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "@/lib/services/auth";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);

        try {
            const redirect = new URLSearchParams(window.location.search).get('redirect');
            if (redirect) formData.set('redirect', redirect);
            const result = await signIn(formData);
            if (result?.success && result.redirect) {
                // A navegação completa garante que os cookies de sessão gravados
                // pela server action sejam lidos imediatamente pelo dashboard.
                window.location.replace(result.redirect);
                return; // Mantém o estado "Entrando..." até a nova página carregar.
            } else if (result && !result.success) {
                setError(result.error || "E-mail ou senha inválidos.");
            }
        } catch (e) {
            console.error(e);
            setError("Não foi possível entrar. Tente novamente.");
        }

        setLoading(false);
    }

    return (
        <div className="w-full max-w-md">
            {/* Logo & Title */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl mb-6 shadow-xl shadow-slate-200 dark:shadow-none">
                    <Image
                        src="/images/logo-light.png"
                        alt="Programa Leilões"
                        width={200}
                        height={60}
                        className="object-contain"
                    />
                </div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                    Gestão de Frota
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                    Acesso restrito a funcionários
                </p>
            </div>

            {/* Login Card */}
            <div className="bg-bg-card backdrop-blur-sm border border-border rounded-3xl p-8 shadow-2xl transition-colors duration-300">
                <form action={handleSubmit} className="space-y-6">
                    {/* Error Alert */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    {/* Email Field */}
                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                            E-mail
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            placeholder="seu@email.com"
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-border rounded-xl px-4 py-3.5 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-brand-900/20 focus:border-brand-900 outline-none transition-all"
                        />
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                            Senha
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                autoComplete="current-password"
                                placeholder="••••••••"
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-border rounded-xl px-4 py-3.5 pr-12 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-brand-900/20 focus:border-brand-900 outline-none transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-1"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end px-1">
                        <Link
                            href="/forgot-password"
                            className="text-sm font-semibold text-brand-900 hover:text-brand-800 transition-colors"
                        >
                            Esqueci minha senha
                        </Link>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#990000] hover:bg-[#770000] text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-red-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Entrando...
                            </>
                        ) : (
                            "ENTRAR NO SISTEMA"
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-3 bg-bg-card text-slate-400 font-medium italic">Sistema Corporativo</span>
                    </div>
                </div>

            </div>

            {/* Footer */}
            <p className="mt-8 text-center text-sm text-slate-500">
                Sistema de Gestão de Frota © {new Date().getFullYear()}
            </p>
        </div>
    );
}
