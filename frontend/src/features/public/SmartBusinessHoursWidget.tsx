"use client";
import React, { useState, useEffect } from 'react';
import { Clock, ChevronDown, ChevronUp, AlertCircle, Info } from 'lucide-react';
import { BusinessHoursConfig } from '@/lib/types';
import { getStoreStatus, StoreStatus } from '@/lib/businessHours';
import { cn } from '@/lib/utils';

interface Props {
    config?: BusinessHoursConfig | null;
    isLoading?: boolean;
}

export function SmartBusinessHoursWidget({ config, isLoading }: Props) {
    const [status, setStatus] = useState<StoreStatus | null>(null);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (config) {
            setStatus(getStoreStatus(config));
            const interval = setInterval(() => setStatus(getStoreStatus(config)), 60000);
            return () => clearInterval(interval);
        } else if (config === null) {
            setStatus({ isOpenNow: false, statusText: "Horaires indisponibles" });
        }
    }, [config]);

    // Skeleton loader for a premium feel
    if (isLoading) {
        return (
            <div className="bg-white border border-primary/10 p-10 md:p-12 shadow-2xl shadow-primary/5 animate-pulse">
                <div className="flex items-center gap-6 mb-8">
                    <div className="h-14 w-14 bg-primary/5 border border-primary/10" />
                    <div className="h-8 w-32 bg-primary/5" />
                </div>
                <div className="h-24 w-full bg-primary/5 mb-6" />
                <div className="h-4 w-40 bg-primary/5" />
            </div>
        );
    }

    const currentDayNames: (keyof BusinessHoursConfig['regularHours'])[] = [
        'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'
    ];

    // If still no config after loading, show a soft fallback instead of hiding completely
    if (!config) {
        return (
            <div className="bg-white border border-primary/10 p-10 md:p-12 shadow-2xl shadow-primary/5">
                <div className="flex items-center gap-6 mb-8">
                    <div className="h-14 w-14 rounded-none bg-primary/5 flex items-center justify-center text-primary/40 border border-primary/10">
                        <Clock className="h-6 w-6 stroke-1" />
                    </div>
                    <h2 className="font-serif text-2xl text-foreground/40 tracking-tight">Horaires</h2>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground/60 italic text-sm">
                    <Info className="w-4 h-4" />
                    <p>Horaires d'ouverture non configurés.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-primary/10 p-10 md:p-12 shadow-2xl shadow-primary/5 transition-all duration-500 hover:shadow-primary/10 group">
            <div className="flex items-center gap-6 mb-10">
                <div className="h-14 w-14 rounded-none bg-primary/5 flex items-center justify-center text-primary border border-primary/10 transition-colors group-hover:bg-primary group-hover:text-white duration-500">
                    <Clock className="h-6 w-6 stroke-1" />
                </div>
                <div>
                    <h2 className="font-serif text-2xl text-foreground tracking-tight">Horaires</h2>
                    <span className="text-[9px] uppercase tracking-[0.3em] text-primary/60 font-medium">Atelier & Showroom</span>
                </div>
            </div>

            {status && (
                <div className="mb-8 relative overflow-hidden">
                    {/* Status Badge */}
                    <div className={cn(
                        "inline-flex items-center gap-2 px-4 py-1.5 mb-4 text-[10px] uppercase tracking-[0.2em] font-bold border transition-colors duration-500",
                        status.isOpenNow
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                    )}>
                        <span className={cn(
                            "w-1.5 h-1.5 rounded-full animate-pulse",
                            status.isOpenNow ? "bg-emerald-500" : "bg-rose-500"
                        )} />
                        {status.statusText}
                    </div>

                    <div className="space-y-1">
                        <p className="text-xl font-medium tracking-tight text-foreground">
                            {status.isOpenNow && status.closeTime ? (
                                <>Aujourd'hui jusqu'à <span className="text-primary font-serif italic ml-1">{status.closeTime}</span></>
                            ) : status.nextOpenTime ? (
                                <>Ouvre <span className="text-primary font-serif italic mx-1">{status.nextOpenTime.day}</span> à {status.nextOpenTime.time}</>
                            ) : (
                                "Actuellement fermé"
                            )}
                        </p>

                        {status.exceptionName && (
                            <div className="flex items-center gap-2 text-[10px] text-primary font-medium uppercase tracking-widest mt-2 border-l-2 border-primary/20 pl-3">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {status.exceptionName}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center justify-between w-full pt-6 border-t border-primary/5 text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground/60 hover:text-primary transition-all group/btn"
            >
                <span className="group-hover/btn:translate-x-1 transition-transform">Voir le détail de la semaine</span>
                <div className={cn(
                    "h-6 w-6 rounded-full border border-primary/10 flex items-center justify-center transition-all",
                    expanded ? "bg-primary text-white" : "group-hover/btn:border-primary group-hover/btn:text-primary"
                )}>
                    {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </div>
            </button>

            {expanded && (
                <div className="space-y-5 mt-8 animate-in slide-in-from-top-2 fade-in duration-500">
                    {currentDayNames.map((day, idx) => {
                        const dayData = config.regularHours[day];
                        const isToday = status?.statusText.toLowerCase() !== "horaires indisponibles" &&
                            new Date().toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase() === day;

                        return (
                            <div key={day} className={cn(
                                "flex justify-between items-baseline py-1 transition-colors",
                                isToday ? "text-primary scale-[1.02]" : "text-foreground"
                            )}>
                                <div className="flex items-center gap-3">
                                    <span className={cn(
                                        "text-[11px] uppercase tracking-[0.2em] font-medium min-w-[80px]",
                                        isToday ? "text-primary" : "text-muted-foreground/70"
                                    )}>
                                        {day}
                                    </span>
                                    {isToday && <span className="h-1 w-1 rounded-full bg-primary" />}
                                </div>

                                {!dayData.isOpen ? (
                                    <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-muted-foreground/40 italic">Fermé</span>
                                ) : (
                                    <div className="text-[12px] font-medium tabular-nums text-right">
                                        {dayData.slots.map((slot, sIdx) => (
                                            <div key={sIdx} className="leading-none mb-1 last:mb-0">
                                                {slot.start} — {slot.end}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

