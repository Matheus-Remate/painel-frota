'use client';

import { useState } from 'react';
import { Check, X, Clock, Calendar, Car, User, ArrowRight } from 'lucide-react';
import { approveRequest, denyRequest, type VehicleRequest } from '@/lib/services/requests';
import { useRouter } from 'next/navigation';

interface PendingApprovalsProps {
    requests: VehicleRequest[];
    vehicles: { id: string; model: string; license_plate: string; brand: string }[];
    reservations: any[];
}

export default function PendingApprovals({ requests: initialRequests, vehicles, reservations }: PendingApprovalsProps) {
    const router = useRouter();
    const [requests, setRequests] = useState(initialRequests);
    const [processing, setProcessing] = useState<string | null>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<Record<string, string>>({});

    // if (requests.length === 0) {
    //     return null;
    // }

    async function handleApprove(request: VehicleRequest) {
        // If no specific vehicle selected (and none assigned automatically), we need one.
        // For now, let's assume the user must select one if not pre-assigned.
        const vehicleId = selectedVehicle[request.id] || request.vehicle_id;

        if (!vehicleId) {
            alert('Por favor, selecione um veículo para aprovar.');
            return;
        }

        setProcessing(request.id);
        const result = await approveRequest(request.id, vehicleId);

        if (result.success) {
            setRequests(prev => prev.filter(r => r.id !== request.id));
            router.refresh();
        } else {
            alert(result.error);
        }
        setProcessing(null);
    }

    function checkAvailability(vehicleId: string, pickup: string, returnTime: string) {
        if (!reservations) return true;

        const start = new Date(pickup).getTime();
        const end = new Date(returnTime).getTime();

        const hasConflict = reservations.some(res => {
            if (res.vehicle_id !== vehicleId) return false;
            const resStart = new Date(res.start_date).getTime();
            const resEnd = new Date(res.end_date).getTime();
            return (start < resEnd && end > resStart);
        });

        return !hasConflict;
    }

    async function handleDeny(requestId: string) {
        const reason = prompt('Motivo da negação:');
        if (!reason) return;

        setProcessing(requestId);
        const result = await denyRequest(requestId, reason);

        if (result.success) {
            setRequests(prev => prev.filter(r => r.id !== requestId));
            router.refresh();
        } else {
            alert(result.error);
        }
        setProcessing(null);
    }

    return (
        <div className="mb-8 bg-slate-800/50 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>

            <div className="flex items-center gap-3 mb-6">
                <div className="bg-amber-500/20 p-2 rounded-lg">
                    <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Solicitações Pendentes</h2>
                    <p className="text-slate-400 text-sm">Aprove ou negue as novas reservas</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 gap-4">
                    {requests.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
                            <p className="text-lg font-medium">Sem reservas pendentes</p>
                            <p className="text-sm text-slate-500 mt-1">Novas solicitações aparecerão aqui</p>
                        </div>
                    ) : (
                        requests.map(request => (
                            <div key={request.id} className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 transition-all hover:bg-slate-900/80">
                                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">

                                    {/* Request Info */}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-bold text-white">{request.event_name}</span>
                                            {request.model_name && (
                                                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                                                    Pref: {request.model_name}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-brand-500" />
                                                <span>
                                                    {new Date(request.pickup_datetime).toLocaleString()}
                                                    <span className="mx-2 text-slate-600">➜</span>
                                                    {new Date(request.return_datetime).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-blue-500" />
                                                <span>Condutor: <span className="text-slate-200">{request.driver_name}</span></span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-slate-500" />
                                                <span>Solicitante: <span className="text-slate-200">{request.requester?.first_name}</span></span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
                                        <select
                                            className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-500/50 min-w-[250px]"
                                            value={selectedVehicle[request.id] || ''}
                                            onChange={(e) => setSelectedVehicle({ ...selectedVehicle, [request.id]: e.target.value })}
                                        >
                                            <option value="">Selecione um Veículo...</option>
                                            {vehicles.map(v => {
                                                const available = checkAvailability(v.id, request.pickup_datetime, request.return_datetime);
                                                return (
                                                    <option key={v.id} value={v.id} className={available ? "" : "text-red-500"}>
                                                        {available ? "" : "🔴 ! "} {v.brand} {v.model} - {v.license_plate}
                                                    </option>
                                                );
                                            })}
                                        </select>

                                        <button
                                            onClick={() => handleDeny(request.id)}
                                            disabled={processing === request.id}
                                            className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg transition-colors"
                                            title="Rejeitar"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>

                                        <button
                                            onClick={() => handleApprove(request)}
                                            disabled={processing === request.id || (!selectedVehicle[request.id])}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-emerald-500/20 disabled:shadow-none"
                                        >
                                            <Check className="w-5 h-5" />
                                            <span>Aprovar</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
