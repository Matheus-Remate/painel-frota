import Link from "next/link";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { getCheckins } from "@/lib/services/dashboard";
import CheckinsList from "@/components/dashboard/checkins-list";
import { createClient } from "@/lib/supabase/server";

export default async function CheckinsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get profile and checkins in parallel
    const [allCheckins, { data: profile }] = await Promise.all([
        getCheckins(),
        supabase.from('profiles').select('role').eq('user_id', user?.id).single()
    ]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Revisão e Alertas</h1>
                        <p className="text-slate-400 mt-1">Gerencie alertas de veículos e histórico de check-ins</p>
                    </div>
                </div>

                <Link
                    href="/dashboard/checkins/new"
                    className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-950 text-white rounded-lg font-medium transition-colors shadow-lg shadow-brand/20"
                >
                    <CheckCircle className="w-5 h-5" />
                    Novo Check-in
                </Link>
            </div>

            <CheckinsList initialCheckins={allCheckins} userRole={profile?.role || 'solicitante'} />
        </div>
    );
}
