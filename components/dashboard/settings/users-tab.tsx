'use client';

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { createUserAccount, updateUserAccount, updateUserRole, deleteUser } from "@/lib/services/settings";
import type { UserProfile } from "@/lib/services/auth";

interface UsersTabProps {
    initialUsers: UserProfile[];
}

export function UsersTab({ initialUsers }: UsersTabProps) {
    const [users, setUsers] = useState<UserProfile[]>(initialUsers);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        try {
            const result = editingUser
                ? await updateUserAccount(editingUser.id, formData)
                : await createUserAccount(formData);

            if (result.success) {
                setMessage({ type: 'success', text: editingUser ? 'Usuário atualizado!' : 'Usuário criado com sucesso!' });
                setShowModal(false);
                setEditingUser(null);
                window.location.reload();
            } else {
                setMessage({ type: 'error', text: result.error || 'Erro ao processar usuário' });
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleRoleChange(userId: string, newRole: string) {
        try {
            const result = await updateUserRole(userId, newRole);
            if (result.success) {
                setMessage({ type: 'success', text: 'Nível de acesso atualizado!' });
                window.location.reload();
            } else {
                setMessage({ type: 'error', text: result.error || 'Erro ao atualizar nível de acesso' });
            }
        } catch (error) {
            console.error('Error updating role:', error);
            setMessage({ type: 'error', text: 'Erro ao conectar ao servidor' });
        }
    }

    async function handleDeleteUser(userId: string) {
        if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) return;

        const result = await deleteUser(userId);
        if (result.success) {
            setMessage({ type: 'success', text: 'Usuário excluído com sucesso!' });
            window.location.reload();
        } else {
            setMessage({ type: 'error', text: result.error || 'Erro ao excluir usuário' });
        }
    }

    const roleColors: Record<string, string> = {
        admin: 'bg-amber-500/20 text-amber-400',
        gestor: 'bg-blue-500/20 text-blue-400',
        solicitante: 'bg-slate-700 text-slate-300',
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white">Gestão de Usuários</h3>
                <button
                    onClick={() => { setEditingUser(null); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Novo Usuário
                </button>
            </div>

            {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {message.text}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700">
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Usuário</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">E-mail</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Nível de Acesso</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="border-b border-slate-700/50">
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white text-xs font-bold">
                                                {user.first_name[0]}{user.last_name[0]}
                                            </div>
                                        )}
                                        <span className="text-white font-medium">{user.first_name} {user.last_name}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-slate-400">{user.email}</td>
                                <td className="py-3 px-4">
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold border-none cursor-pointer ${roleColors[user.role]}`}
                                    >
                                        <option value="admin">Administrador</option>
                                        <option value="gestor">Gestor</option>
                                        <option value="solicitante">Solicitante</option>
                                    </select>
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => { setEditingUser(user); setShowModal(true); }}
                                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                            title="Editar Usuário"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Excluir Usuário"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">
                            {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                        </h3>
                        <form action={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Nome</label>
                                    <input
                                        name="firstName"
                                        defaultValue={editingUser?.first_name}
                                        required
                                        placeholder="Nome"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Sobrenome</label>
                                    <input
                                        name="lastName"
                                        defaultValue={editingUser?.last_name}
                                        required
                                        placeholder="Sobrenome"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">E-mail</label>
                                <input
                                    name="email"
                                    type="email"
                                    defaultValue={editingUser?.email}
                                    disabled={!!editingUser}
                                    required
                                    placeholder="email@exemplo.com"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    {editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha Inicial'}
                                </label>
                                <input
                                    name="password"
                                    type="password"
                                    required={!editingUser}
                                    minLength={8}
                                    placeholder={editingUser ? "Alterar senha" : "Mínimo 8 caracteres"}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Nível de Acesso</label>
                                <select
                                    name="role"
                                    defaultValue={editingUser?.role || 'solicitante'}
                                    required
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none"
                                >
                                    <option value="solicitante">Solicitante</option>
                                    <option value="gestor">Gestor</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setEditingUser(null); }}
                                    className="flex-1 px-4 py-2.5 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-lg shadow-emerald-500/20 transition-all"
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
