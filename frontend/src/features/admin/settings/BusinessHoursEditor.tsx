"use client";
import React, { useState, useEffect } from 'react';
import { BusinessHoursConfig, DaySchedule, TimeSlot } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Copy, AlertCircle } from 'lucide-react';

interface BusinessHoursEditorProps {
    value?: BusinessHoursConfig | null;
    onChange: (value: BusinessHoursConfig) => void;
}

const DEFAULT_SLOT: TimeSlot = { start: "09:00", end: "19:00" };
const DEFAULT_CONFIG: BusinessHoursConfig = {
    timezone: "Africa/Casablanca",
    regularHours: {
        lundi: { isOpen: true, slots: [{ ...DEFAULT_SLOT }] },
        mardi: { isOpen: true, slots: [{ ...DEFAULT_SLOT }] },
        mercredi: { isOpen: true, slots: [{ ...DEFAULT_SLOT }] },
        jeudi: { isOpen: true, slots: [{ ...DEFAULT_SLOT }] },
        vendredi: { isOpen: true, slots: [{ ...DEFAULT_SLOT }] },
        samedi: { isOpen: true, slots: [{ ...DEFAULT_SLOT }] },
        dimanche: { isOpen: false, slots: [] },
    },
    exceptions: [],
    lastUpdated: new Date().toISOString()
};

const DAY_KEYS: (keyof BusinessHoursConfig['regularHours'])[] = [
    'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'
];

export function BusinessHoursEditor({ value, onChange }: BusinessHoursEditorProps) {
    const [config, setConfig] = useState<BusinessHoursConfig>(value || DEFAULT_CONFIG);
    const [isAdvanced, setIsAdvanced] = useState(false);

    // Sync upwards whenever config changes
    useEffect(() => {
        onChange(config);
    }, [config, onChange]);

    // Sync downwards if prop updates entirely (e.g. from fetch)
    useEffect(() => {
        if (value && value.lastUpdated !== config.lastUpdated) {
            setConfig(value);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const updateDaySchedule = (day: keyof BusinessHoursConfig['regularHours'], updates: Partial<DaySchedule>) => {
        setConfig(prev => ({
            ...prev,
            regularHours: {
                ...prev.regularHours,
                [day]: { ...prev.regularHours[day], ...updates }
            },
            lastUpdated: new Date().toISOString()
        }));
    };

    const updateDaySlot = (day: keyof BusinessHoursConfig['regularHours'], slotIndex: number, field: 'start' | 'end', val: string) => {
        setConfig(prev => {
            const dayData = prev.regularHours[day];
            const newSlots = [...dayData.slots];
            newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: val };
            return {
                ...prev,
                regularHours: { ...prev.regularHours, [day]: { ...dayData, slots: newSlots } },
                lastUpdated: new Date().toISOString()
            };
        });
    };

    const addSlot = (day: keyof BusinessHoursConfig['regularHours']) => {
        setConfig(prev => {
            const dayData = prev.regularHours[day];
            if (dayData.slots.length >= 2) return prev;
            return {
                ...prev,
                regularHours: { ...prev.regularHours, [day]: { ...dayData, slots: [...dayData.slots, { start: "14:00", end: "19:00" }] } },
                lastUpdated: new Date().toISOString()
            };
        });
    };

    const removeSlot = (day: keyof BusinessHoursConfig['regularHours'], slotIndex: number) => {
        setConfig(prev => {
            const dayData = prev.regularHours[day];
            const newSlots = [...dayData.slots];
            newSlots.splice(slotIndex, 1);
            return {
                ...prev,
                regularHours: { ...prev.regularHours, [day]: { ...dayData, slots: newSlots } },
                lastUpdated: new Date().toISOString()
            };
        });
    };

    const copyMondayToAll = () => {
        setConfig(prev => {
            const monday = prev.regularHours.lundi;
            return {
                ...prev,
                regularHours: {
                    lundi: monday,
                    mardi: monday,
                    mercredi: monday,
                    jeudi: monday,
                    vendredi: monday,
                    samedi: monday,
                    dimanche: prev.regularHours.dimanche // Keep sunday as is usually
                },
                lastUpdated: new Date().toISOString()
            };
        });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Horaires d'ouverture</CardTitle>
                        <CardDescription>Configurez vos heures de travail (Heure de Casablanca).</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="advanced-mode" className="text-xs">Mode Avancé</Label>
                        <Switch id="advanced-mode" checked={isAdvanced} onCheckedChange={setIsAdvanced} />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* SIMPLE MODE */}
                {!isAdvanced && (
                    <div className="space-y-6">
                        <div className="bg-primary/5 p-4 rounded-md border border-primary/10 flex items-start gap-3 text-sm text-primary">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <p>Le mode simple applique le Lundi comme modèle pour toute la semaine (sauf les jours fermés).</p>
                        </div>

                        <div className="grid gap-4">
                            <Label>Ajuster les horaires standards</Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    type="time"
                                    value={config.regularHours.lundi.slots[0]?.start || "09:00"}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const mondaySlots = [...config.regularHours.lundi.slots];
                                        if (mondaySlots.length === 0) mondaySlots.push({ start: val, end: "19:00" });
                                        else mondaySlots[0].start = val;
                                        updateDaySchedule('lundi', { slots: mondaySlots });
                                        // Automatically copy to others via effect? No, let's just do it directly
                                        config.regularHours.lundi.slots = mondaySlots;
                                        copyMondayToAll();
                                    }}
                                />
                                <span>à</span>
                                <Input
                                    type="time"
                                    value={config.regularHours.lundi.slots[0]?.end || "19:00"}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const mondaySlots = [...config.regularHours.lundi.slots];
                                        if (mondaySlots.length === 0) mondaySlots.push({ start: "09:00", end: val });
                                        else mondaySlots[0].end = val;
                                        config.regularHours.lundi.slots = mondaySlots;
                                        copyMondayToAll();
                                    }}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4">
                            <Label>Jours Fermés</Label>
                            <div className="flex flex-wrap gap-2">
                                {DAY_KEYS.map((day) => {
                                    const isClosed = !config.regularHours[day].isOpen;
                                    return (
                                        <Button
                                            key={day}
                                            type="button"
                                            variant={isClosed ? "default" : "outline"}
                                            className={isClosed ? "bg-primary text-white" : "capitalize"}
                                            onClick={() => {
                                                updateDaySchedule(day, { isOpen: isClosed });
                                            }}
                                        >
                                            {day}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ADVANCED MODE */}
                {isAdvanced && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex justify-between items-center bg-muted/50 p-3 rounded border">
                            <span className="text-sm font-medium">Programme de la semaine</span>
                            <Button size="sm" variant="outline" onClick={copyMondayToAll} className="h-8 text-xs">
                                <Copy className="h-3 w-3 mr-2" /> Appliquer Lundi à Ven.
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {DAY_KEYS.map(day => {
                                const dayData = config.regularHours[day];
                                return (
                                    <div key={day} className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 border rounded-md bg-card">
                                        <div className="w-32 flex items-center gap-3">
                                            <Switch
                                                checked={dayData.isOpen}
                                                onCheckedChange={(checked) => {
                                                    updateDaySchedule(day, {
                                                        isOpen: checked,
                                                        slots: checked && dayData.slots.length === 0 ? [{ ...DEFAULT_SLOT }] : dayData.slots
                                                    });
                                                }}
                                            />
                                            <span className="capitalize font-medium block">{day}</span>
                                        </div>

                                        <div className="flex-1 space-y-3">
                                            {!dayData.isOpen ? (
                                                <span className="text-sm text-muted-foreground italic flex h-10 items-center">Fermé</span>
                                            ) : (
                                                <>
                                                    {dayData.slots.map((slot, idx) => (
                                                        <div key={idx} className="flex items-center gap-2">
                                                            <Input
                                                                type="time"
                                                                value={slot.start}
                                                                onChange={(e) => updateDaySlot(day, idx, 'start', e.target.value)}
                                                                className="w-32"
                                                            />
                                                            <span className="text-muted-foreground">-</span>
                                                            <Input
                                                                type="time"
                                                                value={slot.end}
                                                                onChange={(e) => updateDaySlot(day, idx, 'end', e.target.value)}
                                                                className="w-32"
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeSlot(day, idx)}
                                                                className="text-muted-foreground hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    {dayData.slots.length < 2 && (
                                                        <Button variant="ghost" size="sm" onClick={() => addSlot(day)} className="text-xs text-primary">
                                                            <Plus className="h-3 w-3 mr-1" /> Ajouter une pause
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
