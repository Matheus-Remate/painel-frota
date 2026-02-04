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

    const supabase = createClient();

    const fetchProfile = async (userId: string) => {
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
                console.log("Success: Profile loaded via RPC:", data.email);
                setProfile(data as UserProfile | null);
            }
        } catch (err) {
            console.error("Exception in fetchProfile:", err);
            setProfile(null);
        }
    };

    const refreshProfile = useCallback(async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    }, [user]);

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
                    // Critical: await profile so we have it before clearing loading
                    await fetchProfile(session.user.id);
                }
            } catch (err) {
                console.error("Auth init error:", err);
            } finally {
                // Guaranteed unblock
                if (mounted) setIsLoading(false);
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return;

                try {
                    if (session?.user) {
                        setUser(session.user);
                        // Always fetch profile on state change (login/session refresh)
                        await fetchProfile(session.user.id);
                    } else {
                        setUser(null);
                        setProfile(null);
                    }
                } catch (err) {
                    console.error("Auth change error:", err);
                } finally {
                    if (mounted) setIsLoading(false);
                }
            }
        );

        initAuth();

        // Safety timeout
        const timeout = setTimeout(() => {
            if (mounted && isLoading) {
                console.warn("Auth check timed out. Forcing UI load.");
                setIsLoading(false);
            }
        }, 5000);

        return () => {
            mounted = false;
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

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
