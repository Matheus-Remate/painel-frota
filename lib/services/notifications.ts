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

    const regular = error ? [] : (data || []) as FleetNotification[];
    const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).maybeSingle();
    if (profile?.role !== 'gestor' && profile?.role !== 'admin') return regular;

    // Derived on each read: it cannot be dismissed while an urgent vehicle still has a near reservation.
    const now = new Date();
    const horizon = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const [{ data: urgent }, { data: urgentOccurrences }, { data: upcoming }] = await Promise.all([
        supabase.from('check_ins').select('id, vehicle_id, vehicle:vehicles(license_plate)')
            .eq('has_issues', true).eq('resolved', false).eq('alert_level', 'URGENT').limit(30),
        supabase.from('occurrences').select('id, vehicle_id, vehicle:vehicles(license_plate)')
            .neq('status', 'RESOLVED').eq('alert_level', 'URGENT').limit(30),
        supabase.from('reservations').select('vehicle_id, start_date').eq('status', 'ACTIVE')
            .gte('end_date', now.toISOString()).lte('start_date', horizon.toISOString()).limit(100),
    ]);
    const urgentItems = [...(urgent || []), ...(urgentOccurrences || [])];
    const urgentReminders: FleetNotification[] = urgentItems.flatMap((item) => {
        const next = (upcoming || []).find((booking) => booking.vehicle_id === item.vehicle_id);
        if (!next) return [];
        const vehicle = Array.isArray(item.vehicle) ? item.vehicle[0] : item.vehicle;
        return [{
            id: `urgent-${item.id}`, type: 'vehicle_issue' as const,
            title: 'Urgência com reserva próxima',
            message: `${vehicle?.license_plate || 'Veículo'} tem urgência aberta e reserva em ${new Date(next.start_date).toLocaleString('pt-BR')}. Reclassifique com declaração ou providencie outro veículo.`,
            href: '/dashboard/checkins', read_at: null, created_at: now.toISOString(),
        }];
    });
    return [...urgentReminders, ...regular].slice(0, Math.min(Math.max(limit, 1), 30));
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
