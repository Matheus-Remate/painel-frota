import Link from "next/link";
import { Plus, Search, User, Calendar, ArrowLeft, CarFront, ShieldCheck, Users } from "lucide-react";
import { getDrivers } from "@/lib/services/dashboard";
import { Suspense } from "react";

async function DriverList({ query }: { query: string }) {
    const drivers = await getDrivers();
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    const filteredDrivers = drivers.filter((driver) => `${driver.name} ${driver.cpf} ${driver.cnh_category}`.toLocaleLowerCase('pt-BR').includes(normalized));

    return (
        <div className="ops-panel overflow-hidden">
            <div className="grid gap-3 border-b border-[#26344d] p-4 sm:grid-cols-3"><div className="ops-card flex items-center gap-3 p-3"><Users className="size-4 text-sky-300" /><div><p className="ops-label">Cadastrados</p><p className="text-lg font-bold text-white">{drivers.length}</p></div></div><div className="ops-card flex items-center gap-3 p-3"><ShieldCheck className="size-4 text-emerald-300" /><div><p className="ops-label">CNH válida</p><p className="text-lg font-bold text-white">{drivers.filter(driver => new Date(driver.cnh_expiration) >= new Date()).length}</p></div></div><div className="ops-card flex items-center gap-3 p-3"><CarFront className="size-4 text-amber-300" /><div><p className="ops-label">Atenção CNH</p><p className="text-lg font-bold text-white">{drivers.filter(driver => new Date(driver.cnh_expiration) < new Date()).length}</p></div></div></div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-[#26344d] bg-[#0b111c]">
                            <th className="p-4 font-medium text-slate-400">Nome</th>
                            <th className="p-4 font-medium text-slate-400">CPF</th>
                            <th className="p-4 font-medium text-slate-400">Categoria CNH</th>
                            <th className="p-4 font-medium text-slate-400">Validade CNH</th>
                            <th className="p-4 font-medium text-slate-400 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#26344d]">
                        {filteredDrivers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500">
                                    Nenhum condutor encontrado.
                                </td>
                            </tr>
                        ) : (
                            filteredDrivers.map((driver) => (
                                <tr key={driver.id} className="transition-colors hover:bg-[#182232]">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-10 items-center justify-center rounded-full border border-[#334460] bg-[#141e2e] text-sky-300">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <span className="font-medium text-white">{driver.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-300 font-mono text-sm">{driver.cpf}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded bg-slate-700 text-slate-300 text-xs font-bold border border-slate-600">
                                            {driver.cnh_category}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-300">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4 text-slate-500" />
                                            {new Date(driver.cnh_expiration).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <Link
                                            href={`/dashboard/drivers/${driver.id}/edit`}
                                            className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
                                        >
                                            Editar
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function DriverSkeleton() {
    return (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden animate-pulse">
            <div className="h-12 bg-slate-800/80 border-b border-slate-700/50"></div>
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 border-b border-slate-700/50 flex items-center px-4 gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-700"></div>
                    <div className="w-1/4 h-4 bg-slate-700 rounded"></div>
                    <div className="w-1/6 h-4 bg-slate-700 rounded"></div>
                    <div className="w-12 h-6 bg-slate-700 rounded"></div>
                    <div className="flex-1"></div>
                    <div className="w-16 h-4 bg-slate-700 rounded"></div>
                </div>
            ))}
        </div>
    );
}

export default async function DriversPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
    const { q = '' } = await searchParams;
    return (
        <div className="space-y-6">
            <div className="ops-panel flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <p className="ops-label">Operação</p><h1 className="text-2xl font-bold tracking-tight text-white">Condutores</h1>
                        <p className="mt-1 text-sm text-slate-400">Documentação e acesso rápido aos motoristas autorizados.</p>
                    </div>
                </div>
                <Link
                    href="/dashboard/drivers/new"
                    className="bg-brand hover:bg-brand-950 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-lg shadow-brand/20"
                >
                    <Plus className="w-4 h-4" />
                    Novo Condutor
                </Link>
            </div>

            <form className="ops-panel flex flex-col gap-4 p-4 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        name="q"
                        defaultValue={q}
                        placeholder="Buscar por nome, CPF ou CNH..."
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50"
                    />
                </div>
                <button className="rounded-lg bg-brand px-5 py-2 font-medium text-white">Buscar</button>
            </form>

            <Suspense fallback={<DriverSkeleton />}>
                <DriverList query={q} />
            </Suspense>
        </div>
    );
}
