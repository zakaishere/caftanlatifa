import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { BusinessHoursConfig } from './types';

// The store operates in Morocco time
export const STORE_TIMEZONE = 'Africa/Casablanca';

export type StoreStatus = {
    isOpenNow: boolean;
    statusTextKey: string;
    closeTime?: string;
    nextOpenTime?: { dayKey: string; time: string; isToday: boolean };
    exceptionName?: string;
};

/**
 * Extracts the src URL from a Google Maps iframe tag if provided,
 * or returns the string directly if it's already a URL.
 */
export function extractGoogleMapsUrl(input: string): string {
    if (!input) return "";
    if (input.includes('<iframe')) {
        const match = input.match(/src="([^"]+)"/);
        return match ? match[1] : "";
    }
    return input;
}

export function getStoreStatus(config?: BusinessHoursConfig | null): StoreStatus {
    if (!config) {
        return { isOpenNow: false, statusTextKey: "businessHours.unavailable" };
    }

    const now = new Date();

    // Use config timezone if available, otherwise default to Casablanca
    const timeZone = config.timezone || STORE_TIMEZONE;

    // Get the current time in the store's timezone
    const zonedNow = toZonedTime(now, timeZone);
    const todayDateStr = formatInTimeZone(now, timeZone, 'yyyy-MM-dd');

    // Get day index from the ZONED time (0=Sunday, 1=Monday)
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
            statusTextKey: "businessHours.closed",
            nextOpenTime: findNextOpenSlot(config, zonedNow, timeZone),
            exceptionName: exception?.name
        };
    }

    // 2. Check if current time falls within any open slots today
    for (const slot of todaysSchedule.slots) {
        if (currentHHMM >= slot.start && currentHHMM < slot.end) {
            return {
                isOpenNow: true,
                statusTextKey: "businessHours.openNow",
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
            statusTextKey: "businessHours.closed",
            nextOpenTime: { dayKey: 'businessHours.today', time: firstSlot.start, isToday: true },
            exceptionName: exception?.name
        };
    }

    // Are we in a lunch break? (Between slot 1 and slot 2)
    if (todaysSchedule.slots.length > 1) {
        const secondSlot = todaysSchedule.slots[1];
        if (currentHHMM >= firstSlot.end && currentHHMM < secondSlot.start) {
            return {
                isOpenNow: false,
                statusTextKey: "businessHours.lunchBreak",
                nextOpenTime: { dayKey: 'businessHours.today', time: secondSlot.start, isToday: true },
                exceptionName: exception?.name
            };
        }
    }

    // We are past the last slot of the day.
    return {
        isOpenNow: false,
        statusTextKey: "businessHours.closed",
        nextOpenTime: findNextOpenSlot(config, zonedNow, timeZone),
        exceptionName: exception?.name
    };
}


function findNextOpenSlot(config: BusinessHoursConfig, zonedNow: Date, timeZone: string) {
    // Look ahead up to 7 days
    for (let offset = 1; offset <= 7; offset++) {
        // Add offset days to zonedNow
        const futureDate = new Date(zonedNow.getTime() + offset * 24 * 60 * 60 * 1000);
        // CRITICAL: We must convert this future date back to the store's zoned perspective
        // to get the correct day of the week, especially around midnight.
        const futureZoned = toZonedTime(futureDate, timeZone);
        const futureDateStr = formatInTimeZone(futureDate, timeZone, 'yyyy-MM-dd');

        const dayNames: (keyof BusinessHoursConfig['regularHours'])[] = [
            'dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'
        ];
        const futureDayName = dayNames[futureZoned.getDay()];

        const exception = config.exceptions?.find(e => e.date === futureDateStr);
        const schedule = exception ? exception : config.regularHours[futureDayName];

        if (schedule?.isOpen && schedule.slots && schedule.slots.length > 0) {
            // Return the first slot of that day
            return {
                dayKey: offset === 1 ? 'businessHours.tomorrow' : `days.${futureDayName}`,
                time: schedule.slots[0].start,
                isToday: false
            };
        }
    }

    return undefined; // Closed for more than a week?
}
