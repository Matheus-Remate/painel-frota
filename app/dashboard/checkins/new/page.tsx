import NewCheckinForm from "@/components/checkins/NewCheckinForm";
import { getVehicles } from "@/lib/services/dashboard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewCheckinPage() {
    const vehicles = await getVehicles();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/checkins"
                    className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Novo Check-in</h1>
                    <p className="text-slate-400 text-sm">Registre a devolução ou vistoria de um veículo</p>
                </div>
            </div>

            <NewCheckinForm vehicles={vehicles} />
        </div>
    );
}
