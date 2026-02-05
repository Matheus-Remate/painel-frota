'use client';

import { useState } from "react";
import Link from "next/link";
import { signOut } from "@/lib/services/auth";
import { Menu, X, LogOut, User, ChevronDown, Bell } from "lucide-react";
import type { AuthUser } from "@/lib/services/auth";

interface HeaderProps {
    user: AuthUser;
}

export default function DashboardHeader({ user }: HeaderProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const initials = user.profile
        ? `${user.profile.first_name[0]}${user.profile.last_name[0]}`.toUpperCase()
        : user.email[0].toUpperCase();

    const displayName = user.profile
        ? `${user.profile.first_name} ${user.profile.last_name}`
        : user.email;

    const roleLabels: Record<string, string> = {
        admin: 'Administrador',
        gestor: 'Gestor',
        solicitante: 'Solicitante',
    };

    return (

        <header className="h-16 bg-bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 transition-colors duration-300">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right Side */}
            <div className="flex items-center gap-4">

                {/* Notifications */}
                <button className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white relative">
                    <Bell className="w-5 h-5" />
                    {/* Notification Badge */}
                    <span className="absolute top-1 right-1 w-2 h-2 bg-brand-600 rounded-full"></span>
                </button>

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
                            </>
                        )}
                        <Link href="/dashboard/profile" onClick={() => setShowMobileMenu(false)} className="p-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg">Meu Perfil</Link>
                    </nav>
                </div>
            )}
        </header>
    );
}
