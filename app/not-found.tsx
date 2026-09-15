import Link from 'next/link';
import { SearchX } from 'lucide-react';

export default function NotFound() {
    return (
        <main className="min-h-screen bg-slate-950 text-white grid place-items-center p-6">
            <section className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
                <SearchX className="mx-auto mb-4 h-12 w-12 text-slate-400" aria-hidden="true" />
                <h1 className="text-2xl font-bold">Página ou veículo não encontrado</h1>
                <p className="mt-2 text-slate-400">Confira o endereço ou leia novamente o QR Code fixado no veículo.</p>
                <Link href="/login" className="mt-6 inline-flex rounded-lg bg-brand px-5 py-3 font-semibold hover:bg-brand-800">Ir para o login</Link>
            </section>
        </main>
    );
}
