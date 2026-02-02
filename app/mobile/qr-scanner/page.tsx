'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode } from 'lucide-react';

export default function QRScannerPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        // Inicializar scanner QR Code
        // TODO: Implementar com html5-qrcode
        setIsScanning(true);
    }, []);

    const handleManualInput = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const vehicleId = formData.get('vehicleId') as string;

        if (vehicleId) {
            router.push(`/mobile/checkin/${vehicleId}`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="text-center text-white mb-8">
                    <QrCode className="w-16 h-16 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold mb-2">Escanear QR Code</h1>
                    <p className="text-slate-300">Aponte a câmera para o QR Code do veículo</p>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-2xl">
                    {/* Scanner QR Code */}
                    <div
                        id="qr-reader"
                        className="bg-slate-200 rounded-xl aspect-square flex items-center justify-center mb-6"
                    >
                        <p className="text-slate-500 text-center px-4">
                            Scanner QR Code<br />
                            <span className="text-sm">Implementar com html5-qrcode</span>
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-xl">
                            {error}
                        </div>
                    )}

                    {/* Input manual para testes */}
                    <div className="pt-6 border-t">
                        <p className="text-sm text-slate-600 mb-3 text-center">
                            Ou digite o ID do veículo manualmente:
                        </p>
                        <form onSubmit={handleManualInput} className="flex gap-2">
                            <input
                                type="text"
                                name="vehicleId"
                                placeholder="ID do veículo"
                                className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                            />
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                Ir
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
