'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    FileText,
    Plus,
    Clock,
    CheckCircle,
    XCircle,
    Calendar,
    Car,
    User
} from "lucide-react";
import { getMyRequests, type VehicleRequest } from "@/lib/services/requests";
import RequestActions from "@/components/requests/RequestActions";

export default function RequestsPage() {
    const [requests, setRequests] = useState<VehicleRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'DENIED' | 'CANCELLED'>('all');

    useEffect(() => {
        loadRequests();
    }, []);

    async function loadRequests() {
        setLoading(true);
        try {
            const data = await getMyRequests();
            setRequests(data);
        } catch (error) {
            console.error('Error loading requests:', error);
        } finally {
            setLoading(false);
        }
    }

    const filteredRequests = filter === 'all'
        ? requests
        : requests.filter(r => r.status === filter);

    const statusConfig = {
        PENDING: {
            label: 'Aguardando',
            icon: <Clock className="w-4 h-4" />,
            bgColor: 'bg-amber-500/20',
            textColor: 'text-amber-400',
            borderColor: 'border-amber-500/30',
        },
        APPROVED: {
            label: 'Reservado',
            icon: <CheckCircle className="w-4 h-4" />,
            bgColor: 'bg-brand/20',
            textColor: 'text-brand-400',
            borderColor: 'border-brand/30',
        },
        DENIED: {
            label: 'Negado',
            icon: <XCircle className="w-4 h-4" />,
            bgColor: 'bg-red-500/20',
            textColor: 'text-red-400',
            borderColor: 'border-red-500/30',
        },
        CANCELLED: {
            label: 'Cancelado',
            icon: <XCircle className="w-4 h-4" />,
            bgColor: 'bg-slate-500/20',
            textColor: 'text-slate-400',
            borderColor: 'border-slate-500/30',
        },
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Minhas Solicitações</h1>
                    <p className="text-slate-400 mt-1">Acompanhe suas solicitações de veículos</p>
                </div>
                <Link
                    href="/dashboard/requests/new"
                    className="flex items-center gap-2 px-6 py-2.5 bg-brand hover:bg-brand-950 text-white rounded-lg font-medium shadow-lg shadow-brand/20 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Nova Solicitação
                </Link>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {[
                    { value: 'all', label: 'Todas' },
                    { value: 'PENDING', label: 'Aguardando' },
                    { value: 'APPROVED', label: 'Reservadas' },
                    { value: 'DENIED', label: 'Negadas' },
                    { value: 'CANCELLED', label: 'Canceladas' },
                ].map((option) => (
                    <button
                        key={option.value}
                        onClick={() => setFilter(option.value as any)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === option.value
                            ? 'bg-brand/20 text-brand-400'
                            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {/* Requests Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-12 text-center">
                    <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Nenhuma solicitação encontrada</h3>
                    <p className="text-slate-400 mb-6">
                        {filter === 'all'
                            ? 'Você ainda não fez nenhuma solicitação de veículo.'
                            : 'Nenhuma solicitação com este status.'}
                    </p>
                    <Link
                        href="/dashboard/requests/new"
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand hover:bg-brand-950 text-white rounded-lg font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Nova Solicitação
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRequests.map((request) => {
                        const status = statusConfig[request.status] || statusConfig.PENDING;
                        return (
                            <div
                                key={request.id}
                                className={`bg-slate-800/50 backdrop-blur-sm border rounded-xl p-6 ${status.borderColor} hover:shadow-lg transition-shadow`}
                            >
                                {/* Status Badge and Actions */}
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status.bgColor} ${status.textColor}`}>
                                        {status.icon}
                                        {status.label}
                                    </span>

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500 mr-2">
                                            {formatDate(request.created_at)}
                                        </span>
                                        <RequestActions requestId={request.id} status={request.status} onChanged={loadRequests} />
                                    </div>
                                </div>

                                {/* Event Name */}
                                <h3 className="text-lg font-bold text-white mb-3 line-clamp-2">
                                    {request.event_name}
                                </h3>

                                {/* Details */}
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Car className="w-4 h-4" />
                                        <span>
                                            {request.vehicle
                                                ? `${request.vehicle.model?.brand?.name || ''} ${request.vehicle.model?.name || ''} - ${request.vehicle.license_plate}`
                                                : request.model_name || 'Modelo não especificado'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Calendar className="w-4 h-4" />
                                        <span>
                                            {formatDate(request.pickup_datetime)} → {formatDate(request.return_datetime)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <User className="w-4 h-4" />
                                        <span>{request.driver_name}</span>
                                    </div>
                                </div>

                                {/* Denial Reason */}
                                {request.status === 'DENIED' && request.denial_reason && (
                                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                        <p className="text-xs text-red-400">
                                            <strong>Motivo:</strong> {request.denial_reason}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
