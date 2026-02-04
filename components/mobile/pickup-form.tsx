'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Car, Navigation } from 'lucide-react';

export default function PickupForm({ vehicle }: { vehicle: any }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [odometer, setOdometer] = useState(vehicle.odometer || ''); // Se tiver salvo, pré-popula
    const [confirmCondition, setConfirmCondition] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const supabase = createClient();

            // 1. Atualizar status do veículo para ON_ROUTE
            const { error } = await supabase
                .from('vehicles')
                .update({
                    status: 'ON_ROUTE',
                    //updated_odometer: parseInt(odometer) // Se tivéssemos esse campo
                })
                .eq('id', vehicle.id);

            if (error) throw error;

            // Opção: Poderíamos criar um registro na tabela 'check_ins' ou 'trips' aqui
            // Por simplificação, vamos apenas mudar o status do veículo agora.

            alert('Retirada registrada! Boa viagem.');
            router.push('/dashboard');

        } catch (error) {
            console.error('Erro ao realizar retirada:', error);
            alert('Erro ao processar retirada. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-3xl shadow-2xl p-6 space-y-6">

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                    <Car className="w-6 h-6 text-blue-600 mt-1" />
                    <div>
                        <h3 className="font-semibold text-blue-900">Veículo Liberado</h3>
                        <p className="text-sm text-blue-700 mt-1">
                            Você está retirando este veículo do pátio para uso.
                        </p>
                    </div>
                </div>

                {/* Odômetro Atual */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Odômetro Atual (Conferência)
                    </label>
                    <input
                        type="number"
                        value={odometer}
                        onChange={(e) => setOdometer(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none text-lg"
                        placeholder="Ex: 45000"
                        required
                    />
                </div>

                {/* Confirmação */}
                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-slate-50">
                    <input
                        type="checkbox"
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        checked={confirmCondition}
                        onChange={(e) => setConfirmCondition(e.target.checked)}
                        required
                    />
                    <span className="text-sm text-slate-700">
                        Confirmo que verifiquei o veículo e ele está em condições de uso.
                    </span>
                </label>

                <button
                    type="submit"
                    disabled={loading || !confirmCondition}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? 'Processando...' : (
                        <>
                            <Navigation className="w-5 h-5" />
                            Iniciar Viagem
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
