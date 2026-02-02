import { VehicleStatusCards } from '@/components/dashboard/vehicle-status-cards';
import Link from 'next/link';

export default async function DashboardPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                            Controle de Frota
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-2">
                            Gestão inteligente de veículos e condutores
                        </p>
                    </div>
                    <Link
                        href="/"
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors"
                    >
                        ← Voltar
                    </Link>
                </header>

                {/* Cards de Status */}
                <VehicleStatusCards />

                {/* Ações Rápidas */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link
                        href="/dashboard/vehicles"
                        className="block bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
                    >
                        <h3 className="text-lg font-semibold mb-2">Gerenciar Veículos</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Cadastre e edite veículos da frota
                        </p>
                    </Link>

                    <Link
                        href="/dashboard/drivers"
                        className="block bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
                    >
                        <h3 className="text-lg font-semibold mb-2">Gerenciar Condutores</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Cadastre e edite condutores autorizados
                        </p>
                    </Link>

                    <Link
                        href="/dashboard/checkins"
                        className="block bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
                    >
                        <h3 className="text-lg font-semibold mb-2">Histórico de Check-ins</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Visualize todos os check-ins realizados
                        </p>
                    </Link>
                </div>

                {/* Placeholder Gantt */}
                <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
                    <h2 className="text-2xl font-semibold mb-4">Cronograma de Reservas</h2>
                    <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-12 text-center text-slate-500">
                        <p className="text-lg">Calendário Gantt será implementado em próxima fase</p>
                        <p className="text-sm mt-2">Utilize biblioteca react-gantt-chart ou dhtmlx/gantt</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
