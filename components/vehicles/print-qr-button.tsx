'use client';

import { Printer } from 'lucide-react';

export default function PrintQrButton() {
    return <button type="button" onClick={() => window.print()} className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white hover:bg-slate-700"><Printer className="size-4" /> Imprimir QR Code</button>;
}
