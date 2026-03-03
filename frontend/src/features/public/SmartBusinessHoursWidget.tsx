"use client";
import React, { useState, useEffect } from 'react';
import { Clock, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { BusinessHoursConfig } from '@/lib/types';
import { getStoreStatus, StoreStatus } from '@/lib/businessHours';

interface Props {
    config?: BusinessHoursConfig | null;
}

export function SmartBusinessHoursWidget({ config }: Props) {
    const [status, setStatus] = useState<StoreStatus | null>(null);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (config) {
            setStatus(getStoreStatus(config));
            // Optionally set an interval to refresh status if staying on page long
            const interval = setInterval(() => setStatus(getStoreStatus(config)), 60000);
            return () => clearInterval(interval);
        }
    }, [config]);

    if (!config) return null;

    const currentDayNames: (keyof BusinessHoursConfig['regularHours'])[] = [
        'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'
    ];

    return (
        <div className="relative">
            <div className="flex items-center gap-6 mb-8">
                <div className="h-14 w-14 rounded-none bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                    <Clock className="h-6 w-6 stroke-1" />
                </div>
                <h2 className="font-serif text-2xl text-foreground tracking-tight">Horaires</h2>
            </div>

            {status && (
                <div className="mb-6 p-5 bg-muted/40 border border-primary/10 rounded-none flex flex-col gap-2 shadow-inner">
                    {status.exceptionName && (
                        <div className="text-[10px] uppercase tracking-widest text-primary flex items-center gap-2 mb-1">
                            <AlertCircle className="w-3 h-3" /> {status.exceptionName}
                        </div>
                    )}

                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${status.isOpenNow ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className={`font-medium ${status.isOpenNow ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {status.statusText}
                            </span>
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground pl-4.5">
                        {status.isOpenNow && status.closeTime && (
                            <>Ferme à {status.closeTime}</>
                        )}
                        {!status.isOpenNow && status.nextOpenTime && (
                            <>Ouvre {status.nextOpenTime.day} à {status.nextOpenTime.time}</>
                        )}
                    </p>
                </div>
            )}

            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center justify-between w-full text-[11px] uppercase tracking-[0.2em] font-medium text-muted-foreground hover:text-primary transition-colors mb-2"
            >
                <span>Voir tous les horaires</span>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {expanded && (
                <div className="space-y-3 mt-6 animate-in slide-in-from-top-2 fade-in">
                    {currentDayNames.map((day, idx, arr) => {
                        const dayData = config.regularHours[day];
                        return (
                            <div key={day}>
                                <div className="flex justify-between items-center text-[11px] uppercase tracking-[0.2em]">
                                    <span className="text-muted-foreground/60 w-24">{day}</span>
                                    {!dayData.isOpen ? (
                                        <span className="text-primary font-bold">Fermé</span>
                                    ) : (
                                        <div className="text-foreground font-medium text-right space-y-1">
                                            {dayData.slots.map((slot, idx) => (
                                                <div key={idx} className="tabular-nums">
                                                    {slot.start} - {slot.end}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {idx < arr.length - 1 && <div className="h-[1px] w-full bg-primary/5 mt-3" />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
