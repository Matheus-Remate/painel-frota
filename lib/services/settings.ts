'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { cache } from 'react';

// Types
export interface Brand {
    id: string;
    name: string;
}

export interface Model {
    id: string;
    brand_id: string;
    name: string;
    brand?: any;
}

export interface OccurrenceType {
    id: string;
    name: string;
}

export interface UsageCategory {
    id: string;
    name: string;
}

// ============ BRANDS ============

export const getBrands = cache(async (): Promise<Brand[]> => {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('brands')
        .select('id, name')
        .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
});

export async function createBrand(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get('name') as string;

    const { error } = await supabase
        .from('brands')
        .insert({ name });

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/settings');
    return { success: true };
}

export async function updateBrand(id: string, formData: FormData) {
    const supabase = await createClient();
    const name = formData.get('name') as string;

    const { error } = await supabase
        .from('brands')
        .update({ name })
        .eq('id', id);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/settings');
    return { success: true };
}

export async function deleteBrand(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/settings');
    return { success: true };
}

// ============ MODELS ============

export const getModels = cache(async (brandId?: string): Promise<Model[]> => {
    const supabase = await createClient();

    let query = supabase
        .from('models')
        .select(`
            id,
            brand_id,
            name,
            brand:brands(id, name)
        `)
        .order('name', { ascending: true });

    if (brandId) {
        query = query.eq('brand_id', brandId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
});

export async function createModel(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get('name') as string;
    const brandId = formData.get('brandId') as string;

    const { error } = await supabase
        .from('models')
        .insert({ name, brand_id: brandId });

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/settings');
    return { success: true };
}

export async function updateModel(id: string, formData: FormData) {
    const supabase = await createClient();
    const name = formData.get('name') as string;
    const brandId = formData.get('brandId') as string;

    const { error } = await supabase
        .from('models')
        .update({ name, brand_id: brandId })
        .eq('id', id);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/settings');
    return { success: true };
}

export async function deleteModel(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('models')
        .delete()
        .eq('id', id);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/settings');
    return { success: true };
}

// ============ USERS (Admin Only) ============

export const getUsers = cache(async () => {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name, email, role, avatar_url, created_at')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
});

export async function createUserAccount(formData: FormData) {
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
    const role = formData.get('role') as string;

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

    let targetUser = newUser?.user;

    if (createError) {
        // If user already exists in Auth, let's see if we can just sync the profile
        if (createError.message.includes('already been registered')) {
            const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
            targetUser = users.find(u => u.email === email) || null;

            if (!targetUser) {
                return { success: false, error: createError.message };
            }

            // Check if profile already exists
            const { data: existingProfile } = await adminClient
                .from('profiles')
                .select('id')
                .eq('user_id', targetUser.id)
                .single();

            if (existingProfile) {
                return { success: false, error: 'Este usuário já possui um perfil ativo.' };
            }

            // If we're here, user is in Auth but missing Profile (the "desync" case)
            console.log(`Synchronizing missing profile for existing auth user: ${email}`);
        } else {
            return { success: false, error: createError.message };
        }
    }

    if (!targetUser) {
        return { success: false, error: 'Erro ao identificar usuário para criação de perfil.' };
    }

    // Use upsert to handle race conditions with database triggers
    const { error: profileError } = await adminClient
        .from('profiles')
        .upsert({
            user_id: targetUser.id,
            email: email,
            first_name: firstName,
            last_name: lastName,
            role: role,
        }, { onConflict: 'user_id' });

    if (profileError) {
        console.error('Error creating/syncing profile:', profileError);
        return { success: false, error: 'Conta de acesso verificada, mas erro ao salvar perfil: ' + profileError.message };
    }

    revalidatePath('/dashboard/settings');
    return { success: true, userId: targetUser.id };
}

export async function updateUserAccount(userId: string, formData: FormData) {
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
        return { success: false, error: 'Apenas administradores podem gerenciar usuários.' };
    }

    const adminClient = createAdminClient();

    // Get the target profile to find the auth user_id
    const { data: targetProfile, error: profileError } = await adminClient
        .from('profiles')
        .select('user_id')
        .eq('id', userId)
        .single();

    if (profileError || !targetProfile) {
        return { success: false, error: 'Usuário não encontrado.' };
    }

    const authUserId = targetProfile.user_id;

    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const role = formData.get('role') as string;
    const password = formData.get('password') as string;

    // 1. Update Profile (Names and Role)
    const { error: updateProfileError } = await adminClient
        .from('profiles')
        .update({
            first_name: firstName,
            last_name: lastName,
            role: role
        })
        .eq('id', userId);

    if (updateProfileError) {
        return { success: false, error: 'Erro ao atualizar perfil: ' + updateProfileError.message };
    }

    // 2. Update Auth User (Metadata and optionally Password)
    const updateData: any = {
        user_metadata: {
            first_name: firstName,
            last_name: lastName,
            role: role
        }
    };

    if (password && password.length >= 8) {
        updateData.password = password;
    }

    const { error: updateAuthError } = await adminClient.auth.admin.updateUserById(
        authUserId,
        updateData
    );

    if (updateAuthError) {
        return { success: false, error: 'Perfil atualizado, mas erro ao atualizar dados de acesso: ' + updateAuthError.message };
    }

    revalidatePath('/dashboard/settings');
    return { success: true };
}

export async function updateUserRole(userId: string, newRole: string) {
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
        return { success: false, error: 'Apenas administradores podem alterar roles.' };
    }

    // Update using admin client to bypass RLS
    const adminClient = createAdminClient();

    const { error } = await adminClient
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/settings');
    return { success: true };
}

export async function deleteUser(userId: string) {
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
        return { success: false, error: 'Apenas administradores podem excluir usuários.' };
    }

    // Delete using admin client
    const adminClient = createAdminClient();

    // First get the auth user id from the profile id if passed (Wait, the UI passes profile.id? Or user_id?)
    // The UI `users` array is from `profiles` table.
    // So the `id` being passed is likely the profile `id`. But `deleteUser` needs the Auth User ID.
    // The `profiles` table has a `user_id` column. We need to fetch it if the input is profile id.
    // HOWEVER, in `getUsers`, we select `*` from profiles. Profile usually has `id` (uuid) and `user_id` (uuid).
    // Let's assume the UI passes the ID that matches `user_id` if we modify it, OR we look up the profile first.
    // Let's look at `getUsers`: returns `profiles` records.
    // In `UsersTab` component: `key={user.id}`. `user` is `UserProfile`.
    // The `UserProfile` interface usually has `id` (profile pk) and `user_id` (auth fk).
    // I should check `UserProfile` definition in `auth.ts` or `AuthContext.tsx`.
    // It has `id` and `user_id`.
    // The `deleteUser` method in Supabase Auth requires the Auth User ID.
    // So if the UI passes `profile.id`, I need to look up `user_id`.
    // BUT, simpler logic: The UI should probably interact with `profile.id` but we need `user_id` to delete from Auth.
    // Let's verify what `users.map` does in `page.tsx`. It uses `user.id` for key. That is profile id.
    // So `deleteUser` needs to take specific care.
    // Better yet, let's look up the profile by the passed ID to get the `user_id` before deleting.

    // Step 1: Get the profile to find the auth user_id
    const { data: targetProfile, error: profileError } = await adminClient
        .from('profiles')
        .select('user_id')
        .eq('id', userId)
        .single();

    if (profileError || !targetProfile) {
        // Fallback: maybe the ID passed WAS the user_id?
        // Let's try to delete directly if profile not found? No, safer to fail.
        return { success: false, error: 'Usuário não encontrado.' };
    }

    const authUserId = targetProfile.user_id;

    if (authUserId === user.id) {
        return { success: false, error: 'Você não pode excluir sua própria conta.' };
    }

    // Step 2: Delete from Auth (this usually cascades to profile if set up correctly, otherwise we delete profile too)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(authUserId);

    if (deleteError) {
        return { success: false, error: deleteError.message };
    }

    revalidatePath('/dashboard/settings');
    return { success: true };
}

// ============ OCCURRENCE TYPES ============

export const getOccurrenceTypes = cache(async () => {
    const supabase = await createClient();
    const { data } = await supabase.from('occurrence_types').select('id, name').order('name');
    return (data as OccurrenceType[]) || [];
});

export async function createOccurrenceType(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get('name') as string;

    const { error } = await supabase.from('occurrence_types').insert({ name });

    if (error) return { success: false, error: 'Erro ao criar tipo: ' + error.message };

    revalidatePath('/dashboard/settings');
    return { success: true };
}

export async function deleteOccurrenceType(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('occurrence_types').delete().eq('id', id);

    if (error) return { success: false, error: 'Erro ao excluir: ' + error.message };

    revalidatePath('/dashboard/settings');
    return { success: true };
}

// ============ USAGE CATEGORIES ============

export const getUsageCategories = cache(async (): Promise<UsageCategory[]> => {
    const supabase = await createClient();
    const { data } = await supabase.from('usage_categories').select('id, name').order('name');
    return (data as UsageCategory[]) || [];
});

export async function createUsageCategory(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get('name') as string;

    const { error } = await supabase.from('usage_categories').insert({ name });

    if (error) {
        if (error.code === '23505') {
            return { success: false, error: 'Esta categoria já existe.' };
        }
        return { success: false, error: 'Erro ao criar categoria: ' + error.message };
    }

    revalidatePath('/dashboard/settings');
    return { success: true };
}

export async function deleteUsageCategory(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('usage_categories').delete().eq('id', id);

    if (error) return { success: false, error: 'Erro ao excluir categoria: ' + error.message };

    revalidatePath('/dashboard/settings');
    return { success: true };
}
