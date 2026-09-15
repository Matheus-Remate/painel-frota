import { getCurrentUser } from "@/lib/services/auth";
import { redirect } from "next/navigation";
import DashboardClientLayout from "@/components/dashboard/client-layout";
import { getNotifications } from '@/lib/services/notifications';

export default async function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }
    const notifications = ['admin', 'gestor'].includes(user.profile?.role ?? '') ? await getNotifications() : [];

    return (
        <DashboardClientLayout user={user} notifications={notifications}>
            {children}
        </DashboardClientLayout>
    );
}
