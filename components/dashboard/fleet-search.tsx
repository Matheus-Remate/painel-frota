'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, CarFront, Loader2, Search, UserRound } from 'lucide-react';
import { searchFleet, type FleetSearchResult } from '@/lib/services/dashboard';

export default function FleetSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<FleetSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const root = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const close = (event: MouseEvent) => { if (root.current && !root.current.contains(event.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    useEffect(() => {
        const term = query.trim();
        if (term.length < 2) { setResults([]); setLoading(false); return; }
        const timer = window.setTimeout(async () => {
            setLoading(true);
            try { setResults(await searchFleet(term)); setOpen(true); } catch { setResults([]); }
            finally { setLoading(false); }
        }, 250);
        return () => window.clearTimeout(timer);
    }, [query]);

    return <div ref={root} className="relative ml-auto hidden max-w-xl flex-1 md:block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={query} onFocus={() => query.trim().length >= 2 && setOpen(true)} onChange={event => setQuery(event.target.value)} aria-label="Busca global" placeholder="Buscar placa, modelo, evento ou condutor..." className="w-full rounded-lg border border-[#232f45] bg-[#182232] py-2 pl-10 pr-10 text-xs text-slate-100 outline-none placeholder:text-slate-500 focus:border-red-700 focus:ring-1 focus:ring-red-900" />
        {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />}
        {open && query.trim().length >= 2 && <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-[#334460] bg-[#182232] shadow-2xl"><p className="border-b border-[#232f45] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Resultados avançados</p>{results.length ? results.map(result => { const Icon = result.kind === 'vehicle' ? CarFront : result.kind === 'reservation' ? CalendarDays : UserRound; return <Link key={`${result.kind}-${result.id}`} href={result.href} onClick={() => setOpen(false)} className="flex items-center gap-3 border-b border-[#232f45]/70 px-3 py-2.5 hover:bg-[#1e2b3e]"><span className="rounded-md bg-slate-800 p-1.5"><Icon className="h-4 w-4 text-slate-300" /></span><span><span className="block text-xs font-semibold text-slate-100">{result.title}</span><span className="ops-mono block text-[10px] text-slate-400">{result.subtitle}</span></span></Link>; }) : !loading && <p className="px-3 py-4 text-center text-xs text-slate-400">Nenhum resultado para “{query}”.</p>}</div>}
    </div>;
}
