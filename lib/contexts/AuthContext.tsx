'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'gestor' | 'solicitante';

export interface UserProfile {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: UserRole;
    avatar_url: string | null;
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    role: UserRole | null;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [supabase] = useState(() => createClient());

    const fetchProfile = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .rpc('get_my_profile')
                .maybeSingle();

            if (error) {
                console.error("Critical: Error in get_my_profile RPC:", JSON.stringify(error, null, 2));
                setProfile(null);
            } else if (!data) {
                console.warn("Warning: get_my_profile returned no data for authenticated user.");
                setProfile(null);
            } else {
                const profileData = data as UserProfile;
                setProfile(profileData);
            }
        } catch (err) {
            console.error("Exception in fetchProfile:", err);
            setProfile(null);
        }
    }, [supabase]);

    const refreshProfile = useCallback(async () => {
        if (user) {
            await fetchProfile();
        }
    }, [user, fetchProfile]);

    const handleSignOut = useCallback(async () => {
        try {
            await supabase.auth.signOut();
        } finally {
            setUser(null);
            setProfile(null);
        }
    }, [supabase]);

    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            try {
                // Check session first
                const { data: { session } } = await supabase.auth.getSession();

                if (mounted && session?.user) {
                    setUser(session.user);
                    await fetchProfile();
                }
            } catch (err: any) {
                // Ignore AbortError in logs as it's common during HMR/Strict Mode
                if (err?.name !== 'AbortError') {
                    console.error("Auth init error:", err);
                }
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return;

                try {
                    if (session?.user) {
                        setUser(session.user);
                        await fetchProfile();
                    } else {
                        setUser(null);
                        setProfile(null);
                    }
                } catch (err: any) {
                    if (err?.name !== 'AbortError') {
                        console.error("Auth change error:", err);
                    }
                } finally {
                    if (mounted) setIsLoading(false);
                }
            }
        );

        initAuth();

        // Safety timeout (increased to 8s for slower environments)
        const timeout = setTimeout(() => {
            if (mounted) setIsLoading(false);
        }, 8000);

        return () => {
            mounted = false;
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, [fetchProfile, supabase]);

    const value = useMemo(() => ({
        user,
        profile,
        isLoading,
        isAuthenticated: !!user,
        role: profile?.role || null,
        signOut: handleSignOut,
        refreshProfile,
    }), [user, profile, isLoading, handleSignOut, refreshProfile]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function useHasRole(allowedRoles: UserRole[]): boolean {
    const { role } = useAuth();
    return role !== null && allowedRoles.includes(role);
}

export function useIsAdmin(): boolean {
    const { role } = useAuth();
    return role === 'admin';
}

export function useIsGestorOrAdmin(): boolean {
    const { role } = useAuth();
    return role === 'admin' || role === 'gestor';
}
