
import { getDriverById } from "@/lib/services/dashboard";
import { DriverForm } from "@/components/dashboard/driver-form";
import { getAllUsers } from "@/lib/services/auth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

interface EditDriverPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function EditDriverPage({ params }: EditDriverPageProps) {
    const { id } = await params;

    // Parallel data fetching for better performance
    const [driver, users] = await Promise.all([
        getDriverById(id),
        getAllUsers()
    ]);

    if (!driver) {
        notFound();
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/drivers"
                    className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Editar Condutor</h1>
                    <p className="text-slate-400 text-sm">Atualize os dados do motorista</p>
                </div>
            </div>

            <DriverForm initialData={driver} users={users} />
        </div>
    );
}
