'use client';

import { useState } from "react";
import { Tag, Car, ClipboardList, AlertCircle, Users, CheckCircle, X } from "lucide-react";
import { BrandsTab } from "./settings/brands-tab";
import { ModelsTab } from "./settings/models-tab";
import { OccurrenceTypesTab } from "./settings/occurrence-types-tab";
import { UsageCategoriesTab } from "./usage-categories-tab";
import { UsersTab } from "./settings/users-tab";

interface SettingsTabsContainerProps {
    initialData: {
        brands: any[];
        models: any[];
        occurrenceTypes: any[];
        usageCategories: any[];
        users: any[];
        role: string;
    }
}

export default function SettingsTabsContainer({ initialData }: SettingsTabsContainerProps) {
    const { role } = initialData;
    const isAdmin = role === 'admin';
    const isGestor = role === 'gestor' || isAdmin;

    const [activeTab, setActiveTab] = useState('brands');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Modal management for UsageCategories (handled via props for that specific tab)
    const [showUsageModal, setShowUsageModal] = useState(false);

    // Filter tabs based on role
    const allTabs = [
        { id: 'brands', label: 'Marcas', icon: <Tag className="w-4 h-4" /> },
        { id: 'models', label: 'Modelos', icon: <Car className="w-4 h-4" /> },
        { id: 'usage_categories', label: 'Categorias de Uso', icon: <ClipboardList className="w-4 h-4" /> },
        { id: 'occurrence_types', label: 'Tipos de Ocorrência', icon: <AlertCircle className="w-4 h-4" /> },
        { id: 'users', label: 'Usuários', icon: <Users className="w-4 h-4" /> },
    ];

    const tabs = allTabs.filter(tab => {
        if (tab.id === 'users') return isGestor;
        return isGestor;
    });

    return (
        <div className="space-y-6">
            {/* Global Message Alert */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success'
                    ? 'bg-brand/10 border border-brand/20 text-brand-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                    <button onClick={() => setMessage(null)} className="ml-auto">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Tabs Navigation */}
            <div className="flex gap-2 border-b border-slate-700 pb-2 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-brand/20 text-brand-400'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                {activeTab === 'brands' && (
                    <BrandsTab initialBrands={initialData.brands} />
                )}
                {activeTab === 'models' && (
                    <ModelsTab initialModels={initialData.models} initialBrands={initialData.brands} />
                )}
                {activeTab === 'occurrence_types' && (
                    <OccurrenceTypesTab initialTypes={initialData.occurrenceTypes} />
                )}
                {activeTab === 'usage_categories' && (
                    <UsageCategoriesTab
                        categories={initialData.usageCategories}
                        onRefresh={() => window.location.reload()}
                        showModal={showUsageModal}
                        setShowModal={setShowUsageModal}
                        setMessage={setMessage}
                    />
                )}
                {activeTab === 'users' && isGestor && (
                    <UsersTab initialUsers={initialData.users} currentRole={isAdmin ? 'admin' : 'gestor'} />
                )}
            </div>
        </div>
    );
}
