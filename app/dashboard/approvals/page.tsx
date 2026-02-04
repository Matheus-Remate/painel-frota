'use client';

import { useState, useEffect } from "react";
import {
    ClipboardList,
    Check,
    X,
    Loader2,
    AlertCircle,
    CheckCircle,
    Calendar,
    Car,
    User,
    Mail
} from "lucide-react";
import {
    getPendingRequests,
    approveRequest,
    denyRequest,
    getAvailableVehicles,
    type VehicleRequest
} from "@/lib/services/requests";

interface Vehicle {
    id: string;
    license_plate: string;
    color: string;
    status: string;
    isAvailable: boolean;
    model_id: string;
    model: {
        id: string;
        name: string;
        brand: {
            id: string;
            name: string;
        }
    };
}

// ... inside component ...


export default function ApprovalsPage() {
    const [requests, setRequests] = useState<VehicleRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Modal states
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showDenyModal, setShowDenyModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<VehicleRequest | null>(null);
    const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
    const [vehiclesLoading, setVehiclesLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [denyReason, setDenyReason] = useState('');

    useEffect(() => {
        loadRequests();
    }, []);

    async function loadRequests() {
        setLoading(true);
        try {
            const data = await getPendingRequests();
            setRequests(data);
        } catch (error) {
            console.error('Error loading requests:', error);
        } finally {
            setLoading(false);
        }
    }

    async function openApproveModal(request: VehicleRequest) {
        setSelectedRequest(request);
        setShowApproveModal(true);
        setVehiclesLoading(true);

        try {
            const vehicles = await getAvailableVehicles(
                request.model_id,
                request.pickup_datetime,
                request.return_datetime
            );
            setAvailableVehicles(vehicles);
        } catch (error) {
            console.error('Error loading vehicles:', error);
            setAvailableVehicles([]);
        } finally {
            setVehiclesLoading(false);
        }
    }

    async function handleApprove(vehicleId: string) {
        if (!selectedRequest) return;

        setActionLoading(true);
        try {
            const result = await approveRequest(selectedRequest.id, vehicleId);

            if (result.success) {
                setMessage({ type: 'success', text: 'Solicitação aprovada com sucesso!' });
                setShowApproveModal(false);
                setSelectedRequest(null);
                loadRequests();
            } else {
                setMessage({ type: 'error', text: result.error || 'Erro ao aprovar' });
            }
        } finally {
            setActionLoading(false);
        }
    }

    async function handleDeny() {
        if (!selectedRequest) return;

        setActionLoading(true);
        try {
            const result = await denyRequest(selectedRequest.id, denyReason);

            if (result.success) {
                setMessage({ type: 'success', text: 'Solicitação negada.' });
                setShowDenyModal(false);
                setSelectedRequest(null);
                setDenyReason('');
                loadRequests();
            } else {
                setMessage({ type: 'error', text: result.error || 'Erro ao negar' });
            }
        } finally {
            setActionLoading(false);
        }
    }

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
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                    <ClipboardList className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Aprovações</h1>
                    <p className="text-slate-400 mt-1">Gerencie solicitações de veículos pendentes</p>
                </div>
            </div>

            {/* Message Alert */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                    <button onClick={() => setMessage(null)} className="ml-auto">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Pending Requests */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                </div>
            ) : requests.length === 0 ? (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-12 text-center">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Nenhuma solicitação pendente</h3>
                    <p className="text-slate-400">
                        Todas as solicitações foram processadas.
                    </p>
                </div>
            ) : (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Solicitante</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Evento</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Modelo</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Período</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Condutor</th>
                                <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((request) => (
                                <tr key={request.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                                    <td className="py-4 px-6">
                                        <div>
                                            <p className="text-white font-medium">
                                                {(request.requester as any)?.first_name} {(request.requester as any)?.last_name}
                                            </p>
                                            <p className="text-xs text-slate-500">{(request.requester as any)?.email}</p>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <p className="text-white">{request.event_name}</p>
                                    </td>
                                    <td className="py-4 px-6">
                                        <p className="text-slate-300">
                                            {request.model_name || 'N/A'}
                                        </p>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="text-sm text-slate-400">
                                            <p>{formatDate(request.pickup_datetime)}</p>
                                            <p className="text-slate-500">até {formatDate(request.return_datetime)}</p>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <p className="text-slate-300">{request.driver_name}</p>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => openApproveModal(request)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm font-medium"
                                            >
                                                <Check className="w-4 h-4" />
                                                Aprovar
                                            </button>
                                            <button
                                                onClick={() => { setSelectedRequest(request); setShowDenyModal(true); }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium"
                                            >
                                                <X className="w-4 h-4" />
                                                Negar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Approve Modal */}
            {showApproveModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg">
                        <h3 className="text-xl font-bold text-white mb-2">Aprovar Solicitação</h3>
                        <p className="text-slate-400 mb-6">Selecione o veículo para atender esta solicitação:</p>

                        <div className="bg-slate-900/50 p-4 rounded-lg mb-6">
                            <p className="text-sm text-slate-400">Evento: <span className="text-white">{selectedRequest.event_name}</span></p>
                            <p className="text-sm text-slate-400">Período: <span className="text-white">{formatDate(selectedRequest.pickup_datetime)} → {formatDate(selectedRequest.return_datetime)}</span></p>
                        </div>

                        {vehiclesLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                            </div>
                        ) : availableVehicles.length === 0 ? (
                            <div className="text-center py-8">
                                <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                                <p className="text-slate-400">Nenhum veículo cadastrado no sistema.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                {availableVehicles.map((vehicle) => {
                                    const isMaintenance = ['AWAITING_REPAIR', 'IN_MAINTENANCE'].includes(vehicle.status);
                                    const isRequestedModel = selectedRequest?.model_id === vehicle.model_id;

                                    const statusLabel = vehicle.status === 'IN_MAINTENANCE' ? 'Em Manutenção' :
                                        vehicle.status === 'AWAITING_REPAIR' ? 'Aguardando Manutenção' : null;

                                    return (
                                        <button
                                            key={vehicle.id}
                                            onClick={() => handleApprove(vehicle.id)}
                                            disabled={actionLoading || !vehicle.isAvailable}
                                            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left group ${!vehicle.isAvailable
                                                ? 'bg-slate-900/30 border-slate-800 opacity-60 cursor-not-allowed'
                                                : isRequestedModel
                                                    ? 'bg-emerald-500/10 border-emerald-500/40 hover:bg-emerald-500/20'
                                                    : 'bg-slate-900/50 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                                                }`}
                                        >
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <p className={`font-bold transition-colors ${isRequestedModel ? 'text-emerald-400' : 'text-white'}`}>
                                                        {vehicle.model.brand.name} {vehicle.model.name}
                                                    </p>
                                                    {isRequestedModel && (
                                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500 text-white uppercase tracking-tighter">
                                                            Modelo Solicitado
                                                        </span>
                                                    )}
                                                    {!vehicle.isAvailable && (
                                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30 uppercase tracking-wide">
                                                            Ocupado
                                                        </span>
                                                    )}
                                                    {isMaintenance && (
                                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase tracking-wide">
                                                            <AlertCircle className="w-3 h-3" />
                                                            {statusLabel}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                                                    <span>Placa: <span className="text-slate-300">{vehicle.license_plate}</span></span>
                                                    <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                                                    <span>Cor: <span className="text-slate-300">{vehicle.color}</span></span>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                {actionLoading ? (
                                                    <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                                                ) : vehicle.isAvailable ? (
                                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500 transition-all">
                                                        <Check className={`w-5 h-5 ${isRequestedModel ? 'text-emerald-400' : 'text-slate-400'} group-hover:text-white transition-colors`} />
                                                    </div>
                                                ) : (
                                                    <X className="w-5 h-5 text-slate-700" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => { setShowApproveModal(false); setSelectedRequest(null); }}
                                className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Deny Modal */}
            {
                showDenyModal && selectedRequest && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
                            <h3 className="text-xl font-bold text-white mb-2">Negar Solicitação</h3>
                            <p className="text-slate-400 mb-6">Informe o motivo da negação:</p>

                            <textarea
                                value={denyReason}
                                onChange={(e) => setDenyReason(e.target.value)}
                                placeholder="Motivo da negação..."
                                rows={3}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-red-500/50 focus:border-red-500 outline-none resize-none"
                            />

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => { setShowDenyModal(false); setSelectedRequest(null); setDenyReason(''); }}
                                    className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeny}
                                    disabled={actionLoading}
                                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Negar Solicitação
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
