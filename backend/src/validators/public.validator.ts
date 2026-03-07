import { z } from 'zod';
import { PRODUCT_SIZES } from './admin.validator.js';

// ─── Order Schemas ────────────────────────────────────────────────────────────

export const orderItemSchema = z.object({
    /** Must be a valid product UUID — backend will fetch the price from DB */
    productId: z.string().uuid('productId must be a valid UUID'),
    name: z.string().min(1),
    quantity: z.number().int().positive(),
    size: z.enum(PRODUCT_SIZES).optional().nullable(),
});

export const createOrderSchema = z.object({
    customerName: z.string().min(2, 'Customer name is required'),
    email: z.string().email('Valid email is required').optional().or(z.literal('')),
    phone: z.string().min(8, 'Valid phone number is required'),
    deliveryMethod: z.enum(['DELIVERY', 'PICKUP']).default('DELIVERY'),
    city: z.string().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(orderItemSchema).min(1, 'At least one item is required'),
});

// ─── Contact Schema ───────────────────────────────────────────────────────────

export const contactSchema = z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    subject: z.string().min(5),
    message: z.string().min(10),
});

// ─── Product Filter Schema ────────────────────────────────────────────────────

export const productParamsSchema = z.object({
    category: z.string().optional(),
    search: z.string().optional(),
    inStock: z
        .enum(['true', 'false'])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === 'true')),
    minPrice: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : undefined)),
    maxPrice: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : undefined)),
    page: z
        .string()
        .optional()
        .transform((v) => (v ? Math.max(1, parseInt(v, 10)) : 1)),
    limit: z
        .string()
        .optional()
        .transform((v) => (v ? Math.min(100, parseInt(v, 10)) : 12)),
    sort: z.enum(['newest', 'price_asc', 'price_desc']).optional().default('newest'),
});
