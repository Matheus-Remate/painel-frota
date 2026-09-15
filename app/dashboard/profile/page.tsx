'use client';

import { useState } from "react";
import { updateProfile, updatePassword, updateAvatar } from "@/lib/services/auth";
import { useAuth } from "@/lib/contexts/AuthContext";
import { User, Save, Loader2, Camera, Lock, AlertCircle, CheckCircle, Car } from "lucide-react";
import { useEffect } from "react";
import { getDriverByUserId } from "@/lib/services/dashboard";

export default function ProfilePage() {
    const { user, profile, refreshProfile, isLoading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (user && !authLoading && !profile) {
            refreshProfile();
        }
    }, [user, authLoading, profile, refreshProfile]);

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 text-brand animate-spin" />
            </div>
        );
    }

    if (user && !profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <h2 className="text-xl font-bold text-white">Perfil não encontrado</h2>
                <p className="text-slate-400">Não conseguimos localizar seus dados de perfil no sistema.</p>
                <button
                    onClick={() => refreshProfile()}
                    className="px-4 py-2 bg-brand text-white rounded-lg"
                >
                    Tentar Novamente
                </button>
            </div>
        );
    }

    async function handleProfileSubmit(formData: FormData) {
        setLoading(true);
        setMessage(null);

        try {
            const result = await updateProfile(formData);

            if (result.success) {
                setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
                await refreshProfile();
            } else {
                setMessage({ type: 'error', text: result.error || 'Erro ao atualizar perfil' });
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' });
        } finally {
            setLoading(false);
        }
    }

    async function handlePasswordSubmit(formData: FormData) {
        setPasswordLoading(true);
        setPasswordMessage(null);

        try {
            const result = await updatePassword(formData);

            if (result.success) {
                setPasswordMessage({ type: 'success', text: 'Senha atualizada com sucesso!' });
            } else {
                setPasswordMessage({ type: 'error', text: result.error || 'Erro ao atualizar senha' });
            }
        } catch (e) {
            setPasswordMessage({ type: 'error', text: 'Erro ao conectar com o servidor' });
        } finally {
            setPasswordLoading(false);
        }
    }

    async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const result = await updateAvatar(formData);
            if (result.success) {
                await refreshProfile();
            }
        } catch (e) {
            console.error('Error uploading avatar:', e);
        }
    }

    const initials = profile
        ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
        : 'U';

    return (
        <div className="max-w-4xl mx-auto space-y-8" key={profile?.id || 'loading'}>
            <div>
                <h1 className="text-3xl font-bold text-white">Meu Perfil</h1>
                <p className="text-slate-400 mt-1">Gerencie suas informações pessoais</p>
            </div>

            {/* Avatar & Basic Info */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Avatar */}
                    <div className="relative group">
                        {profile?.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt="Avatar"
                                className="w-24 h-24 rounded-full object-cover border-4 border-slate-700"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand to-brand-800 flex items-center justify-center text-white text-2xl font-bold border-4 border-slate-700">
                                {initials}
                            </div>
                        )}
                        <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Camera className="w-6 h-6 text-white" />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {/* Info */}
                    <div className="text-center sm:text-left">
                        <h2 className="text-xl font-bold text-white">
                            {profile?.first_name} {profile?.last_name}
                        </h2>
                        <p className="text-slate-400">{profile?.email}</p>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold
                            ${profile?.role === 'admin' ? 'bg-amber-500/20 text-amber-400' :
                                profile?.role === 'gestor' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-slate-700 text-slate-300'}`}
                        >
                            {profile?.role === 'admin' ? 'Administrador' :
                                profile?.role === 'gestor' ? 'Gestor' : 'Solicitante'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Edit Profile Form */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <User className="w-5 h-5 text-brand-400" />
                    <h3 className="text-lg font-semibold text-white">Informações Pessoais</h3>
                </div>

                {message && (
                    <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success'
                        ? 'bg-brand/10 border border-brand/20 text-brand-400'
                        : 'bg-red-500/10 border border-red-500/20 text-red-400'
                        }`}>
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {message.text}
                    </div>
                )}

                <form action={handleProfileSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="firstName" className="block text-sm font-medium text-slate-300">
                                Nome
                            </label>
                            <input
                                id="firstName"
                                name="firstName"
                                type="text"
                                defaultValue={profile?.first_name}
                                required
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="lastName" className="block text-sm font-medium text-slate-300">
                                Sobrenome
                            </label>
                            <input
                                id="lastName"
                                name="lastName"
                                type="text"
                                defaultValue={profile?.last_name}
                                required
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                            E-mail
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            defaultValue={profile?.email}
                            readOnly
                            aria-describedby="email-help"
                            required
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none"
                        />
                        <p id="email-help" className="mt-1 text-xs text-slate-500">O e-mail de acesso é administrado pelo administrador para permanecer sincronizado com a autenticação.</p>
                    </div>
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-brand hover:bg-brand-950 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>

            {/* Change Password Form */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Lock className="w-5 h-5 text-brand-400" />
                    <h3 className="text-lg font-semibold text-white">Alterar Senha</h3>
                </div>

                {passwordMessage && (
                    <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${passwordMessage.type === 'success'
                        ? 'bg-brand/10 border border-brand/20 text-brand-400'
                        : 'bg-red-500/10 border border-red-500/20 text-red-400'
                        }`}>
                        {passwordMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {passwordMessage.text}
                    </div>
                )}

                <form action={handlePasswordSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                                Nova Senha
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                minLength={8}
                                placeholder="Mínimo 8 caracteres"
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
                                Confirmar Nova Senha
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                minLength={8}
                                placeholder="Digite novamente"
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none"
                            />
                        </div>
                    </div>
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={passwordLoading}
                            className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                            {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                            Alterar Senha
                        </button>
                    </div>
                </form>
            </div>

            {/* Driver Info Section (If Linked) */}
            <DriverInfoSection />
        </div>
    );
}

function DriverInfoSection() {
    const { user } = useAuth();
    const [driver, setDriver] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        async function fetchDriver() {
            if (!user?.id) {
                setLoading(false);
                return;
            }

            try {
                const data = await getDriverByUserId(user.id);
                if (mounted) setDriver(data);
            } catch (err) {
                console.error("Error fetching driver info:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        fetchDriver();
        return () => { mounted = false; };
    }, [user?.id]);

    if (loading) return null;
    if (!driver) return null;

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <Car className="w-5 h-5 text-brand-400" />
                <h3 className="text-lg font-semibold text-white">Dados do Condutor</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-400">CPF</p>
                    <p className="text-white font-mono">{driver.cpf}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-400">Categoria CNH</p>
                    <p className="text-white">{driver.cnh_category}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-400">Validade CNH</p>
                    <p className="text-white">
                        {new Date(driver.cnh_expiration).toLocaleDateString('pt-BR')}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-slate-500 mt-2">
                        Para alterar estes dados, entre em contato com o administrador.
                    </p>
                </div>
            </div>
        </div>
    );
}
