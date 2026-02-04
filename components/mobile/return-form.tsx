'use client';

import { createCheckin } from "@/lib/services/checkins";
import { useState } from "react";
import { Camera, Upload, Check, AlertTriangle, Fuel, Gauge } from "lucide-react";

export default function ReturnForm({ vehicleId, lastOdometer }: { vehicleId: string, lastOdometer: number }) {
    const [submitting, setSubmitting] = useState(false);
    const [hasIssues, setHasIssues] = useState(false);
    const [photos, setPhotos] = useState<File[]>([]);

    async function handleSubmit(formData: FormData) {
        setSubmitting(true);
        try {
            await createCheckin(formData);
            // Redirect happens in server action usually, but if not we can handle it here.
        } catch (e) {
            console.error(e);
            alert('Erro ao enviar check-in. Tente novamente.');
            setSubmitting(false);
        }
    }

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setPhotos(Array.from(e.target.files));
        }
    };

    return (
        <form action={handleSubmit} className="space-y-6">
            <input type="hidden" name="vehicleId" value={vehicleId} />

            {/* Odometer */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <Gauge className="w-4 h-4 text-brand" />
                    Odômetro Atual (km)
                </label>
                <input
                    type="number"
                    name="odometer"
                    placeholder={lastOdometer ? `Maior que ${lastOdometer}` : "000000"}
                    required
                    min={lastOdometer}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand focus:outline-none"
                />
            </div>

            {/* Fuel Level */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <Fuel className="w-4 h-4 text-brand" />
                    Nível de Combustível
                </label>
                <div className="grid grid-cols-5 gap-2">
                    {['EMPTY', '1/4', '1/2', '3/4', 'FULL'].map((level) => (
                        <div key={level}>
                            <input
                                type="radio"
                                name="fuelLevel"
                                value={level}
                                id={`fuel-${level}`}
                                className="peer hidden"
                                required
                            />
                            <label
                                htmlFor={`fuel-${level}`}
                                className="block text-center text-xs py-2 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 peer-checked:bg-brand-950 peer-checked:text-white peer-checked:border-brand transition-all cursor-pointer"
                            >
                                {level === 'EMPTY' ? 'E' : level === 'FULL' ? 'F' : level}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Status Checklist */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="text-sm font-semibold text-slate-400">Verificação Rápida</h3>

                {[
                    { name: 'status_0', label: 'Limpeza Interna' },
                    { name: 'status_1', label: 'Lataria e Pneus' },
                    { name: 'status_2', label: 'Luzes do Painel' }
                ].map((item) => (
                    <div key={item.name} className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800">
                        <span className="text-sm text-slate-300">{item.label}</span>
                        <div className="flex bg-slate-800 rounded p-1">
                            <label className="cursor-pointer">
                                <input type="radio" name={item.name} value="OK" defaultChecked className="peer hidden" />
                                <div className="px-3 py-1 rounded text-xs font-bold text-slate-500 peer-checked:bg-brand peer-checked:text-white transition-all">OK</div>
                            </label>
                            <label className="cursor-pointer">
                                <input
                                    type="radio"
                                    name={item.name}
                                    value="ISSUE"
                                    className="peer hidden"
                                    onChange={(e) => { if (e.target.checked) setHasIssues(true) }}
                                />
                                <div className="px-3 py-1 rounded text-xs font-bold text-slate-500 peer-checked:bg-amber-500 peer-checked:text-white transition-all">!</div>
                            </label>
                        </div>
                    </div>
                ))}
            </div>

            {/* Issues / Notes */}
            <div className="space-y-2 pt-2">
                <label className="text-sm font-medium text-slate-300">Observações / Problemas</label>
                <textarea
                    name="notes"
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder:text-slate-600"
                    placeholder="Descreva qualquer problema encontrado..."
                ></textarea>
            </div>

            {/* Photos */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <Camera className="w-4 h-4 text-brand" />
                    Fotos (Opcional)
                </label>
                <div className="relative">
                    <input
                        type="file"
                        name="photos"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                        id="photo-upload"
                    />
                    <label
                        htmlFor="photo-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-700 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                        <Upload className="w-8 h-8 text-slate-500 mb-2" />
                        <span className="text-xs text-slate-500">Toque para adicionar fotos</span>
                    </label>
                    {photos.length > 0 && (
                        <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
                            {photos.map((p, i) => (
                                <div key={i} className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-300 whitespace-nowrap border border-slate-700">
                                    {p.name.substring(0, 15)}...
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Submit */}
            <div className="pt-4">
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-brand-950 hover:bg-brand disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    {submitting ? 'Enviando...' : (
                        <>
                            <Check className="w-5 h-5" />
                            Finalizar Devolução
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
