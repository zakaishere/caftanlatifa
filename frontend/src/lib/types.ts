// Shared API types matching the Prisma schema / backend responses

export interface ApiCategory {
    id: string;
    name: string;
    slug: string;
    _count?: { products: number };
}

export interface ApiProduct {
    id: string;
    name: string;
    price: number; // in cents (MAD × 100)
    description: string;
    images: string[];
    inStock: boolean;
    specs?: Record<string, string> | null;
    categoryId: string;
    category: ApiCategory;
    createdAt: string;
}

export interface ApiOrderItem {
    id: string;
    orderId: string;
    productId: string | null;
    name: string;
    price: number; // cents
    quantity: number;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';

export interface ApiOrder {
    id: string;
    customerName: string;
    phone: string;
    city?: string | null;
    address?: string | null;
    notes?: string | null;
    total: number; // cents
    deliveryFee: number; // cents
    deliveryMethod: 'DELIVERY' | 'PICKUP';
    status: OrderStatus;
    items: ApiOrderItem[];
    createdAt: string;
    updatedAt: string;
}

export interface TimeSlot {
    start: string; // "09:00"
    end: string;   // "19:00"
}

export interface DaySchedule {
    isOpen: boolean;
    slots: TimeSlot[];
}

export interface ScheduleException {
    date: string; // "YYYY-MM-DD"
    name: string;
    isOpen: boolean;
    slots: TimeSlot[];
}

export interface BusinessHoursConfig {
    timezone: string; // "Africa/Casablanca"
    regularHours: {
        lundi: DaySchedule;
        mardi: DaySchedule;
        mercredi: DaySchedule;
        jeudi: DaySchedule;
        vendredi: DaySchedule;
        samedi: DaySchedule;
        dimanche: DaySchedule;
    };
    exceptions: ScheduleException[];
    lastUpdated: string;
}

export interface ApiSettings {
    id: number;
    storeName: string;
    whatsappNumber: string;
    supportEmail?: string | null;
    businessAddress?: string | null;
    freeShippingEnabled: boolean;
    freeShippingThreshold: number;
    standardDeliveryFee: number;
    heroImage?: string | null;
    businessHours?: BusinessHoursConfig | null;
    googleMapsEmbed?: string | null;
}

export interface ApiInitData {
    featuredProducts: ApiProduct[];
    categories: ApiCategory[];
    settings: ApiSettings | null;
}

export interface ApiStats {
    kpis: {
        label: string;
        value: string;
        trend: 'up' | 'down' | 'neutral';
        change: string;
    }[];
    chartData: { name: string; total: number }[];
    recentOrders: {
        id: string;
        customerName: string;
        city: string;
        total: number;
        status: OrderStatus;
        createdAt: string;
    }[];
}

// Cart item type for frontend cart context
export interface CartItem {
    id: string;
    name: string;
    price: number; // cents
    images: string[];
    inStock: boolean;
    description: string;
    category: ApiCategory;
    categoryId: string;
    quantity: number;
}

// Helper: convert cents to MAD display string
export function centsToMad(cents: number): string {
    return (cents / 100).toFixed(0);
}

// Helper: filter params for products API
export interface ProductFilters {
    category?: string;
    search?: string;
    inStock?: boolean;
    minPrice?: number; // cents
    maxPrice?: number; // cents
}
