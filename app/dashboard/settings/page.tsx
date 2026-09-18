import {
    getBrands,
    getModels,
    getUsers,
    getOccurrenceTypes,
    getUsageCategories,
} from "@/lib/services/settings";
import { createClient } from "@/lib/supabase/server";
import { Settings } from "lucide-react";
import SettingsTabsContainer from "@/components/dashboard/settings-tabs-container";
import type { UserProfile } from "@/lib/services/auth";

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Server-side fetching with deduplication (via react.cache in services)
    const [brands, models, occurrenceTypes, usageCategories] = await Promise.all([
        getBrands(),
        getModels(),
        getOccurrenceTypes(),
        getUsageCategories(),
    ]);

    let users: UserProfile[] = [];
    let role = 'solicitante';

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        role = profile?.role || 'solicitante';

        if (role === 'admin' || role === 'gestor') {
            users = await getUsers();
        }
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/20 rounded-xl">
                    <Settings className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Configurações</h1>
                    <p className="text-slate-400 mt-1">Gerencie marcas, modelos e usuários do sistema</p>
                </div>
            </div>

            <SettingsTabsContainer
                initialData={{
                    brands,
                    models,
                    occurrenceTypes,
                    usageCategories,
                    users,
                    role
                }}
            />
        </div>
    );
}
