import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DriverForm } from "@/components/dashboard/driver-form";
import { getAllUsers } from "@/lib/services/auth";

export default async function NewDriverPage() {
    const users = await getAllUsers();
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
                    <h1 className="text-2xl font-bold text-white">Novo Condutor</h1>
                    <p className="text-slate-400 text-sm">Registre um novo motorista autorizado</p>
                </div>
            </div>

            <DriverForm users={users} />
        </div>
    );
}
