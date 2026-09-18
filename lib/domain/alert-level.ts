export type AlertLevel = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export function blocksTravel(level: string | null | undefined) {
    return level === 'URGENT' || level === 'HIGH';
}

export function requiresReleaseDeclaration(previous: string | null | undefined, next: string) {
    return blocksTravel(previous) && !blocksTravel(next);
}
