'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Wrench, Loader2, AlertTriangle } from 'lucide-react';
import { deleteVehicle } from '@/lib/actions/vehicles';

interface VehicleActionsProps {
    vehicleId: string;
    licensePlate: string;
}

export default function VehicleActions({ vehicleId, licensePlate }: VehicleActionsProps) {
    const router = useRouter();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDelete() {
        setDeleting(true);
        setError(null);

        try {
            const result = await deleteVehicle(vehicleId);
            if (result.success) {
                router.push('/dashboard/vehicles');
            } else {
                setError(result.error || 'Erro ao excluir veículo');
            }
        } catch {
            setError('Erro de conexão');
        } finally {
            setDeleting(false);
        }
    }

    return (
        <>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-white font-bold mb-4">Ações Rápidas</h3>
                <div className="space-y-3">
                    <Link
                        href={`/dashboard/vehicles/${vehicleId}/edit`}
                        className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                        <Pencil className="w-4 h-4" />
                        Editar Dados
                    </Link>
                    <Link href={`/dashboard/occurrences/new?vehicleId=${vehicleId}`} className="w-full bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2">
                        <Wrench className="w-4 h-4" />
                        Registrar ocorrência
                    </Link>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Excluir Veículo
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md mx-4">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-red-500/20 rounded-full">
                                <AlertTriangle className="w-6 h-6 text-red-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white mb-2">Excluir Veículo</h3>
                                <p className="text-slate-400 mb-4">
                                    Tem certeza que deseja excluir o veículo <span className="text-white font-mono font-bold">{licensePlate}</span>?
                                </p>
                                <p className="text-red-400 text-sm mb-4">
                                    O veículo sairá das telas operacionais, mas todo o histórico será preservado para auditoria.
                                </p>

                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4">
                                        {error}
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowDeleteModal(false)}
                                        disabled={deleting}
                                        className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {deleting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Arquivando...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4" />
                                                Confirmar arquivamento
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
