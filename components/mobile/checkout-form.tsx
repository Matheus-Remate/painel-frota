'use client';

import { registerCheckout } from '@/lib/services/mobile';
import { AlertCircle, Check, Gauge, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CheckoutForm({ vehicleId, token, lastOdometer }: { vehicleId: string; token: string; lastOdometer: number }) {
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

    async function submit(formData: FormData) {
        setSubmitting(true);
        setError(null);
        const result = await registerCheckout(formData);
        if (!result.success) {
            setError(result.error ?? 'Não foi possível registrar a retirada.');
            setSubmitting(false);
            return;
        }
        router.push(`/mobile/vehicle/${vehicleId}?token=${encodeURIComponent(token)}&checkout=success`);
        router.refresh();
    }

    return (
        <form action={submit} className="space-y-5">
            <input type="hidden" name="vehicleId" value={vehicleId} />
            <input type="hidden" name="token" value={token} />
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-5">
                <label className="block space-y-2">
                    <span className="flex items-center gap-2 text-sm font-medium"><User className="h-4 w-4 text-emerald-400" /> Nome completo</span>
                    <input name="driverName" required minLength={3} autoComplete="name" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-white outline-none focus:border-emerald-500" />
                </label>
                <label className="block space-y-2">
                    <span className="flex items-center gap-2 text-sm font-medium"><Gauge className="h-4 w-4 text-emerald-400" /> Odômetro na retirada</span>
                    <input name="odometer" type="number" required min={lastOdometer} defaultValue={lastOdometer} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 font-mono text-white outline-none focus:border-emerald-500" />
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm text-slate-300">
                    <input name="acknowledged" type="checkbox" required className="mt-1 size-4 accent-emerald-500" />
                    Conferi o combustível, o odômetro e os alertas exibidos da última devolução antes de iniciar o uso.
                </label>
            </div>
            {error && <div role="alert" className="flex gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}
            <button disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 font-bold text-white transition hover:bg-emerald-500 disabled:opacity-60">
                <Check className="h-5 w-5" /> {submitting ? 'Registrando...' : 'Confirmar retirada'}
            </button>
        </form>
    );
}
