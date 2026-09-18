'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, QrCode } from 'lucide-react';

type QrVehicle = { id: string; label: string; licensePlate: string; qrCodeUrl: string };

export default function QrDispatchPanel({ vehicles }: { vehicles: QrVehicle[] }) {
    const [selectedId, setSelectedId] = useState(vehicles[0]?.id || '');
    const selected = vehicles.find(vehicle => vehicle.id === selectedId);
    return <section className="ops-panel p-5"><div className="flex items-center justify-between border-b border-[#1c2637] pb-3"><div className="flex items-center gap-2"><QrCode className="h-4 w-4 text-red-400" /><h2 className="text-sm font-extrabold uppercase text-white">Despacho por QR</h2></div><span className="ops-mono text-[10px] text-emerald-400">PRONTO</span></div><label className="mt-4 block"><span className="ops-label">Veículo para despacho</span><select value={selectedId} onChange={event => setSelectedId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#334460] bg-[#0b0f17] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-red-700">{vehicles.map(vehicle => <option key={vehicle.id} value={vehicle.id}>{vehicle.label}</option>)}</select></label>{selected ? <><div className="mt-4 flex justify-center rounded-lg bg-white p-4"><img src={selected.qrCodeUrl} alt={`QR Code ${selected.licensePlate}`} className="h-40 w-40 object-contain" /></div><p className="ops-mono mt-2 text-center text-xs text-slate-300">{selected.licensePlate}</p><Link href={`/dashboard/vehicles/${selected.id}`} className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-[#334460] bg-[#182232] px-3 py-2.5 text-xs font-bold text-slate-100 hover:bg-[#1e2b3e]"><ExternalLink className="h-4 w-4" />Abrir ficha e imprimir</Link></> : <p className="py-8 text-center text-sm text-slate-400">Nenhum veículo disponível.</p>}</section>;
}
