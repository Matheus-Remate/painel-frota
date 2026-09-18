type Relation<T> = T | T[] | null | undefined;

function first<T>(value: Relation<T>): T | undefined {
    return Array.isArray(value) ? value[0] : value || undefined;
}

/** The one vehicle name rule used throughout the operational interface. */
export function vehicleLabel(vehicle: any, fallback = 'Veículo sem modelo') {
    const model = first(vehicle?.model);
    const brand = first(model?.brand);
    const base = [brand?.name || vehicle?.brand, model?.name || vehicle?.model_name || (typeof vehicle?.model === 'string' ? vehicle.model : '')]
        .filter(Boolean)
        .join(' ')
        .trim() || fallback;
    return vehicle?.nickname ? `${base} (${vehicle.nickname})` : base;
}

export function vehicleStatusMeta(status?: string) {
    switch (status) {
        case 'ON_ROUTE': return { label: 'EM USO', className: 'ops-status ops-status-route' };
        case 'AWAITING_REPAIR': return { label: 'BLOQUEADO', className: 'ops-status ops-status-alert' };
        case 'IN_MAINTENANCE': return { label: 'EM MANUTENÇÃO', className: 'ops-status ops-status-maintenance' };
        default: return { label: 'NO PÁTIO', className: 'ops-status ops-status-yard' };
    }
}
