'use client';

import { useSidebar } from "@/lib/contexts/SidebarContext";
import DashboardSidebar from "@/components/dashboard/sidebar";
import DashboardHeader from "@/components/dashboard/header";
import { User } from "@supabase/supabase-js";

interface DashboardClientLayoutProps {
    children: React.ReactNode;
    user: any; // Using any for profile extension
}

export default function DashboardClientLayout({ children, user }: DashboardClientLayoutProps) {
    const { isCollapsed } = useSidebar();

    return (
        <div className="min-h-screen bg-bg-body">
            <DashboardSidebar userRole={user.profile?.role || 'solicitante'} />
            <div className={`transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
                <DashboardHeader user={user} />
                <main className="p-4 sm:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
