'use client';

import { useState } from 'react';
import Link from 'next/link';

interface StatusCardProps {
    status: 'IN_YARD' | 'ON_ROUTE' | 'AWAITING_REPAIR' | 'IN_MAINTENANCE';
    count: number;
    availableVehicles?: any[];
}

import { Car, Route, Wrench, AlertTriangle } from 'lucide-react';

const statusConfig = {
    IN_YARD: {
        label: 'Veículos disponíveis hoje',
        icon: Car,
        color: 'bg-brand',
        gradient: 'from-brand to-brand-400',
        textColor: 'text-brand'
        , href: '/dashboard/vehicles?status=IN_YARD'
    },
    ON_ROUTE: {
        label: 'Veículos reservados hoje',
        icon: Route,
        color: 'bg-blue-500',
        gradient: 'from-blue-500 to-indigo-500',
        textColor: 'text-blue-500'
        , href: '/dashboard/reservations'
    },
    AWAITING_REPAIR: {
        label: 'Bloqueados para revisão',
        icon: AlertTriangle,
        color: 'bg-amber-500',
        gradient: 'from-amber-500 to-orange-500',
        textColor: 'text-amber-500'
        , href: '/dashboard/checkins'
    },
    IN_MAINTENANCE: {
        label: 'Em manutenção',
        icon: Wrench,
        color: 'bg-red-500',
        gradient: 'from-red-500 to-rose-500',
        textColor: 'text-red-500'
        , href: '/dashboard/vehicles?status=IN_MAINTENANCE'
    }
};

export default function StatusCard({ status, count, availableVehicles }: StatusCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const config = statusConfig[status];
    const Icon = config.icon;

    const showList = status === 'IN_YARD' && availableVehicles && availableVehicles.length > 0;

    return (
        <div
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link href={config.href} className="relative block overflow-hidden rounded-3xl border border-border bg-bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-500 hover:shadow-lg">
                {/* Gradiente decorativo */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${config.gradient} opacity-10 rounded-full -mr-16 -mt-16`} />

                <div className="relative p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl ${config.color} bg-opacity-10`}>
                            <Icon className={`w-6 h-6 ${config.textColor}`} />
                        </div>
                        <span className="text-3xl font-bold text-slate-100">
                            {count}
                        </span>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-100">
                        {config.label}
                    </h3>
                </div>
            </Link>

            {/* Lista Hover (apenas para Disponíveis) */}
            {showList && isHovered && (
                <div className="absolute z-50 top-full left-0 right-0 mt-2 p-4 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-xs font-bold text-slate-100 uppercase tracking-widest mb-3 px-1">
                        Veículos Livres Hoje
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                        {availableVehicles.map((v) => (
                            <Link href={`/dashboard/vehicles/${v.id}`} key={v.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 border border-slate-700/30 hover:bg-slate-700/70">
                                <div>
                                    <p className="text-sm font-bold text-white">
                                        {v.model?.brand?.name || (typeof (v as any)?.brand === 'string' ? (v as any).brand : '') || ''} {v.model?.name || (typeof (v as any)?.model === 'string' ? (v as any).model : '') || ''}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-medium">{v.license_plate}</p>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-brand shadow-sm shadow-brand/50" />
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
