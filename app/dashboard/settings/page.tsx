'use client';

import { useState, useEffect } from "react";
import {
    Settings,
    Tag,
    Car,
    Users,
    Plus,
    Pencil,
    Trash2,
    Loader2,
    AlertCircle,
    CheckCircle,
    X,
    ClipboardList
} from "lucide-react";
import {
    getBrands,
    getModels,
    getUsers,
    createBrand,
    updateBrand,
    deleteBrand,
    createModel,
    updateModel,
    deleteModel,
    createUserAccount,
    updateUserAccount,
    updateUserRole,
    deleteUser,
    getOccurrenceTypes,
    createOccurrenceType,
    deleteOccurrenceType,
    getUsageCategories,
    createUsageCategory,
    deleteUsageCategory,
    type Brand,
    type Model,
    type OccurrenceType,
    type UsageCategory
} from "@/lib/services/settings";
import type { UserProfile } from "@/lib/services/auth";
import { useAuth } from "@/lib/contexts/AuthContext";

type Tab = 'brands' | 'models' | 'users' | 'occurrence_types' | 'usage_categories';

export default function SettingsPage() {
    const { profile, isLoading: authLoading } = useAuth();
    const isAdmin = profile?.role === 'admin';
    const isGestor = profile?.role === 'gestor' || isAdmin;

    const [activeTab, setActiveTab] = useState<Tab>('brands');
    const [brands, setBrands] = useState<Brand[]>([]);
    const [models, setModels] = useState<Model[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [occurrenceTypes, setOccurrenceTypes] = useState<OccurrenceType[]>([]);
    const [usageCategories, setUsageCategories] = useState<UsageCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Modal states
    const [showBrandModal, setShowBrandModal] = useState(false);
    const [showModelModal, setShowModelModal] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [editingModel, setEditingModel] = useState<Model | null>(null);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [showOccurrenceTypeModal, setShowOccurrenceTypeModal] = useState(false);
    const [showUsageCategoryModal, setShowUsageCategoryModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [brandsData, modelsData, occurrenceTypesData, usageCategoriesData] = await Promise.all([
                getBrands(),
                getModels(),
                getOccurrenceTypes(),
                getUsageCategories()
            ]);
            setBrands(brandsData);
            setModels(modelsData);
            setOccurrenceTypes(occurrenceTypesData);
            setUsageCategories(usageCategoriesData);

            // Only load users if admin
            if (isAdmin) {
                const usersData = await getUsers();
                setUsers(usersData);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }

    // Filter tabs based on role - gestor can only see brands and models
    const allTabs = [
        { id: 'brands' as Tab, label: 'Marcas', icon: <Tag className="w-4 h-4" /> },
        { id: 'models' as Tab, label: 'Modelos', icon: <Car className="w-4 h-4" /> },
        { id: 'usage_categories' as Tab, label: 'Categorias de Uso', icon: <ClipboardList className="w-4 h-4" /> },
        { id: 'occurrence_types' as Tab, label: 'Tipos de Ocorrência', icon: <AlertCircle className="w-4 h-4" /> },
        { id: 'users' as Tab, label: 'Usuários', icon: <Users className="w-4 h-4" />, adminOnly: true },
    ];

    const tabs = allTabs.filter(tab => {
        if (tab.id === 'users') return isAdmin;
        return isGestor;
    });

    // Handle initial loading and role-based access
    useEffect(() => {
        if (!authLoading && !isGestor) {
            // Redirect or show error if not authorized
            // window.location.href = '/dashboard';
        }
    }, [authLoading, isGestor]);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/20 rounded-xl">
                    <Settings className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Configurações</h1>
                    <p className="text-slate-400 mt-1">Gerencie marcas, modelos e usuários do sistema</p>
                </div>
            </div>

            {/* Message Alert */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                    <button onClick={() => setMessage(null)} className="ml-auto">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-700 pb-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab.id
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                    </div>
                ) : activeTab === 'brands' ? (
                    <BrandsTab
                        brands={brands}
                        onRefresh={loadData}
                        showModal={showBrandModal}
                        setShowModal={setShowBrandModal}
                        editingBrand={editingBrand}
                        setEditingBrand={setEditingBrand}
                        setMessage={setMessage}
                    />
                ) : activeTab === 'models' ? (
                    <ModelsTab
                        models={models}
                        brands={brands}
                        onRefresh={loadData}
                        showModal={showModelModal}
                        setShowModal={setShowModelModal}
                        editingModel={editingModel}
                        setEditingModel={setEditingModel}
                        setMessage={setMessage}
                    />
                ) : activeTab === 'occurrence_types' ? (
                    <OccurrenceTypesTab
                        types={occurrenceTypes}
                        onRefresh={loadData}
                        showModal={showOccurrenceTypeModal}
                        setShowModal={setShowOccurrenceTypeModal}
                        setMessage={setMessage}
                    />
                ) : activeTab === 'usage_categories' ? (
                    <UsageCategoriesTab
                        categories={usageCategories}
                        onRefresh={loadData}
                        showModal={showUsageCategoryModal}
                        setShowModal={setShowUsageCategoryModal}
                        setMessage={setMessage}
                    />
                ) : (
                    <UsersTab
                        users={users}
                        onRefresh={loadData}
                        showModal={showUserModal}
                        setShowModal={setShowUserModal}
                        editingUser={editingUser}
                        setEditingUser={setEditingUser}
                        setMessage={setMessage}
                    />
                )}
            </div>
        </div>
    );
}

// ============ BRANDS TAB ============
function BrandsTab({
    brands,
    onRefresh,
    showModal,
    setShowModal,
    editingBrand,
    setEditingBrand,
    setMessage
}: {
    brands: Brand[];
    onRefresh: () => void;
    showModal: boolean;
    setShowModal: (show: boolean) => void;
    editingBrand: Brand | null;
    setEditingBrand: (brand: Brand | null) => void;
    setMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void;
}) {
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        try {
            const result = editingBrand
                ? await updateBrand(editingBrand.id, formData)
                : await createBrand(formData);

            if (result.success) {
                setMessage({ type: 'success', text: editingBrand ? 'Marca atualizada!' : 'Marca criada!' });
                setShowModal(false);
                setEditingBrand(null);
                onRefresh();
            } else {
                setMessage({ type: 'error', text: result.error || 'Erro ao salvar marca' });
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Tem certeza que deseja excluir esta marca? Todos os modelos vinculados serão excluídos.')) return;

        const result = await deleteBrand(id);
        if (result.success) {
            setMessage({ type: 'success', text: 'Marca excluída!' });
            onRefresh();
        } else {
            setMessage({ type: 'error', text: result.error || 'Erro ao excluir marca' });
        }
    }

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white">Marcas de Veículos</h3>
                <button
                    onClick={() => { setEditingBrand(null); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Nova Marca
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {brands.map((brand) => (
                    <div
                        key={brand.id}
                        className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-700 rounded-lg"
                    >
                        <span className="text-white font-medium">{brand.name}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setEditingBrand(brand); setShowModal(true); }}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(brand.id)}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
                {brands.length === 0 && (
                    <p className="text-slate-400 col-span-full text-center py-8">Nenhuma marca cadastrada</p>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-4">
                            {editingBrand ? 'Editar Marca' : 'Nova Marca'}
                        </h3>
                        <form action={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Nome da Marca</label>
                                <input
                                    name="name"
                                    defaultValue={editingBrand?.name}
                                    required
                                    placeholder="Ex: Fiat"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setEditingBrand(null); }}
                                    className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

// ============ MODELS TAB ============
function ModelsTab({
    models,
    brands,
    onRefresh,
    showModal,
    setShowModal,
    editingModel,
    setEditingModel,
    setMessage
}: {
    models: Model[];
    brands: Brand[];
    onRefresh: () => void;
    showModal: boolean;
    setShowModal: (show: boolean) => void;
    editingModel: Model | null;
    setEditingModel: (model: Model | null) => void;
    setMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void;
}) {
    const [loading, setLoading] = useState(false);
    const [filterBrand, setFilterBrand] = useState<string>('');

    const filteredModels = filterBrand
        ? models.filter(m => m.brand_id === filterBrand)
        : models;

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        try {
            const result = editingModel
                ? await updateModel(editingModel.id, formData)
                : await createModel(formData);

            if (result.success) {
                setMessage({ type: 'success', text: editingModel ? 'Modelo atualizado!' : 'Modelo criado!' });
                setShowModal(false);
                setEditingModel(null);
                onRefresh();
            } else {
                setMessage({ type: 'error', text: result.error || 'Erro ao salvar modelo' });
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Tem certeza que deseja excluir este modelo?')) return;

        const result = await deleteModel(id);
        if (result.success) {
            setMessage({ type: 'success', text: 'Modelo excluído!' });
            onRefresh();
        } else {
            setMessage({ type: 'error', text: result.error || 'Erro ao excluir modelo' });
        }
    }

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="text-lg font-semibold text-white">Modelos de Veículos</h3>
                <div className="flex gap-3">
                    <select
                        value={filterBrand}
                        onChange={(e) => setFilterBrand(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-300"
                    >
                        <option value="">Todas as Marcas</option>
                        {brands.map(brand => (
                            <option key={brand.id} value={brand.id}>{brand.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => { setEditingModel(null); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Modelo
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700">
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Modelo</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Marca</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredModels.map((model) => (
                            <tr key={model.id} className="border-b border-slate-700/50">
                                <td className="py-3 px-4 text-white font-medium">{model.name}</td>
                                <td className="py-3 px-4 text-slate-400">{(model.brand as any)?.name || '-'}</td>
                                <td className="py-3 px-4">
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => { setEditingModel(model); setShowModal(true); }}
                                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(model.id)}
                                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredModels.length === 0 && (
                            <tr>
                                <td colSpan={3} className="py-8 text-center text-slate-400">
                                    Nenhum modelo cadastrado
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-4">
                            {editingModel ? 'Editar Modelo' : 'Novo Modelo'}
                        </h3>
                        <form action={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Marca</label>
                                <select
                                    name="brandId"
                                    defaultValue={editingModel?.brand_id}
                                    required
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white"
                                >
                                    <option value="">Selecione uma marca</option>
                                    {brands.map(brand => (
                                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Nome do Modelo</label>
                                <input
                                    name="name"
                                    defaultValue={editingModel?.name}
                                    required
                                    placeholder="Ex: Argo"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setEditingModel(null); }}
                                    className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

// ============ USERS TAB ============
function UsersTab({
    users,
    onRefresh,
    showModal,
    setShowModal,
    editingUser,
    setEditingUser,
    setMessage
}: {
    users: UserProfile[];
    onRefresh: () => void;
    showModal: boolean;
    setShowModal: (show: boolean) => void;
    editingUser: UserProfile | null;
    setEditingUser: (user: UserProfile | null) => void;
    setMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void;
}) {
    const [loading, setLoading] = useState(false);

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
                onRefresh();
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
                onRefresh();
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
            onRefresh();
        } else {
            setMessage({ type: 'error', text: result.error || 'Erro ao excluir usuário' });
        }
    }

    const roleLabels: Record<string, string> = {
        admin: 'Administrador',
        gestor: 'Gestor',
        solicitante: 'Solicitante',
    };

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
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-8 text-center text-slate-400">
                                    Nenhum usuário cadastrado
                                </td>
                            </tr>
                        )}
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
                                {editingUser && <p className="text-[10px] text-slate-500 mt-1">O e-mail não pode ser alterado após a criação.</p>}
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

// ============ OCCURRENCE TYPES TAB ============
function OccurrenceTypesTab({
    types,
    onRefresh,
    showModal,
    setShowModal,
    setMessage
}: {
    types: OccurrenceType[];
    onRefresh: () => void;
    showModal: boolean;
    setShowModal: (show: boolean) => void;
    setMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void;
}) {
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        try {
            const result = await createOccurrenceType(formData);

            if (result.success) {
                setMessage({ type: 'success', text: 'Tipo de ocorrência criado!' });
                setShowModal(false);
                onRefresh();
            } else {
                setMessage({ type: 'error', text: result.error || 'Erro ao criar tipo' });
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Tem certeza que deseja excluir este tipo?')) return;

        const result = await deleteOccurrenceType(id);
        if (result.success) {
            setMessage({ type: 'success', text: 'Tipo excluído!' });
            onRefresh();
        } else {
            setMessage({ type: 'error', text: result.error || 'Erro ao excluir tipo' });
        }
    }

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white">Tipos de Ocorrência</h3>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Novo Tipo
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {types.map((type) => (
                    <div
                        key={type.id}
                        className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-700 rounded-lg"
                    >
                        <span className="text-white font-medium">{type.name}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleDelete(type.id)}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-4">Novo Tipo de Ocorrência</h3>
                        <form action={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Nome</label>
                                <input
                                    name="name"
                                    required
                                    placeholder="Ex: Multa"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
