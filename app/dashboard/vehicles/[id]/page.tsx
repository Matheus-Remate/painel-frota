import Link from "next/link";
import { ArrowLeft, Calendar, FileText } from "lucide-react";
import { getVehicleById } from "@/lib/services/dashboard";
import { generateVehicleQRCode } from "@/lib/utils/qrcode";
import { notFound } from "next/navigation";
import Image from "next/image";
import VehicleActions from "@/components/vehicles/VehicleActions";
import PrintQrButton from "@/components/vehicles/print-qr-button";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function VehicleDetailsPage({ params }: Props) {
    const { id } = await params;
    let vehicle: any;

    try {
        vehicle = await getVehicleById(id);
    } catch (e) {
        notFound();
    }

    // Gera o QR Code para este veículo
    const { dataUrl: qrCodeUrl } = await generateVehicleQRCode(vehicle.id, vehicle.license_plate, vehicle.qr_access_token);
    const model = Array.isArray(vehicle.model) ? vehicle.model[0] : vehicle.model;
    const brand = Array.isArray(model?.brand) ? model.brand[0] : model?.brand;
    const brandAndModel = [brand?.name, model?.name || vehicle.model_name || vehicle.model].filter(Boolean).join(' ') || 'Veículo';

    return (
        <div className="space-y-8">
            <section className="vehicle-qr-print-label" aria-label="Etiqueta de impressão do veículo">
                <div className="vehicle-qr-print-details">
                    <div>
                        <p className="vehicle-qr-print-label-name">Marca e modelo</p>
                        <p className="vehicle-qr-print-value vehicle-qr-print-model">{brandAndModel}</p>
                    </div>
                    <div className="vehicle-qr-print-plate">
                        <p className="vehicle-qr-print-label-name">Placa</p>
                        <p className="vehicle-qr-print-value">{vehicle.license_plate}</p>
                    </div>
                    <div className="vehicle-qr-print-pairs">
                        <div><p className="vehicle-qr-print-label-name">Ano</p><p className="vehicle-qr-print-value">{vehicle.year || '—'}</p></div>
                        <div><p className="vehicle-qr-print-label-name">Combustível</p><p className="vehicle-qr-print-value">{vehicle.fuel_type || '—'}</p></div>
                    </div>
                    <div><p className="vehicle-qr-print-label-name">Chassi</p><p className="vehicle-qr-print-value vehicle-qr-print-code">{vehicle.chassis || '—'}</p></div>
                    <div><p className="vehicle-qr-print-label-name">RENAVAM</p><p className="vehicle-qr-print-value vehicle-qr-print-code">{vehicle.renavam || '—'}</p></div>
                </div>
                <div className="vehicle-qr-print-code-wrap">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrCodeUrl} alt={`QR Code ${vehicle.license_plate}`} className="vehicle-qr-print-code-image" />
                </div>
            </section>
            {/* Header com Navegação */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/vehicles"
                        className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            {model?.name || vehicle.model_name || vehicle.model}
                            <span className={`text-sm px-3 py-1 rounded-full border ${vehicle.status === 'IN_YARD' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                vehicle.status === 'ON_ROUTE' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                }`}>
                                {vehicle.status === 'IN_YARD' && 'Em Pátio'}
                                {vehicle.status === 'ON_ROUTE' && 'Em Rota'}
                                {vehicle.status === 'AWAITING_REPAIR' && 'Bloqueado para revisão'}
                            </span>
                        </h1>
                        <p className="text-slate-400 font-mono mt-1 text-lg">
                            {vehicle.license_plate} • {brand?.name || ''}
                        </p>
                    </div>
                </div>

                {/* Botão de Impressão (Simulado com ação de browser print não implementada aqui, mas visual) */}
                <PrintQrButton />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Coluna Principal: Detalhes e QR */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Cards de Métricas Rápidas */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                            <div className="text-slate-400 text-xs uppercase font-bold mb-1">Ano</div>
                            <div className="text-white text-lg font-medium">{vehicle.year}</div>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                            <div className="text-slate-400 text-xs uppercase font-bold mb-1">Combustível</div>
                            <div className="text-white text-lg font-medium">{vehicle.fuel_type}</div>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                            <div className="text-slate-400 text-xs uppercase font-bold mb-1">Odômetro</div>
                            <div className="text-white text-lg font-medium">{vehicle.odometer} km</div>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                            <div className="text-slate-400 text-xs uppercase font-bold mb-1">Uso</div>
                            <div className="text-white text-lg font-medium">{vehicle.usage_category}</div>
                        </div>
                    </div>

                    {/* Ficha Técnica Completa */}
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Ficha Técnica
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                            <div className="flex justify-between border-b border-slate-700/50 pb-2">
                                <span className="text-slate-400">Chassi</span>
                                <span className="text-slate-200 font-mono">{vehicle.chassis}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-700/50 pb-2">
                                <span className="text-slate-400">RENAVAM</span>
                                <span className="text-slate-200 font-mono">{vehicle.renavam}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-700/50 pb-2">
                                <span className="text-slate-400">Cor</span>
                                <span className="text-slate-200">{vehicle.color}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-700/50 pb-2">
                                <span className="text-slate-400">Capacidade PBT</span>
                                <span className="text-slate-200">{vehicle.capacity?.pbt || '-'} kg</span>
                            </div>
                        </div>
                    </div>

                    {/* Histórico na página de detalhes */}
                    <div>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Histórico de Atividades
                        </h3>

                        <div className="space-y-4">
                            {vehicle.check_ins && vehicle.check_ins.length > 0 ? (
                                vehicle.check_ins.map((checkin: any) => (
                                    <div key={checkin.id} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 flex gap-4 hover:bg-slate-800/50 transition-colors">
                                        <div className={`mt-1 w-2 rounded-full self-stretch ${checkin.has_issues ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-slate-200 font-medium">
                                                    {checkin.has_issues ? 'Devolução com Apontamentos' : 'Devolução Regular'}
                                                </span>
                                                <span className="text-slate-500 text-sm">
                                                    {new Date(checkin.checked_in_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="text-sm text-slate-400 mb-2">
                                                Condutor: <span className="text-slate-300">{checkin.driver_name || checkin.driver?.name || 'Não identificado'}</span>
                                            </div>
                                            <div className="flex gap-2 text-xs">
                                                <StatusBadge label="Lataria" status={checkin.tires_exterior_status} />
                                                <StatusBadge label="Interior" status={checkin.cleanliness_status} />
                                                <StatusBadge label="Painel" status={checkin.dash_lights_status} />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-500 italic">Nenhum registro de histórico encontrado.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Coluna Lateral: QR Code e Ações */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl flex flex-col items-center text-center shadow-xl shadow-black/20">
                        <h3 className="text-slate-800 font-bold mb-2">QR Code do Veículo</h3>
                        <p className="text-slate-500 text-sm mb-4 px-4">Utilize este código para Retirada e Devolução via Mobile</p>

                        <div className="bg-white p-2 border-4 border-slate-100 rounded-lg mb-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={qrCodeUrl} alt={`QR Code ${vehicle.license_plate}`} className="w-48 h-48" />
                        </div>

                        <div className="bg-slate-100 px-4 py-2 rounded text-slate-600 font-mono font-bold text-lg">
                            {vehicle.license_plate}
                        </div>
                        <p className="mt-3 text-xs text-slate-500">O código contém uma credencial operacional. Reimprima-o se houver exposição indevida.</p>
                    </div>

                    <VehicleActions vehicleId={vehicle.id} licensePlate={vehicle.license_plate} />
                </div>

            </div>
        </div>
    );
}

function StatusBadge({ label, status }: { label: string, status: string }) {
    const isOk = status === 'OK';
    return (
        <span className={`px-2 py-0.5 rounded border ${isOk
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
            {label}
        </span>
    )
}
