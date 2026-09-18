'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

export default function VehicleFilters({ initialQuery, initialStatus }: { initialQuery: string; initialStatus: string }) {
    const router = useRouter(); const pathname = usePathname(); const params = useSearchParams();
    const [query, setQuery] = useState(initialQuery); const [status, setStatus] = useState(initialStatus);
    useEffect(() => { const timer = window.setTimeout(() => { const next = new URLSearchParams(params.toString()); query.trim() ? next.set('q', query.trim()) : next.delete('q'); status ? next.set('status', status) : next.delete('status'); router.replace(`${pathname}${next.toString() ? `?${next}` : ''}`); }, 250); return () => window.clearTimeout(timer); }, [query, status, pathname, router, params]);
    return <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 p-4 rounded-xl flex flex-col sm:flex-row gap-4"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por placa, modelo ou chassi..." className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50" /></div><select value={status} onChange={event => setStatus(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-slate-300"><option value="">Todos os status</option><option value="IN_YARD">No pátio</option><option value="ON_ROUTE">Em uso</option><option value="AWAITING_REPAIR">Bloqueado para revisão</option><option value="IN_MAINTENANCE">Em manutenção</option></select></div>;
}
