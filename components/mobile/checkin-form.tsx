'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { uploadPhoto } from '@/lib/supabase/storage';
import { Camera, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

type CheckStatus = 'OK' | 'ALERT' | 'DAMAGE';

const checkStatusOptions = [
    { value: 'OK' as CheckStatus, label: 'OK', icon: CheckCircle, colorClass: 'green' },
    { value: 'ALERT' as CheckStatus, label: 'Alerta', icon: AlertCircle, colorClass: 'yellow' },
    { value: 'DAMAGE' as CheckStatus, label: 'Dano', icon: XCircle, colorClass: 'red' }
];

export default function CheckInForm({ vehicle, drivers = [] }: { vehicle: any, drivers?: any[] }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [driverId, setDriverId] = useState('');
    const [odometer, setOdometer] = useState('');
    const [cleanliness, setCleanliness] = useState<CheckStatus>('OK');
    const [dashLights, setDashLights] = useState<CheckStatus>('OK');
    const [tiresExterior, setTiresExterior] = useState<CheckStatus>('OK');
    const [repairNotes, setRepairNotes] = useState('');
    const [photos, setPhotos] = useState<FileList | null>(null);

    const hasIssues = cleanliness !== 'OK' || dashLights !== 'OK' || tiresExterior !== 'OK';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validação de fotos removida por solicitação do usuário
        /* if (hasIssues && (!photos || photos.length === 0)) {
            alert('Por favor, adicione fotos dos problemas identificados');
            return;
        } */

        if (hasIssues && !repairNotes.trim()) {
            alert('Por favor, descreva os problemas encontrados');
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();

            // 1. Criar check-in (o trigger SQL vai atualizar o status automaticamente)
            const { data: checkIn, error: checkInError } = await supabase
                .from('check_ins')
                .insert({
                    vehicle_id: vehicle.id,
                    driver_id: driverId || null, // Usa o selecionado ou null
                    odometer: parseInt(odometer),
                    cleanliness_status: cleanliness,
                    dash_lights_status: dashLights,
                    tires_exterior_status: tiresExterior,
                    repair_notes: repairNotes || null,
                    has_issues: hasIssues
                })
                .select()
                .single();

            if (checkInError) throw checkInError;

            // 2. Upload de fotos se houver
            if (photos && photos.length > 0) {
                const uploadPromises = Array.from(photos).map(file =>
                    uploadPhoto(file, checkIn.id)
                );

                const uploadResults = await Promise.all(uploadPromises);

                // 3. Salvar registros de fotos no banco
                const photoRecords = uploadResults.map(result => ({
                    check_in_id: checkIn.id,
                    storage_path: result.path,
                    url: result.url
                }));

                await supabase.from('photos').insert(photoRecords);
            }

            // Sucesso!
            alert('Check-in realizado com sucesso!');
            router.push('/dashboard');

        } catch (error) {
            console.error('Erro ao realizar check-in:', error);
            alert('Erro ao realizar check-in. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Card branco com formulário */}
            <div className="bg-white rounded-3xl shadow-2xl p-6 space-y-6">

                {/* Seleção de Motorista */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Quem está devolvendo?
                    </label>
                    <select
                        value={driverId}
                        onChange={(e) => setDriverId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none text-lg bg-white"
                        required
                    >
                        <option value="">Selecione o condutor...</option>
                        {drivers.map(driver => (
                            <option key={driver.id} value={driver.id}>{driver.name}</option>
                        ))}
                    </select>
                </div>

                {/* Odômetro */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Odômetro (km) *
                    </label>
                    <input
                        type="number"
                        value={odometer}
                        onChange={(e) => setOdometer(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none text-lg"
                        placeholder="Ex: 45000"
                        required
                        min="0"
                    />
                </div>

                {/* Limpeza */}
                <ChecklistItem
                    label="Limpeza"
                    value={cleanliness}
                    onChange={setCleanliness}
                />

                {/* Luzes do Painel */}
                <ChecklistItem
                    label="Luzes do Painel"
                    value={dashLights}
                    onChange={setDashLights}
                />

                {/* Pneus e Exterior */}
                <ChecklistItem
                    label="Pneus e Exterior"
                    value={tiresExterior}
                    onChange={setTiresExterior}
                />

                {/* Observações (obrigatório se houver problemas) */}
                {hasIssues && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Descreva os problemas *
                        </label>
                        <textarea
                            value={repairNotes}
                            onChange={(e) => setRepairNotes(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none"
                            rows={4}
                            placeholder="Descreva em detalhes os problemas encontrados..."
                            required
                        />
                    </div>
                )}

                {/* Upload de Fotos (obrigatório se houver problemas) */}
                {hasIssues && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Fotos dos Problemas (Opcional)
                        </label>
                        <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-500 transition">
                            <div className="text-center">
                                <Camera className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                                <span className="text-sm text-slate-600">
                                    {photos ? `${photos.length} foto(s) selecionada(s)` : 'Toque para adicionar fotos'}
                                </span>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => setPhotos(e.target.files)}
                            />
                        </label>
                    </div>
                )}

                {/* Botão de Envio */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Enviando...' : 'Concluir Check-in'}
                </button>
            </div>
        </form>
    );
}

// Componente auxiliar para cada item do checklist
function ChecklistItem({
    label,
    value,
    onChange
}: {
    label: string;
    value: CheckStatus;
    onChange: (value: CheckStatus) => void;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
                {label}
            </label>
            <div className="grid grid-cols-3 gap-3">
                {checkStatusOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = value === option.value;

                    const buttonClass = isSelected
                        ? `border-${option.colorClass}-500 bg-${option.colorClass}-50`
                        : 'border-slate-200 bg-white hover:border-slate-300';

                    const iconColorClass = isSelected
                        ? `text-${option.colorClass}-500`
                        : 'text-slate-400';

                    const labelColorClass = isSelected
                        ? `text-${option.colorClass}-700`
                        : 'text-slate-600';

                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onChange(option.value)}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${buttonClass}`}
                        >
                            <Icon className={`w-8 h-8 mb-2 ${iconColorClass}`} />
                            <span className={`text-sm font-medium ${labelColorClass}`}>
                                {option.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
