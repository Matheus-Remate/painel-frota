'use client';

import { useState } from 'react';
import { Search, Car, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createCheckin } from '@/lib/services/checkins';

export default function NewCheckinForm({ vehicles }: { vehicles: any[] }) {
    const router = useRouter();
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
    const [search, setSearch] = useState('');

    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

    async function clientAction(formData: FormData) {
        const result = await createCheckin(formData);
        if (result.success) {
            router.push('/dashboard/checkins?success=true');
            router.refresh();
        } else {
            alert(result.error || 'Erro ao criar check-in');
        }
    }

    const filteredVehicles = vehicles.filter(v =>
        v.license_plate.toLowerCase().includes(search.toLowerCase()) ||
        (v.model?.name || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                <h2 className="text-xl font-semibold text-white mb-4">Selecione o Veículo</h2>

                <div className="space-y-4">
                    {!selectedVehicle ? (
                        <div className="space-y-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar placa ou modelo..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-brand/50 outline-none"
                                />
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-2 mt-2">
                                {filteredVehicles.length > 0 ? (
                                    filteredVehicles.map(vehicle => (
                                        <button
                                            key={vehicle.id}
                                            onClick={() => setSelectedVehicleId(vehicle.id)}
                                            className="w-full flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-900 rounded-lg text-slate-400 group-hover:text-brand-400 transition-colors">
                                                    <Car className="w-5 h-5" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-medium text-white">{vehicle.model?.name || (vehicle as any).model}</div>
                                                    <div className="text-xs text-slate-400 font-mono">{vehicle.license_plate}</div>
                                                </div>
                                            </div>
                                            <div className="text-sm text-slate-500 group-hover:text-slate-300">
                                                {vehicle.model?.brand?.name || vehicle.brand} • {vehicle.color}
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center p-4 text-slate-500">Nenhum veículo encontrado</div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-top-4">
                            <div className="bg-brand/10 border border-brand/20 rounded-xl p-4 flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center">
                                        <Car className="w-6 h-6 text-brand-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">
                                            {selectedVehicle.model?.brand?.name || selectedVehicle.brand} {selectedVehicle.model?.name || (selectedVehicle as any).model}
                                        </h3>
                                        <div className="flex gap-2 text-sm text-slate-400">
                                            <span className="font-mono bg-slate-900 px-1.5 rounded">{selectedVehicle.license_plate}</span>
                                            <span>•</span>
                                            <span>{selectedVehicle.color}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedVehicleId('')}
                                    className="px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    Trocar
                                </button>
                            </div>

                            <form action={clientAction} className="space-y-6 mt-6 border-t border-slate-700 pt-6">
                                <input type="hidden" name="vehicleId" value={selectedVehicle.id} />

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Quilometragem Atual (km)</label>
                                        <input
                                            name="odometer"
                                            type="number"
                                            required
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-brand/50 outline-none"
                                            placeholder="Ex: 50000"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {['Limpeza', 'Lataria/Pneus', 'Luzes do Painel'].map((item, idx) => (
                                            <div key={idx} className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                                                <div className="text-sm font-medium text-slate-300 mb-3">{item}</div>
                                                <div className="flex gap-2">
                                                    <label className="flex-1 cursor-pointer">
                                                        <input type="radio" name={`status_${idx}`} value="OK" className="peer sr-only" defaultChecked />
                                                        <div className="flex flex-col items-center gap-1 p-2 rounded border border-slate-700 hover:bg-slate-800 peer-checked:bg-brand/10 peer-checked:border-brand/50 peer-checked:text-brand-400 transition-all">
                                                            <CheckCircle className="w-4 h-4" />
                                                            <span className="text-xs">OK</span>
                                                        </div>
                                                    </label>
                                                    <label className="flex-1 cursor-pointer">
                                                        <input type="radio" name={`status_${idx}`} value="ISSUE" className="peer sr-only" />
                                                        <div className="flex flex-col items-center gap-1 p-2 rounded border border-slate-700 hover:bg-slate-800 peer-checked:bg-amber-500/10 peer-checked:border-amber-500/50 peer-checked:text-amber-400 transition-all">
                                                            <AlertTriangle className="w-4 h-4" />
                                                            <span className="text-xs">Problema</span>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Observações</label>
                                        <textarea
                                            name="notes"
                                            rows={3}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-brand/50 outline-none resize-none"
                                            placeholder="Descreva problemas se houver..."
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-brand hover:bg-brand-950 text-white font-bold py-3 rounded-xl shadow-lg shadow-brand/20 transition-all">
                                    Finalizar Check-in
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
