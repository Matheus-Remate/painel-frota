'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type FleetNotification = {
    id: string;
    type: 'vehicle_returned' | 'vehicle_issue' | 'vehicle_checkout';
    title: string;
    message: string;
    href: string;
    read_at: string | null;
    created_at: string;
};

export async function getNotifications(limit = 12): Promise<FleetNotification[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('fleet_notifications')
        .select('id, type, title, message, href, read_at, created_at')
        .eq('recipient_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(Math.min(Math.max(limit, 1), 30));

    if (error) return [];
    return (data || []) as FleetNotification[];
}

export async function markNotificationsRead() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Não autenticado.' };

    const { error } = await supabase
        .from('fleet_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_user_id', user.id)
        .is('read_at', null);

    if (error) return { success: false, error: 'Não foi possível atualizar as notificações.' };
    revalidatePath('/dashboard');
    return { success: true };
}
