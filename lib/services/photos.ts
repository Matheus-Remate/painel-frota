import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

const CHECKIN_BUCKET = 'checkin-photos';

type ChecklistEntry = {
    status?: string;
    notes?: string;
    photoPath?: string;
    photoUrl?: string;
};

export type ChecklistSnapshot = Record<string, ChecklistEntry | string>;

export async function createCheckinPhotoUrl(path: string) {
    const admin = createAdminClient();
    const { data, error } = await admin.storage
        .from(CHECKIN_BUCKET)
        .createSignedUrl(path, 60 * 60);

    return error ? null : data.signedUrl;
}

export async function signChecklistPhotos(checklist: unknown): Promise<ChecklistSnapshot> {
    if (!checklist || typeof checklist !== 'object' || Array.isArray(checklist)) return {};

    const entries = await Promise.all(
        Object.entries(checklist as ChecklistSnapshot).map(async ([key, value]) => {
            if (!value || typeof value !== 'object' || Array.isArray(value)) {
                return [key, value] as const;
            }
            const legacyPath = value.photoUrl?.split('/storage/v1/object/public/checkin-photos/')[1];
            const path = value.photoPath || legacyPath;
            if (!path) return [key, value] as const;
            const signedUrl = await createCheckinPhotoUrl(decodeURIComponent(path));
            return [key, { ...value, photoUrl: signedUrl || undefined }] as const;
        }),
    );

    return Object.fromEntries(entries);
}

export async function signCheckinPhotos(paths: string[] | null | undefined, legacyUrls: string[] | null | undefined) {
    const normalizedPaths = paths?.length
        ? paths
        : (legacyUrls ?? []).map((url) => url.split('/storage/v1/object/public/checkin-photos/')[1]).filter(Boolean).map(decodeURIComponent);
    const urls = await Promise.all(normalizedPaths.map(createCheckinPhotoUrl));
    return urls.filter((url): url is string => Boolean(url));
}

export { CHECKIN_BUCKET };
