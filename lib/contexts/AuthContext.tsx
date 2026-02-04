'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        setProfile(data as UserProfile | null);
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
    };

    useEffect(() => {
        // Get initial session
        const initAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                setUser(user);
                await fetchProfile(user.id);
            }

            setIsLoading(false);
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    setUser(session.user);
                    await fetchProfile(session.user.id);
                } else {
                    setUser(null);
                    setProfile(null);
                }
                setIsLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const value: AuthContextType = {
        user,
        profile,
        isLoading,
        isAuthenticated: !!user,
        role: profile?.role || null,
        signOut: handleSignOut,
        refreshProfile,
    };

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

// Helper hook to check if user has specific role(s)
export function useHasRole(allowedRoles: UserRole[]): boolean {
    const { role } = useAuth();
    return role !== null && allowedRoles.includes(role);
}

// Helper hook to check if user is admin
export function useIsAdmin(): boolean {
    const { role } = useAuth();
    return role === 'admin';
}

// Helper hook to check if user is gestor or admin
export function useIsGestorOrAdmin(): boolean {
    const { role } = useAuth();
    return role === 'admin' || role === 'gestor';
}
