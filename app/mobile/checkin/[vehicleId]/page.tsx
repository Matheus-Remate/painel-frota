import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import CheckInForm from '@/components/mobile/checkin-form';

interface Props {
    params: Promise<{ vehicleId: string }>;
}

export default async function CheckInPage({ params }: Props) {
    const { vehicleId } = await params;
    const supabase = await createClient();

    const { data: vehicle, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();

    if (error || !vehicle) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-600 p-4">
            <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="text-center text-white mb-8 pt-8">
                    <h1 className="text-3xl font-bold mb-2">Check-in de Devolução</h1>
                    <div className="bg-white/20 backdrop-blur rounded-full px-6 py-3 inline-block">
                        <p className="text-xl font-semibold">{vehicle.license_plate}</p>
                        <p className="text-sm opacity-90">{vehicle.brand} {vehicle.model}</p>
                    </div>
                </div>

                {/* Formulário */}
                <CheckInForm vehicle={vehicle} />
            </div>
        </div>
    );
}
