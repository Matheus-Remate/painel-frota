'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { cache } from 'react';

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

export interface AuthUser {
    id: string;
    email: string;
    profile: UserProfile | null;
}

/**
 * Sign in with email and password
 */
export async function signIn(formData: FormData) {
    const supabase = await createClient();

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    // Get user profile to determine redirect
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

    // Redirect based on role
    const redirectPath = profile?.role === 'solicitante'
        ? '/dashboard/requests'
        : '/dashboard';

    return { success: true, redirect: redirectPath };
}

/**
 * Sign out current user
 */
export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
}

/**
 * Request password reset
 */
export async function requestPasswordReset(formData: FormData) {
    const supabase = await createClient();
    const email = formData.get('email') as string;

    // Check if user exists
    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
        .from('profiles')
        .select('email')
        .eq('email', email)
        .single();

    if (!profile) {
        // Don't reveal if email exists for security
        return {
            success: true,
            message: 'Se o e-mail estiver cadastrado, você receberá um link de recuperação.'
        };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    });

    if (error) {
        console.error('Password reset error:', error);
        // Log for development since SMTP may not be configured
        console.log(`[DEV] Password reset requested for: ${email}`);
    }

    return {
        success: true,
        message: 'Se o e-mail estiver cadastrado, você receberá um link de recuperação.'
    };
}

/**
 * Update password (for logged in user or via reset token)
 */
export async function updatePassword(formData: FormData) {
    const supabase = await createClient();

    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
        return { success: false, error: 'As senhas não coincidem.' };
    }

    if (password.length < 8) {
        return { success: false, error: 'A senha deve ter pelo menos 8 caracteres.' };
    }

    const { error } = await supabase.auth.updateUser({
        password: password,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, message: 'Senha atualizada com sucesso!' };
}


/**
 * Get current authenticated user with profile
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    return {
        id: user.id,
        email: user.email!,
        profile: profile as UserProfile | null,
    };
});

/**
 * Update user profile
 */
export async function updateProfile(formData: FormData) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Usuário não autenticado.' };
    }

    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;

    const { error } = await supabase
        .from('profiles')
        .update({
            first_name: firstName,
            last_name: lastName,
            email: email,
        })
        .eq('user_id', user.id);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, message: 'Perfil atualizado com sucesso!' };
}

/**
 * Update user avatar
 */
export async function updateAvatar(formData: FormData) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Usuário não autenticado.' };
    }

    const file = formData.get('avatar') as File;
    if (!file || file.size === 0) {
        return { success: false, error: 'Nenhum arquivo selecionado.' };
    }

    // Upload to storage
    const fileName = `avatars/${user.id}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

    if (uploadError) {
        return { success: false, error: uploadError.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

    // Update profile
    const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, avatarUrl: publicUrl };
}

/**
 * Create new user (Admin only)
 */
export async function createUser(formData: FormData) {
    const supabase = await createClient();

    // Check if current user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Não autorizado.' };
    }

    const { data: currentProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

    if (currentProfile?.role !== 'admin') {
        return { success: false, error: 'Apenas administradores podem criar usuários.' };
    }

    // Create user with admin client
    const adminClient = createAdminClient();

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const role = formData.get('role') as UserRole;

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            first_name: firstName,
            last_name: lastName,
            role: role,
        },
    });

    if (createError) {
        return { success: false, error: createError.message };
    }

    return { success: true, userId: newUser.user.id };
}

/**
 * Get all users (Admin only)
 */
export async function getAllUsers() {
    const supabase = await createClient();

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    return profiles as UserProfile[];
}
