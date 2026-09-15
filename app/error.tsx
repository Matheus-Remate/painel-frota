'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <main className="min-h-screen bg-slate-950 text-white grid place-items-center p-6">
            <section className="w-full max-w-lg rounded-2xl border border-red-500/20 bg-slate-900 p-8 text-center">
                <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-400" aria-hidden="true" />
                <h1 className="text-2xl font-bold">Não foi possível carregar esta tela</h1>
                <p className="mt-2 text-slate-400">Tente novamente. Se o problema continuar, informe o gestor do sistema.</p>
                <button onClick={reset} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 font-semibold hover:bg-brand-800">
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Tentar novamente
                </button>
            </section>
        </main>
    );
}
