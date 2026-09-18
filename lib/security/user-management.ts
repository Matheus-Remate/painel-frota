export const USER_ROLES = ['admin', 'gestor', 'solicitante'] as const;
export type ManagedUserRole = (typeof USER_ROLES)[number];

export const PROTECTED_ADMIN_ERROR =
    'Este administrador é uma conta protegida e não pode ser excluído.';

export const PROTECTED_ADMIN_DOWNGRADE_ERROR =
    'O administrador principal deve permanecer com o nível de acesso admin.';

export function isUserRole(value: unknown): value is ManagedUserRole {
    return typeof value === 'string' && USER_ROLES.includes(value as ManagedUserRole);
}

export function hasAdministrativeAccess(role: unknown) {
    return role === 'admin';
}

export function canManageUserAccounts(role: unknown) {
    return role === 'admin' || role === 'gestor';
}

export function canAssignUserRole(actorRole: unknown, assignedRole: unknown) {
    return isUserRole(assignedRole) &&
        (actorRole === 'admin' || (actorRole === 'gestor' && assignedRole !== 'admin'));
}

export function canManageTargetUser(actorRole: unknown, targetRole: unknown) {
    return actorRole === 'admin' ||
        (actorRole === 'gestor' && (targetRole === 'gestor' || targetRole === 'solicitante'));
}

export function protectedAccountDeletionError(isProtected: boolean) {
    return isProtected ? PROTECTED_ADMIN_ERROR : null;
}

export function protectedAccountRoleError(isProtected: boolean, role: unknown) {
    return isProtected && role !== 'admin' ? PROTECTED_ADMIN_DOWNGRADE_ERROR : null;
}
