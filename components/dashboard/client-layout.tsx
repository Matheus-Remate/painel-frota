'use client';

import { useSidebar } from "@/lib/contexts/SidebarContext";
import DashboardSidebar from "@/components/dashboard/sidebar";
import DashboardHeader from "@/components/dashboard/header";
import type { AuthUser } from '@/lib/services/auth';
import type { FleetNotification } from '@/lib/services/notifications';

interface DashboardClientLayoutProps {
    children: React.ReactNode;
    user: AuthUser;
    notifications: FleetNotification[];
}

export default function DashboardClientLayout({ children, user, notifications }: DashboardClientLayoutProps) {
    const { isCollapsed } = useSidebar();

    return (
        <div className="min-h-screen bg-bg-body">
            <DashboardSidebar userRole={user.profile?.role || 'solicitante'} />
            <div className={`transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
                <DashboardHeader user={user} initialNotifications={notifications} />
                <main className="p-4 sm:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
