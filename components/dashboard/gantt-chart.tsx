'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus, Car } from 'lucide-react';
import { Reservation } from '@/lib/services/schedule';

interface GanttChartProps {
    reservations: Reservation[];
    vehicles: { id: string; model: string; license_plate: string }[];
}

export default function GanttChart({ reservations, vehicles }: GanttChartProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Navigation (Shift by 7 days)
    const handlePrev = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    // Gera os dias a serem exibidos (-3 a +28 dias)
    const daysToShow = useMemo(() => {
        const days = [];
        const start = new Date(currentDate);
        start.setDate(start.getDate() - 3); // 3 dias atrás

        // Total 32 dias (3 atrás + hoje + 28 frente = 32 dias de range total? 
        // User disse "28 dias para frente". Se hoje é dia 10. +28 = dia 38.
        // Range: Dia 7 (10-3) até Dia 38. Total 32 dias.

        for (let i = 0; i < 32; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }
        return days;
    }, [currentDate]);

    return (
        <div className="bg-slate-800/50 border-y sm:border border-slate-700/50 sm:rounded-xl overflow-hidden backdrop-blur-sm -mx-4 sm:mx-0">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-700/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrev} className="p-1 hover:bg-slate-700 rounded-full transition-colors">
                            <ChevronLeft className="w-5 h-5 text-slate-300" />
                        </button>
                        <span className="text-white font-medium min-w-[200px] text-center">
                            {daysToShow[0].toLocaleDateString()} - {daysToShow[daysToShow.length - 1].toLocaleDateString()}
                        </span>
                        <button onClick={handleNext} className="p-1 hover:bg-slate-700 rounded-full transition-colors">
                            <ChevronRight className="w-5 h-5 text-slate-300" />
                        </button>
                    </div>
                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className="text-xs text-brand-400 hover:text-brand-300 font-medium"
                    >
                        Hoje
                    </button>
                </div>

                <Link
                    href="/dashboard/schedule/new"
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-lg shadow-emerald-500/20"
                >
                    <Plus className="w-4 h-4" />
                    Nova Reserva
                </Link>
            </div>

            {/* Chart Area */}
            <div className="overflow-x-auto">
                <div className="min-w-[1500px]"> {/* Increased width for 32 columns */}
                    {/* Header Row */}
                    <div className="grid grid-cols-[200px_1fr] border-b border-slate-700/50">
                        <div className="p-4 bg-slate-800/80 text-slate-400 font-medium text-sm border-r border-slate-700/50 sticky left-0 z-20">
                            Veículo
                        </div>
                        <div className="grid" style={{ gridTemplateColumns: `repeat(${daysToShow.length}, minmax(0, 1fr))` }}>
                            {daysToShow.map((day, i) => (
                                <div key={i} className={`p-2 text-center border-l border-slate-700/30 ${day.toDateString() === new Date().toDateString() ? 'bg-brand-900/10' : ''}`}>
                                    <div className="text-slate-300 font-medium text-sm">{day.getDate()}</div>
                                    <div className="text-slate-500 text-[10px] uppercase">{day.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3)}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Vehicle Rows */}
                    <div className="divide-y divide-slate-700/50">
                        {vehicles.map(vehicle => (
                            <div key={vehicle.id} className="grid grid-cols-[200px_1fr] group hover:bg-slate-800/30 transition-colors">
                                {/* Vehicle Info Column */}
                                <div className="p-4 border-r border-slate-700/50 sticky left-0 bg-slate-900/95 group-hover:bg-slate-800/95 z-20 flex flex-col justify-center">
                                    <div className="font-medium text-white flex items-center gap-2 truncate">
                                        <Car className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span className="truncate">{vehicle.model}</span>
                                    </div>
                                    <div className="text-xs text-slate-500 font-mono ml-6">{vehicle.license_plate}</div>
                                </div>

                                {/* Timeline Columns */}
                                <div className="grid relative" style={{ gridTemplateColumns: `repeat(${daysToShow.length}, minmax(0, 1fr))` }}>
                                    {/* Grid Lines Background */}
                                    {daysToShow.map((day, i) => (
                                        <div key={i} className={`border-l border-slate-700/20 h-full ${day.toDateString() === new Date().toDateString() ? 'bg-brand-900/10' : ''}`}></div>
                                    ))}

                                    {/* Reservations Bars */}
                                    {reservations
                                        .filter(r => r.vehicle_id === vehicle.id)
                                        .map(reservation => {
                                            const start = new Date(reservation.start_date);
                                            const end = new Date(reservation.end_date);

                                            // View Boundaries
                                            const viewStart = daysToShow[0];
                                            const viewEnd = new Date(daysToShow[daysToShow.length - 1]);
                                            viewEnd.setHours(23, 59, 59, 999);

                                            // Normalize comparison dates
                                            const viewStartMs = new Date(viewStart).setHours(0, 0, 0, 0);

                                            // Check intersection
                                            if (end.getTime() < viewStartMs || start.getTime() > viewEnd.getTime()) return null;

                                            // Calculate position
                                            const totalDuration = viewEnd.getTime() - viewStartMs;

                                            // Start
                                            let startTime = start.getTime();
                                            if (startTime < viewStartMs) startTime = viewStartMs;
                                            const offsetMs = startTime - viewStartMs;
                                            const leftPercent = (offsetMs / totalDuration) * 100;

                                            // End
                                            let endTime = end.getTime();
                                            if (endTime > viewEnd.getTime()) endTime = viewEnd.getTime();
                                            const durationMs = endTime - startTime;
                                            const widthPercent = (durationMs / totalDuration) * 100;

                                            return (
                                                <div
                                                    key={reservation.id}
                                                    className="absolute top-2 bottom-2 bg-blue-600 hover:bg-blue-500 border border-blue-400/50 rounded-md shadow-sm cursor-pointer transition-all z-10 overflow-hidden flex flex-col justify-center px-2 group/res"
                                                    style={{
                                                        left: `${leftPercent}%`,
                                                        width: `${widthPercent}%`,
                                                        minWidth: '4px' // Ensure visibility for short events
                                                    }}
                                                    title={`${reservation.purpose} - ${reservation.driver?.name}`}
                                                >
                                                    <span className="text-xs text-white font-bold truncate drop-shadow-md leading-tight">
                                                        {reservation.purpose?.split(' - ')[0] || 'Reserva'}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-slate-700/50 bg-slate-800/30 flex gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-600 border border-blue-400/50"></div>
                    <span>Reserva Confirmada</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-brand-900/10 border border-slate-700/30"></div>
                    <span>Dia Atual</span>
                </div>
            </div>
        </div>
    );
}
