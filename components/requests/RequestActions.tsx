'use client';

import { useState } from 'react';
import { Edit, Trash2, Loader2, MoreVertical } from 'lucide-react';
import { deleteRequest } from '@/lib/services/requests';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RequestActions({ requestId, status, onChanged }: { requestId: string, status: string, onChanged?: () => void }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    if (status !== 'PENDING') return null;

    async function handleDelete() {
        setLoading(true);
        try {
            const result = await deleteRequest(requestId);
            if (result.success) {
                onChanged?.();
                router.refresh();
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao excluir solicitação');
        } finally {
            setLoading(false);
        }
    }

    if (showConfirm) {
        return (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                <span className="text-xs text-slate-300">Confirmar exclusão?</span>
                <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
                <button
                    onClick={() => setShowConfirm(false)}
                    disabled={loading}
                    className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md transition-colors"
                >
                    <span className="text-xs font-bold px-1">X</span>
                </button>
            </div>
        );
    }

    return (
        <div className="flex gap-2">
            <Link
                href={`/dashboard/requests/${requestId}/edit`}
                className="p-2 text-slate-400 hover:text-brand-400 hover:bg-brand/10 rounded-lg transition-colors border border-transparent hover:border-brand/20"
                title="Editar Solicitação"
            >
                <Edit className="w-4 h-4" />
            </Link>
            <button
                onClick={() => setShowConfirm(true)}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                title="Excluir Solicitação"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
}
