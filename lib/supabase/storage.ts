import { createClient } from './client';

const BUCKET_NAME = 'vehicle-photos';

export async function uploadPhoto(file: File, checkInId: string): Promise<{ url: string; path: string }> {
    const supabase = createClient();

    const fileExt = file.name.split('.').pop();
    const fileName = `${checkInId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file);

    if (error) throw error;

    // Obtém URL pública
    const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

    return { url: publicUrl, path: data.path };
}

export async function deletePhoto(path: string) {
    const supabase = createClient();

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([path]);

    if (error) throw error;
}
