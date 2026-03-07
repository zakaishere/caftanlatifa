import { z } from 'zod';
export const PRODUCT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'ONE_SIZE'];
// Auth schemas
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});
export const registerSchema = z.object({
    username: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});
export const createProductSchema = z.object({
    name: z.string().min(2),
    categoryId: z.string().uuid(),
    price: z.number().int().positive(),
    shippingFee: z.number().int().min(0).default(0),
    description: z.string().min(10),
    images: z.array(z.string().url()).min(1, "At least one image is required"),
    specs: z.record(z.string()).optional(),
    inStock: z.boolean().optional(),
    availableSizes: z.array(z.enum(PRODUCT_SIZES)).optional().default([]),
});
export const updateProductSchema = createProductSchema.partial().extend({
// The 'images' field is already optional due to .partial()
// If you wanted to allow an empty array for update, you'd need to override it:
// images: z.array(z.string().url()).optional(),
});
export const createCategorySchema = z.object({
    name: z.string().min(2),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be url-friendly'),
});
export const updateOrderStatusSchema = z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED']),
});
const timeSlotSchema = z.object({
    start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format HH:MM invalide"),
    end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format HH:MM invalide"),
}).refine(data => data.start < data.end, {
    message: "L'heure de fin doit être après l'heure de début",
});
const dayScheduleSchema = z.object({
    isOpen: z.boolean(),
    slots: z.array(timeSlotSchema).max(2, "Maximum 2 plages horaires"),
});
const businessHoursSchema = z.object({
    timezone: z.literal("Africa/Casablanca"),
    regularHours: z.object({
        lundi: dayScheduleSchema,
        mardi: dayScheduleSchema,
        mercredi: dayScheduleSchema,
        jeudi: dayScheduleSchema,
        vendredi: dayScheduleSchema,
        samedi: dayScheduleSchema,
        dimanche: dayScheduleSchema,
    }),
    exceptions: z.array(z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        name: z.string(),
        isOpen: z.boolean(),
        slots: z.array(timeSlotSchema)
    })).optional().default([]),
    lastUpdated: z.string().datetime()
});
export const updateSettingsSchema = z.object({
    storeName: z.string().optional(),
    whatsappNumber: z.string().optional(),
    supportEmail: z.string().email().optional().nullable(),
    businessAddress: z.string().optional().nullable(),
    freeShippingEnabled: z.boolean().optional(),
    freeShippingThreshold: z.number().int().min(0).optional(),
    standardDeliveryFee: z.number().int().min(0).optional(),
    heroImage: z.string().url().optional().nullable(),
    businessHours: businessHoursSchema.optional().nullable(),
    googleMapsEmbed: z.string().optional().nullable(),
});
