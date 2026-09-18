'use client';
import { registerEmergencyCheckout } from '@/lib/services/mobile';
import { AlertCircle, ArrowRight, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
export default function EmergencyCheckoutForm({ vehicleId, token }: { vehicleId: string; token: string }) {
    const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false); const router = useRouter();
    async function submit(formData: FormData) { setLoading(true); setError(null); const result = await registerEmergencyCheckout(formData); if (!result.success) { setError(result.error || 'Não foi possível registrar a retirada.'); setLoading(false); return; } router.replace(`/mobile/vehicle/${vehicleId}?token=${encodeURIComponent(token)}&mode=emergency&checkout=success`); router.refresh(); }
    return <form action={submit} className="space-y-5"><input type="hidden" name="vehicleId" value={vehicleId} /><input type="hidden" name="token" value={token} /><label className="block space-y-2"><span className="flex items-center gap-2 text-sm font-medium"><User className="size-4 text-emerald-400" />Nome do condutor</span><input name="driverName" required minLength={3} autoComplete="name" placeholder="Nome completo" className="w-full rounded-xl border border-slate-700 bg-slate-900 p-4 text-white outline-none focus:border-emerald-500" /></label>{error && <p role="alert" className="flex gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"><AlertCircle className="size-5 shrink-0" />{error}</p>}<button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 font-bold disabled:opacity-60"><ArrowRight className="size-5" />{loading ? 'Registrando...' : 'Confirmar retirada imediata'}</button></form>;
}
