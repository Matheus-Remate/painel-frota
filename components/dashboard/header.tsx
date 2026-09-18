'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "@/lib/services/auth";
import { Menu, X, LogOut, User, ChevronDown, Bell } from "lucide-react";
import type { AuthUser } from "@/lib/services/auth";
import type { FleetNotification } from '@/lib/services/notifications';
import { getNotifications, markNotificationsRead } from '@/lib/services/notifications';

interface HeaderProps {
    user: AuthUser;
    initialNotifications: FleetNotification[];
}

export default function DashboardHeader({ user, initialNotifications }: HeaderProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState(initialNotifications);

    useEffect(() => {
        if (!['admin', 'gestor'].includes(user.profile?.role || '')) return;
        const timer = window.setInterval(async () => {
            try { setNotifications(await getNotifications()); } catch { /* retry on next poll */ }
        }, 60_000);
        return () => window.clearInterval(timer);
    }, [user.profile?.role]);

    const initials = user.profile
        ? `${user.profile.first_name?.[0] ?? ''}${user.profile.last_name?.[0] ?? ''}`.toUpperCase() || user.email[0].toUpperCase()
        : user.email[0].toUpperCase();

    const displayName = user.profile
        ? `${user.profile.first_name} ${user.profile.last_name}`
        : user.email;

    const roleLabels: Record<string, string> = {
        admin: 'Administrador',
        gestor: 'Gestor',
        solicitante: 'Solicitante',
    };
    const unread = notifications.filter((item) => !item.read_at).length;

    async function openNotifications() {
        const next = !showNotifications;
        setShowNotifications(next);
        if (next && unread) {
            const readAt = new Date().toISOString();
            setNotifications((items) => items.map((item) => ({ ...item, read_at: item.read_at || readAt })));
            await markNotificationsRead();
        }
    }

    return (

        <header className="h-16 bg-bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 transition-colors duration-300">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                aria-label="Abrir menu"
            >
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right Side */}
            <div className="flex items-center gap-4">

                {/* Notifications */}
                <div className="relative">
                <button onClick={openNotifications} aria-label={`Notificações${unread ? `, ${unread} não lidas` : ''}`} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white relative">
                    <Bell className="w-5 h-5" />
                    {unread > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-brand-600 px-1 text-center text-[10px] font-bold text-white">{unread > 9 ? '9+' : unread}</span>}
                </button>
                {showNotifications && <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
                    <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700"><p className="font-semibold text-slate-900 dark:text-white">Notificações da frota</p><p className="text-xs text-slate-500">Retiradas, devoluções e alertas</p></div>
                    <div className="max-h-80 overflow-y-auto">{notifications.length ? notifications.map((item) => <Link key={item.id} href={item.href} onClick={() => setShowNotifications(false)} className="block border-b border-slate-100 px-4 py-3 hover:bg-slate-50 dark:border-slate-700/60 dark:hover:bg-slate-700/50"><p className="text-sm font-medium text-slate-900 dark:text-white">{item.title}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.message}</p><time className="mt-1 block text-[10px] text-slate-400">{new Date(item.created_at).toLocaleString('pt-BR')}</time></Link>) : <p className="p-6 text-center text-sm text-slate-500">Nenhuma notificação.</p>}</div>
                </div>}
                </div>

                {/* User Menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                    >
                        {/* Avatar */}
                        {user.profile?.avatar_url ? (
                            <img
                                src={user.profile.avatar_url}
                                alt={displayName}
                                className="w-8 h-8 rounded-full object-cover ring-2 ring-white/20"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-brand-900 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                                {initials}
                            </div>
                        )}

                        <div className="hidden sm:block text-left">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{displayName}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{roleLabels[user.profile?.role || 'solicitante']}</p>
                        </div>

                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowDropdown(false)}
                            />
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-2">
                                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{displayName}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                                </div>

                                <Link
                                    href="/dashboard/profile"
                                    onClick={() => setShowDropdown(false)}
                                    className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                                >
                                    <User className="w-4 h-4" />
                                    Meu Perfil
                                </Link>

                                <form action={signOut}>
                                    <button
                                        type="submit"
                                        className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sair
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Mobile Menu */}
            {showMobileMenu && (
                <div className="absolute top-16 left-0 right-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 lg:hidden z-50">
                    <nav className="flex flex-col gap-2">
                        <Link href="/dashboard" onClick={() => setShowMobileMenu(false)} className="p-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg">Dashboard</Link>
                        {['admin', 'gestor'].includes(user.profile?.role || 'solicitante') && (
                            <>
                                <Link href="/dashboard/schedule" onClick={() => setShowMobileMenu(false)} className="p-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg">Reservas</Link>
                                <Link href="/dashboard/checkins" onClick={() => setShowMobileMenu(false)} className="p-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg">Revisão e Alertas</Link>
                                <Link href="/dashboard/occurrences" onClick={() => setShowMobileMenu(false)} className="p-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg">Lançamentos e Ocorrência</Link>
                                <Link href="/dashboard/approvals" onClick={() => setShowMobileMenu(false)} className="p-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg">Aprovações</Link>
                            </>
                        )}
                        <Link href="/dashboard/requests" onClick={() => setShowMobileMenu(false)} className="p-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg">Minhas Solicitações</Link>
                        {['admin', 'gestor'].includes(user.profile?.role || 'solicitante') && (
                            <>
                                <Link href="/dashboard/vehicles" onClick={() => setShowMobileMenu(false)} className="p-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg">Veículos</Link>
                                <Link href="/dashboard/drivers" onClick={() => setShowMobileMenu(false)} className="p-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg">Condutores</Link>
                                <Link href="/dashboard/settings" onClick={() => setShowMobileMenu(false)} className="p-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg">Configurações</Link>
                            </>
                        )}
                        <Link href="/dashboard/profile" onClick={() => setShowMobileMenu(false)} className="p-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg">Meu Perfil</Link>
                    </nav>
                </div>
            )}
        </header>
    );
}
