import { VehicleStatusCards } from '@/components/dashboard/vehicle-status-cards';
import PendingApprovals from '@/components/dashboard/pending-approvals';
import Link from 'next/link';
import GanttChart from '@/components/dashboard/gantt-chart';
import { getReservations } from "@/lib/services/schedule";
import { getVehicles } from "@/lib/services/dashboard";
import { getPendingRequests } from "@/lib/services/requests";
import { Suspense } from 'react';

// Specialized components for data fetching
async function PendingApprovalsSection() {
    const [reservations, vehiclesRaw, pendingRequests] = await Promise.all([
        getReservations(),
        getVehicles(),
        getPendingRequests()
    ]);

    const vehicles = vehiclesRaw.map(v => ({
        id: v.id,
        model: v.model?.name || v.model_name || v.model,
        license_plate: v.license_plate,
        brand: v.model?.brand?.name || v.brand,
        model_id: v.model_id
    }));

    return (
        <PendingApprovals
            requests={pendingRequests}
            vehicles={vehicles}
            reservations={reservations}
        />
    );
}

async function StatusCardsSection() {
    const [reservations, vehiclesRaw] = await Promise.all([
        getReservations(),
        getVehicles()
    ]);

    return <VehicleStatusCards vehicles={vehiclesRaw} reservations={reservations} />;
}

async function GanttChartSection() {
    const [reservations, vehiclesRaw] = await Promise.all([
        getReservations(),
        getVehicles()
    ]);

    const vehicles = vehiclesRaw.map(v => ({
        id: v.id,
        model: v.model?.name || v.model_name || v.model,
        license_plate: v.license_plate,
        brand: v.model?.brand?.name || v.brand,
        model_id: v.model_id
    }));

    return <GanttChart reservations={reservations} vehicles={vehicles} />;
}

// Loading Skeletons for sections
function SectionSkeleton({ height = 'h-48' }) {
    return <div className={`w-full ${height} bg-slate-800/30 animate-pulse rounded-3xl border border-slate-700/50`}></div>;
}

export default function DashboardPage() {
    return (
        <div className="w-full">
            <div className="container mx-auto py-2">
                {/* Header */}
                <header className="mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-[#990000] tracking-tight">
                            Controle de Frota
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
                            Gestão inteligente de veículos e condutores
                        </p>
                    </div>
                </header>

                {/* Pendências de Aprovação */}
                <Suspense fallback={<SectionSkeleton height="h-32" />}>
                    <PendingApprovalsSection />
                </Suspense>

                {/* Cards de Status */}
                <div className="mb-8 mt-6">
                    <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"><SectionSkeleton /><SectionSkeleton /><SectionSkeleton /><SectionSkeleton /></div>}>
                        <StatusCardsSection />
                    </Suspense>
                </div>

                {/* Gantt Chart Preview */}
                <div className="bg-bg-card backdrop-blur-sm border border-border rounded-3xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cronograma de Reservas</h2>
                        <Link href="/dashboard/schedule" className="text-sm font-semibold text-brand-900 hover:text-brand-800 transition-colors bg-brand-50 dark:bg-brand-900/10 px-3 py-1.5 rounded-lg">
                            Ver tela cheia →
                        </Link>
                    </div>
                    <Suspense fallback={<SectionSkeleton height="h-[300px]" />}>
                        <GanttChartSection />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
