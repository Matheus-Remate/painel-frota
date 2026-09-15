import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/services/auth';

export type AuthorizedUser = {
    id: string;
    profileId: string;
    role: UserRole;
};

export async function requireRole(allowedRoles: readonly UserRole[]) {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error('Não autenticado.');
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('user_id', user.id)
        .single();

    if (profileError || !profile || !allowedRoles.includes(profile.role as UserRole)) {
        throw new Error('Sem permissão para realizar esta ação.');
    }

    return { id: user.id, profileId: profile.id, role: profile.role as UserRole } satisfies AuthorizedUser;
}

export const requireManager = () => requireRole(['admin', 'gestor']);
export const requireAdministrator = () => requireRole(['admin']);
