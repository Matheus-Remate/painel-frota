'use client';

import { useState } from 'react';
import { Edit, Trash2, Loader2, MoreVertical, XCircle, CheckCircle } from 'lucide-react';
import { cancelReservation } from '@/lib/services/schedule';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ReservationActions({ id, status }: { id: string, status: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    if (status === 'CANCELLED' || status === 'COMPLETED') return null;

    async function handleCancel() {
        setLoading(true);
        try {
            const result = await cancelReservation(id);
            if (result.success) {
                // Router refresh handled by server action revalidatePath, 
                // but explicit refresh ensures client state sync if needed.
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao cancelar reserva');
        } finally {
            setLoading(false);
        }
    }

    if (showConfirm) {
        return (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                <span className="text-xs text-slate-300">Confirmar cancelamento?</span>
                <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
                    title="Confirmar Cancelamento"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
                <button
                    onClick={() => setShowConfirm(false)}
                    disabled={loading}
                    className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md transition-colors"
                    title="Voltar"
                >
                    <span className="text-xs font-bold px-1">X</span>
                </button>
            </div>
        );
    }

    return (
        <div className="flex gap-2 justify-end">
            <Link
                href={`/dashboard/schedule/${id}/edit`}
                className="p-2 text-slate-400 hover:text-brand-400 hover:bg-brand/10 rounded-lg transition-colors border border-transparent hover:border-brand/20"
                title="Editar Reserva"
            >
                <Edit className="w-4 h-4" />
            </Link>
            <button
                onClick={() => setShowConfirm(true)}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                title="Cancelar Reserva"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
}
