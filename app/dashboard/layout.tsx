import { getCurrentUser } from "@/lib/services/auth";
import { redirect } from "next/navigation";
import DashboardClientLayout from "@/components/dashboard/client-layout";

export default async function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <DashboardClientLayout user={user}>
            {children}
        </DashboardClientLayout>
    );
}
