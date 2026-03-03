import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { BusinessHoursConfig } from './types';

// The store operates in Morocco time
export const STORE_TIMEZONE = 'Africa/Casablanca';

export type StoreStatus = {
    isOpenNow: boolean;
    statusText: string;
    closeTime?: string;
    nextOpenTime?: { day: string; time: string; isToday: boolean };
    exceptionName?: string;
};

export function getStoreStatus(config?: BusinessHoursConfig | null): StoreStatus {
    if (!config) {
        return { isOpenNow: false, statusText: "Horaires indisponibles" };
    }

    const now = new Date();

    // Use config timezone if available, otherwise default to Casablanca
    const timeZone = config.timezone || STORE_TIMEZONE;
    const zonedNow = toZonedTime(now, timeZone);

    const todayDateStr = formatInTimeZone(now, timeZone, 'yyyy-MM-dd');
    // EEEE gives full day name in English by default, but we need our French keys mapping
    // Since date-fns locale mapping is heavy, we can just use getDay() on the zoned time.
    // 0 = Sunday, 1 = Monday
    const dayIndex = zonedNow.getDay();
    const dayNames: (keyof BusinessHoursConfig['regularHours'])[] = [
        'dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'
    ];
    const todayDayName = dayNames[dayIndex];
    const currentHHMM = formatInTimeZone(now, timeZone, 'HH:mm');

    // 1. Check Exceptions first
    const exception = config.exceptions?.find(e => e.date === todayDateStr);
    const todaysSchedule = exception ? exception : config.regularHours[todayDayName];

    // If closed today entirely
    if (!todaysSchedule?.isOpen || !todaysSchedule.slots || todaysSchedule.slots.length === 0) {
        return {
            isOpenNow: false,
            statusText: "Fermé",
            nextOpenTime: findNextOpenSlot(config, zonedNow, timeZone),
            exceptionName: exception?.name
        };
    }

    // 2. Check if current time falls within any open slots today
    for (const slot of todaysSchedule.slots) {
        if (currentHHMM >= slot.start && currentHHMM < slot.end) {
            return {
                isOpenNow: true,
                statusText: "Ouvert maintenant",
                closeTime: slot.end,
                exceptionName: exception?.name
            };
        }
    }

    // 3. Store is open today, but we are outside of the slots
    // Are we before the first slot?
    const firstSlot = todaysSchedule.slots[0];
    if (currentHHMM < firstSlot.start) {
        return {
            isOpenNow: false,
            statusText: "Fermé",
            nextOpenTime: { day: 'aujourd\'hui', time: firstSlot.start, isToday: true },
            exceptionName: exception?.name
        };
    }

    // Are we in a lunch break? (Between slot 1 and slot 2)
    if (todaysSchedule.slots.length > 1) {
        const secondSlot = todaysSchedule.slots[1];
        if (currentHHMM >= firstSlot.end && currentHHMM < secondSlot.start) {
            return {
                isOpenNow: false,
                statusText: "Pause Midi",
                nextOpenTime: { day: 'aujourd\'hui', time: secondSlot.start, isToday: true },
                exceptionName: exception?.name
            };
        }
    }

    // We are past the last slot of the day.
    return {
        isOpenNow: false,
        statusText: "Fermé",
        nextOpenTime: findNextOpenSlot(config, zonedNow, timeZone),
        exceptionName: exception?.name
    };
}


function findNextOpenSlot(config: BusinessHoursConfig, zonedNow: Date, timeZone: string) {
    // Look ahead up to 7 days
    for (let offset = 1; offset <= 7; offset++) {
        // Add offset days to zonedNow
        const futureDate = new Date(zonedNow.getTime() + offset * 24 * 60 * 60 * 1000);
        const futureDateStr = formatInTimeZone(futureDate, timeZone, 'yyyy-MM-dd');

        const dayNames: (keyof BusinessHoursConfig['regularHours'])[] = [
            'dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'
        ];
        const futureDayName = dayNames[futureDate.getDay()];

        const exception = config.exceptions?.find(e => e.date === futureDateStr);
        const schedule = exception ? exception : config.regularHours[futureDayName];

        if (schedule?.isOpen && schedule.slots && schedule.slots.length > 0) {
            // Return the first slot of that day

            // Formatting the display day name (e.g., Lundi, Mardi)
            const displayDay = futureDayName.charAt(0).toUpperCase() + futureDayName.slice(1);

            return {
                day: offset === 1 ? 'demain' : displayDay,
                time: schedule.slots[0].start,
                isToday: false
            };
        }
    }

    return undefined; // Closed for more than a week?
}
