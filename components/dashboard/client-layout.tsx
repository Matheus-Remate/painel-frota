'use client';

import DashboardHeader from "@/components/dashboard/header";
import type { AuthUser } from '@/lib/services/auth';
import type { FleetNotification } from '@/lib/services/notifications';

interface DashboardClientLayoutProps {
    children: React.ReactNode;
    user: AuthUser;
    notifications: FleetNotification[];
}

export default function DashboardClientLayout({ children, user, notifications }: DashboardClientLayoutProps) {
    return (
        <div className="min-h-screen bg-[#0b0f17] text-slate-100">
            <DashboardHeader user={user} initialNotifications={notifications} />
            <main className="mx-auto w-full max-w-[1920px] px-4 py-5 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}
