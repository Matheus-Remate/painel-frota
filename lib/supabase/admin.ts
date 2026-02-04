import { createClient } from '@supabase/supabase-js';

// Cliente Admin para operações que bypassam RLS (apenas server-side)
export const createAdminClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Fallback temporário, mas ideal é Service Role
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
};
