'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Car,
    Users,
    Calendar,
    ClipboardList,
    CheckSquare,
    Settings,
    Home,
    FileText,
    User,
    AlertTriangle
} from "lucide-react";
import Image from "next/image";

type UserRole = 'admin' | 'gestor' | 'solicitante';

interface SidebarProps {
    userRole: UserRole;
}

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
    roles: UserRole[];
}

const navItems: NavItem[] = [
    {
        href: '/dashboard',
        label: 'Dashboard',
        icon: <Home className="w-5 h-5" />,
        roles: ['admin', 'gestor'],
    },
    {
        href: '/dashboard/schedule',
        label: 'Reservas',
        icon: <Calendar className="w-5 h-5" />,
        roles: ['admin', 'gestor'],
    },
    {
        href: '/dashboard/checkins',
        label: 'Revisão e Alertas',
        icon: <CheckSquare className="w-5 h-5" />,
        roles: ['admin', 'gestor'],
    },
    {
        href: '/dashboard/occurrences',
        label: 'Lançamentos e Ocorrência',
        icon: <AlertTriangle className="w-5 h-5" />,
        roles: ['admin', 'gestor'],
    },
    {
        href: '/dashboard/approvals',
        label: 'Aprovações',
        icon: <ClipboardList className="w-5 h-5" />,
        roles: ['admin', 'gestor'],
    },
    {
        href: '/dashboard/requests',
        label: 'Minhas Solicitações',
        icon: <FileText className="w-5 h-5" />,
        roles: ['admin', 'gestor', 'solicitante'],
    },
    {
        href: '/dashboard/vehicles',
        label: 'Veículos',
        icon: <Car className="w-5 h-5" />,
        roles: ['admin', 'gestor'],
    },
    {
        href: '/dashboard/drivers',
        label: 'Condutores',
        icon: <Users className="w-5 h-5" />,
        roles: ['admin', 'gestor'],
    },
    {
        href: '/dashboard/profile',
        label: 'Meu Perfil',
        icon: <User className="w-5 h-5" />,
        roles: ['admin', 'gestor', 'solicitante'],
    },
    {
        href: '/dashboard/settings',
        label: 'Configurações',
        icon: <Settings className="w-5 h-5" />,
        roles: ['admin', 'gestor'],
    },
];

import { useSidebar } from "@/lib/contexts/SidebarContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function DashboardSidebar({ userRole }: SidebarProps) {
    const pathname = usePathname();
    const { isCollapsed, toggleSidebar } = useSidebar();

    const filteredItems = navItems.filter(item =>
        item.roles.includes(userRole)
    );

    return (<aside
        className={`fixed inset-y-0 left-0 z-50 bg-bg-card border-r border-slate-200 dark:border-slate-700/50 hidden lg:flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'
            }`}
    >
        {/* Logo area */}
        <div className={`h-20 flex items-center border-b border-border transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'justify-start px-6 gap-3'
            }`}>
            <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
                <div className={`relative flex items-center justify-center bg-white rounded-lg p-1.5 transition-all ${isCollapsed ? 'h-10 w-10' : 'h-10 w-10'
                    }`}>
                        <Image
                            src="/images/logo-light.png"
                            alt="PL"
                            width={40}
                            height={40}
                            className="object-contain"
                            unoptimized
                        />
                </div>
                {!isCollapsed && (
                    <div className="flex flex-col">
                        <span className="text-sm font-black text-[#990000] leading-tight uppercase whitespace-nowrap">
                            Frota
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 leading-tight uppercase whitespace-nowrap">
                            Programa Leilões
                        </span>
                    </div>
                )}
            </Link>

            {!isCollapsed && (
                <button
                    onClick={toggleSidebar}
                    className="ml-auto p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
            )}
        </div>

        {/* Toggle button for collapsed state */}
        {isCollapsed && (
            <div className="h-12 flex items-center justify-center border-b border-border">
                <button
                    onClick={toggleSidebar}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
            {filteredItems.map((item) => {
                const isActive = pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href));

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        title={isCollapsed ? item.label : undefined}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${isActive
                            ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border-brand-600 dark:border-brand-900'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
                            } ${isCollapsed ? 'justify-center' : ''} ${isActive && !isCollapsed ? 'border-l-4' : ''}`}
                    >
                        <div className="min-w-[20px] flex justify-center">
                            {item.icon}
                        </div>
                        {!isCollapsed && <span className="font-medium whitespace-nowrap overflow-hidden">{item.label}</span>}
                    </Link>
                );
            })}
        </nav>

        {/* Settings Button (Admin and Gestor) */}
        {(userRole === 'admin' || userRole === 'gestor') && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700/50">
                <Link
                    href="/dashboard/settings"
                    title={isCollapsed ? "Configurações" : undefined}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${pathname.startsWith('/dashboard/settings')
                        ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <Settings className="w-5 h-5" />
                    {!isCollapsed && <span className="font-medium">Configurações</span>}
                </Link>
            </div>
        )}
    </aside>
    );
}
