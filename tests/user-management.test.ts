import assert from 'node:assert/strict';
import test from 'node:test';

import {
    canAssignUserRole,
    canManageTargetUser,
    canManageUserAccounts,
    hasAdministrativeAccess,
    isUserRole,
    PROTECTED_ADMIN_ERROR,
    PROTECTED_ADMIN_DOWNGRADE_ERROR,
    protectedAccountDeletionError,
    protectedAccountRoleError,
} from '../lib/security/user-management.ts';

test('accepts only the roles defined by the profiles schema', () => {
    assert.equal(isUserRole('admin'), true);
    assert.equal(isUserRole('gestor'), true);
    assert.equal(isUserRole('solicitante'), true);
    assert.equal(isUserRole('owner'), false);
    assert.equal(isUserRole(null), false);
});

test('rejects every downgrade of a protected account', () => {
    assert.equal(protectedAccountRoleError(true, 'gestor'), PROTECTED_ADMIN_DOWNGRADE_ERROR);
    assert.equal(protectedAccountRoleError(true, 'solicitante'), PROTECTED_ADMIN_DOWNGRADE_ERROR);
    assert.equal(protectedAccountRoleError(true, 'admin'), null);
});

test('rejects deletion of the protected account before the Auth call', () => {
    assert.equal(protectedAccountDeletionError(true), PROTECTED_ADMIN_ERROR);
    assert.equal(protectedAccountDeletionError(false), null);
});

test('allows administrative operations only for the admin role', () => {
    assert.equal(hasAdministrativeAccess('admin'), true);
    assert.equal(hasAdministrativeAccess('gestor'), false);
    assert.equal(hasAdministrativeAccess('solicitante'), false);
    assert.equal(hasAdministrativeAccess(undefined), false);
});

test('allows gestores to manage only non-administrative accounts', () => {
    assert.equal(canManageUserAccounts('gestor'), true);
    assert.equal(canManageUserAccounts('solicitante'), false);
    assert.equal(canAssignUserRole('gestor', 'solicitante'), true);
    assert.equal(canAssignUserRole('gestor', 'gestor'), true);
    assert.equal(canAssignUserRole('gestor', 'admin'), false);
    assert.equal(canManageTargetUser('gestor', 'admin'), false);
    assert.equal(canManageTargetUser('gestor', null), false);
    assert.equal(canManageTargetUser('gestor', 'solicitante'), true);
    assert.equal(canAssignUserRole('admin', 'admin'), true);
});

test('does not restrict role changes for ordinary accounts', () => {
    assert.equal(protectedAccountRoleError(false, 'gestor'), null);
    assert.equal(protectedAccountRoleError(false, 'solicitante'), null);
});
