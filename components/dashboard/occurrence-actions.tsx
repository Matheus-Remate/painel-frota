'use client';

import { useState } from "react";
import { Calendar, Car, MoreVertical, Pencil, Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { deleteOccurrence } from "@/lib/services/occurrences";
import { useRouter } from "next/navigation";

interface OccurrenceActionsProps {
    id: string;
}

export default function OccurrenceActions({ id }: OccurrenceActionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    async function handleDelete() {
        if (!confirm("Tem certeza que deseja excluir esta ocorrência?")) return;

        setIsDeleting(true);
        const result = await deleteOccurrence(id);

        if (!result.success) {
            alert(result.error);
        } else {
            router.refresh();
        }
        setIsDeleting(false);
        setIsOpen(false);
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
                <MoreVertical className="w-5 h-5" />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    ></div>
                    <div className="absolute right-0 top-full mt-1 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20 py-1 overflow-hidden">
                        <Link
                            href={`/dashboard/occurrences/${id}/edit`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors w-full"
                        >
                            <Pencil className="w-4 h-4" />
                            Editar
                        </Link>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors w-full text-left"
                        >
                            <Trash2 className="w-4 h-4" />
                            {isDeleting ? "Excluindo..." : "Excluir"}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
