'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, CalendarDays, CarFront, CheckCircle2, ClipboardList, Home, Menu, Plus, Search, Settings, TriangleAlert, X } from 'lucide-react';
import { signOut, type AuthUser } from '@/lib/services/auth';
import type { FleetNotification } from '@/lib/services/notifications';
import { getNotifications, markNotificationsRead } from '@/lib/services/notifications';

interface HeaderProps { user: AuthUser; initialNotifications: FleetNotification[]; }

const items = [
    { href: '/dashboard', label: 'Centro de Comando', icon: Home, roles: ['admin', 'gestor'] },
    { href: '/dashboard/vehicles', label: 'Frota & Pátio', icon: CarFront, roles: ['admin', 'gestor'] },
    { href: '/dashboard/schedule', label: 'Reservas & Agenda', icon: CalendarDays, roles: ['admin', 'gestor'] },
    { href: '/dashboard/checkins', label: 'Revisões & Vistorias', icon: CheckCircle2, roles: ['admin', 'gestor'] },
    { href: '/dashboard/occurrences', label: 'Ocorrências', icon: TriangleAlert, roles: ['admin', 'gestor'] },
    { href: '/dashboard/requests', label: 'Minhas Solicitações', icon: ClipboardList, roles: ['admin', 'gestor', 'solicitante'] },
];

export default function DashboardHeader({ user, initialNotifications }: HeaderProps) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState(initialNotifications);
    const role = user.profile?.role || 'solicitante';
    const initials = user.profile ? `${user.profile.first_name?.[0] || ''}${user.profile.last_name?.[0] || ''}`.toUpperCase() || user.email[0].toUpperCase() : user.email[0].toUpperCase();
    const name = user.profile ? `${user.profile.first_name || ''} ${user.profile.last_name || ''}`.trim() || user.email : user.email;
    const unread = notifications.filter(item => !item.read_at).length;

    useEffect(() => {
        if (!['admin', 'gestor'].includes(role)) return;
        const timer = window.setInterval(async () => { try { setNotifications(await getNotifications()); } catch { /* keep previous state */ } }, 60_000);
        return () => window.clearInterval(timer);
    }, [role]);

    async function toggleNotifications() {
        const next = !notificationsOpen;
        setNotificationsOpen(next);
        if (next && unread) {
            const readAt = new Date().toISOString();
            setNotifications(current => current.map(item => ({ ...item, read_at: item.read_at || readAt })));
            await markNotificationsRead();
        }
    }

    const nav = items.filter(item => item.roles.includes(role));
    const active = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

    return <header className="sticky top-0 z-50 border-b border-[#232f45] bg-[#131a26]/95 backdrop-blur-md">
        <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center gap-3">
                <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-400/25 bg-[#990000] text-sm font-extrabold tracking-wide text-white shadow-lg shadow-red-950/40">PL</span>
                    <span className="hidden leading-tight sm:block"><span className="block text-xs font-extrabold uppercase tracking-wider text-red-400">Frota</span><span className="block text-sm font-extrabold uppercase text-white">Programa Leilões</span></span>
                </Link>
                <div className="hidden items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/35 px-3 py-1 text-xs font-semibold text-emerald-400 xl:flex"><span className="h-2 w-2 rounded-full bg-emerald-400" />SISTEMA ATIVO</div>
                <label className="relative ml-auto hidden max-w-xl flex-1 md:block"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input aria-label="Busca global" placeholder="Buscar placa, modelo ou condutor..." className="w-full rounded-lg border border-[#232f45] bg-[#182232] py-2 pl-10 pr-12 text-xs text-slate-100 outline-none placeholder:text-slate-500 focus:border-red-700 focus:ring-1 focus:ring-red-900" /><kbd className="ops-mono absolute right-2.5 top-1/2 -translate-y-1/2 rounded bg-[#232f45] px-1.5 py-0.5 text-[10px] text-slate-400">⌘K</kbd></label>
                {role !== 'solicitante' && <Link href="/dashboard/schedule/new" className="hidden items-center gap-2 rounded-lg border border-red-400/20 bg-[#990000] px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-red-950/30 transition hover:bg-red-800 sm:flex"><Plus className="h-4 w-4" />Nova Reserva</Link>}
                <div className="relative"><button onClick={toggleNotifications} aria-label="Notificações" className="relative rounded-lg border border-[#232f45] p-2 text-slate-300 hover:bg-[#182232] hover:text-white"><Bell className="h-5 w-5" />{unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#990000] px-1 text-[10px] font-bold text-white ring-2 ring-[#131a26]">{unread > 9 ? '9+' : unread}</span>}</button>{notificationsOpen && <div className="absolute right-0 mt-2 max-h-96 w-80 overflow-y-auto rounded-xl border border-[#232f45] bg-[#182232] shadow-2xl"><div className="border-b border-[#232f45] px-4 py-3"><p className="text-sm font-bold text-white">Central de alertas</p><p className="text-xs text-slate-400">Eventos que exigem atenção</p></div>{notifications.length ? notifications.map(item => <Link key={item.id} href={item.href} onClick={() => setNotificationsOpen(false)} className="block border-b border-[#232f45]/70 px-4 py-3 hover:bg-[#1e2b3e]"><p className="text-sm font-medium text-slate-100">{item.title}</p><p className="mt-1 text-xs text-slate-400">{item.message}</p></Link>) : <p className="p-6 text-center text-sm text-slate-400">Nenhum alerta.</p>}</div>}</div>
                <Link href="/dashboard/profile" className="hidden items-center gap-2 border-l border-[#232f45] pl-3 sm:flex"><span className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-400/40 bg-red-950/60 text-xs font-bold text-red-100">{initials}</span><span className="hidden text-left lg:block"><span className="block text-xs font-semibold text-slate-200">{name}</span><span className="block text-[10px] text-slate-400">{role === 'admin' ? 'Administrador' : role === 'gestor' ? 'Gestor de Frotas' : 'Solicitante'}</span></span></Link>
                <button onClick={() => setMobileOpen(value => !value)} className="rounded-lg border border-[#232f45] p-2 text-slate-300 md:hidden">{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
            </div>
            <nav className={`${mobileOpen ? 'flex' : 'hidden'} items-stretch gap-1 overflow-x-auto border-t border-[#1c2637] md:flex`}>
                {nav.map(item => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-xs font-semibold transition ${active(item.href) ? 'border-[#990000] bg-[#182232]/70 text-white' : 'border-transparent text-slate-400 hover:border-slate-600 hover:text-slate-200'}`}><Icon className={`h-4 w-4 ${active(item.href) ? 'text-red-400' : ''}`} />{item.label}</Link>; })}
                {role !== 'solicitante' && <Link href="/dashboard/settings" className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-xs font-semibold ${pathname.startsWith('/dashboard/settings') ? 'border-[#990000] text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}><Settings className="h-4 w-4" />Configurações</Link>}
                <form action={signOut} className="ml-auto hidden md:block"><button className="h-full px-3 text-xs text-slate-400 hover:text-red-300">Sair</button></form>
            </nav>
        </div>
    </header>;
}
