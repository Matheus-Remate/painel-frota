interface SiteUrlOptions {
    requestOrigin?: string | null;
    configuredSiteUrl?: string | null;
    vercelProductionUrl?: string | null;
    vercelUrl?: string | null;
}

function normalizeSiteUrl(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    if (!trimmed) return null;

    const candidate = /^https?:\/\//i.test(trimmed)
        ? trimmed
        : `https://${trimmed}`;

    try {
        const url = new URL(candidate);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
        return url.origin;
    } catch {
        return null;
    }
}

export function resolveSiteUrl(options: SiteUrlOptions = {}): string {
    const candidates = [
        options.requestOrigin,
        options.configuredSiteUrl,
        options.vercelProductionUrl,
        options.vercelUrl,
    ];

    for (const candidate of candidates) {
        const normalized = normalizeSiteUrl(candidate);
        if (normalized) return normalized;
    }

    return 'http://localhost:3000';
}

export function getPasswordResetRedirectUrl(options: SiteUrlOptions = {}): string {
    return `${resolveSiteUrl(options)}/reset-password`;
}
