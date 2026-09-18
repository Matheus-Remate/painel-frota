'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Car, Loader2, Eye, EyeOff, CheckCircle, AlertCircle, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

type RecoveryState = "checking" | "ready" | "invalid";
const RECOVERY_VALIDATION_TIMEOUT_MS = 10_000;

function withRecoveryTimeout<T>(operation: Promise<T>) {
    return new Promise<T>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Tempo esgotado ao validar o link de recuperação.')), RECOVERY_VALIDATION_TIMEOUT_MS);
        operation.then(
            value => {
                clearTimeout(timeout);
                resolve(value);
            },
            reason => {
                clearTimeout(timeout);
                reject(reason);
            }
        );
    });
}

export default function ResetPasswordPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [recoveryState, setRecoveryState] = useState<RecoveryState>("checking");
    const [supabase] = useState(() => createClient());

    useEffect(() => {
        let mounted = true;

        const markReady = () => {
            if (mounted) setRecoveryState("ready");
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
                    markReady();
                }
            }
        );

        const initializeRecovery = async () => {
            const url = new URL(window.location.href);
            const code = url.searchParams.get("code");

            try {
                if (code) {
                    const { data, error: exchangeError } = await withRecoveryTimeout(supabase.auth.exchangeCodeForSession(code));
                    if (exchangeError || !data.session) {
                        throw exchangeError || new Error('O link não criou uma sessão de recuperação.');
                    }

                    window.history.replaceState({}, document.title, url.pathname);
                    if (mounted) setRecoveryState("ready");
                    return;
                }

                const { data: { session } } = await withRecoveryTimeout(supabase.auth.getSession());
                if (!mounted) return;

                setRecoveryState(session ? "ready" : "invalid");
            } catch (recoveryError) {
                console.error('Falha ao validar link de recuperação:', recoveryError);
                if (mounted) {
                    setError('Não foi possível validar este link. Solicite um novo link de recuperação.');
                    setRecoveryState("invalid");
                }
            }
        };

        initializeRecovery();

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [supabase]);

    async function handleSubmit(formData: FormData) {
        if (recoveryState !== "ready") {
            setError("O link de recuperação é inválido ou expirou. Solicite um novo link.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const password = formData.get("password") as string;
            const confirmPassword = formData.get("confirmPassword") as string;

            if (password !== confirmPassword) {
                setError("As senhas não coincidem.");
                return;
            }

            if (password.length < 8) {
                setError("A senha deve ter pelo menos 8 caracteres.");
                return;
            }

            const { error: updateError } = await withRecoveryTimeout(supabase.auth.updateUser({ password }));
            if (updateError) {
                setError(updateError.message);
                return;
            }

            await supabase.auth.signOut();
            setSuccess(true);
            setTimeout(() => {
                router.replace('/login');
            }, 3000);
        } catch (e) {
            console.error(e);
            setError("Não foi possível atualizar a senha. O link pode ter expirado; solicite um novo link de recuperação.");
        } finally {
            setLoading(false);
        }
    }

    if (recoveryState === "checking") {
        return (
            <div className="w-full max-w-md text-center">
                <Loader2 className="w-8 h-8 text-brand-400 animate-spin mx-auto mb-4" />
                <p className="text-slate-400">Validando o link de recuperação...</p>
            </div>
        );
    }

    if (recoveryState === "invalid") {
        return (
            <div className="w-full max-w-md">
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-xl text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Link inválido ou expirado</h2>
                    <p className="text-slate-400 mb-3">Solicite um novo link para redefinir sua senha.</p>
                    {error && <p className="mb-6 text-sm text-red-400">{error}</p>}
                    <Link href="/forgot-password" className="text-brand-400 hover:text-brand-300 transition-colors">
                        Solicitar novo link
                    </Link>
                </div>
            </div>
        );
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
