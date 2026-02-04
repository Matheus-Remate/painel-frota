import { getVehicleDetails, getLastCheckin } from "@/lib/services/mobile";
import ReturnForm from "@/components/mobile/return-form";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ReturnPage({ params }: { params: { id: string } }) {
    const vehicle = await getVehicleDetails(params.id);
    if (!vehicle) notFound();

    const lastCheckin = await getLastCheckin(params.id);
    const lastOdometer = vehicle.odometer || (lastCheckin?.odometer || 0);

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href={`/mobile/vehicle/${params.id}`} className="p-2 -ml-2 text-slate-400 hover:text-white">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold">Devolução / Check-in</h1>
                    <p className="text-slate-400 text-sm">{vehicle.model.brand.name} {vehicle.model.name}</p>
                </div>
            </div>

            <ReturnForm vehicleId={params.id} lastOdometer={lastOdometer} />
        </div>
    );
}
