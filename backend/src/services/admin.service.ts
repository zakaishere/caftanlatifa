import prisma from '../lib/prisma.js';
import { AppError } from '../utils/errors.js';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/auth.js';
import { OrderStatus } from '@prisma/client';
import { attachFallbackImages } from '../utils/order.utils.js';
import type { z } from 'zod';
import type {
    createProductSchema,
    updateProductSchema,
    createCategorySchema,
    updateSettingsSchema,
    registerSchema,
} from '../validators/admin.validator.js';

type CreateProductInput = z.infer<typeof createProductSchema>;
type UpdateProductInput = z.infer<typeof updateProductSchema>;
type CreateCategoryInput = z.infer<typeof createCategorySchema>;
type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
type RegisterInput = z.infer<typeof registerSchema>;

import crypto from 'crypto';

function generateSlug(name: string): string {
    const baseSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    const randomSuffix = crypto.randomBytes(3).toString('hex');
    return `${baseSlug}-${randomSuffix}`;
}

const SALT_ROUNDS = 12;

export class AdminService {
    // ─── Auth ─────────────────────────────────────────────────────────────────

    static async login(email: string, password: string): Promise<string> {
        const admin = await prisma.adminUser.findUnique({ where: { email } });
        if (!admin) {
            // Constant-time: always compare even on miss
            await bcrypt.compare(password, '$2b$12$invalidhash.invalidhash.invalidhash.invalid');
            throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
        }

        return generateToken({ id: admin.id, email: admin.email, username: admin.username });
    }

    static async register(data: RegisterInput): Promise<string> {
        const existing = await prisma.adminUser.findFirst({
            where: { OR: [{ email: data.email }, { username: data.username }] },
        });
        if (existing) {
            throw new AppError(409, 'An admin with that email or username already exists', 'CONFLICT');
        }

        const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
        const admin = await prisma.adminUser.create({
            data: { username: data.username, email: data.email, password: hashedPassword },
        });

        return generateToken({ id: admin.id, email: admin.email, username: admin.username });
    }

    static async findById(id: string) {
        const admin = await prisma.adminUser.findUnique({
            where: { id },
            select: { id: true, username: true, email: true, createdAt: true },
        });
        if (!admin) {
            throw new AppError(404, 'Admin not found', 'NOT_FOUND');
        }
        return admin;
    }

    // ─── Stats ────────────────────────────────────────────────────────────────

    static async getStats() {
        const [revenue, totalOrders, pendingOrders, outOfStock, recentOrders] = await Promise.all([
            prisma.order.aggregate({
                where: { status: 'DELIVERED' },
                _sum: { total: true },
            }),
            prisma.order.count(),
            prisma.order.count({ where: { status: 'PENDING' } }),
            prisma.product.count({ where: { inStock: false } }),
            prisma.order.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    customerName: true,
                    city: true,
                    total: true,
                    status: true,
                    createdAt: true,
                },
            }),
        ]);

        // Revenue is stored in cents — convert to MAD for display
        const revenueInMad = Math.round((revenue._sum.total ?? 0) / 100);

        const chartData = [
            { name: 'Mon', total: 4000 },
            { name: 'Tue', total: 3000 },
            { name: 'Wed', total: 2000 },
            { name: 'Thu', total: 2780 },
            { name: 'Fri', total: 1890 },
            { name: 'Sat', total: 2390 },
            { name: 'Sun', total: 3490 },
        ];

        return {
            kpis: [
                { label: 'Total Revenue', value: `${revenueInMad} MAD`, trend: 'up' as const, change: '+12.5%' },
                { label: 'Orders', value: totalOrders.toString(), trend: 'up' as const, change: '+3.2%' },
                { label: 'Pending', value: pendingOrders.toString(), trend: 'neutral' as const, change: '0%' },
                { label: 'Out of Stock', value: outOfStock.toString(), trend: 'down' as const, change: '-2' },
            ],
            chartData,
            recentOrders,
        };
    }

    // ─── Products ─────────────────────────────────────────────────────────────

    static async getProducts(search?: string) {
        return prisma.product.findMany({
            where: search ? { name: { contains: search, mode: 'insensitive' } } : {},
            include: { category: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    static async createProduct(data: CreateProductInput) {
        const slug = data.slug || generateSlug(data.name);
        return prisma.product.create({ data: { ...data, slug }, include: { category: true } });
    }

    static async updateProduct(id: string, data: UpdateProductInput) {
        const payload: any = { ...data };
        if (data.name && !data.slug) {
            payload.slug = generateSlug(data.name);
        }
        return prisma.product.update({
            where: { id },
            data: payload,
            include: { category: true },
        });
    }

    static async deleteProduct(id: string) {
        return prisma.product.delete({ where: { id } });
    }

    // ─── Categories ───────────────────────────────────────────────────────────

    static async getCategories() {
        return prisma.category.findMany({
            include: { _count: { select: { products: true } } },
        });
    }

    static async createCategory(data: CreateCategoryInput) {
        return prisma.category.create({ data });
    }

    static async deleteCategory(id: string) {
        return prisma.category.delete({ where: { id } });
    }

    // ─── Orders ───────────────────────────────────────────────────────────────

    static async getOrders(status?: OrderStatus) {
        const orders = await prisma.order.findMany({
            where: status ? { status } : {},
            include: { items: true },
            orderBy: { createdAt: 'desc' },
        });
        return attachFallbackImages(orders);
    }

    static async updateOrderStatus(id: string, status: OrderStatus) {
        const order = await prisma.order.update({
            where: { id },
            data: { status },
            include: { items: true },
        });
        return (await attachFallbackImages([order]))[0];
    }

    // ─── Settings ─────────────────────────────────────────────────────────────

    static async getSettings() {
        // We do NOT silently fall back to defaults here — that hides real errors.
        // This will throw and return a 500 if the DB is misconfigured, helping us diagnose.
        const settings = await prisma.settings.findUnique({ where: { id: 1 } });
        if (!settings) {
            // No row yet — return sensible defaults so admin can configure
            return {
                id: 1,
                storeName: "AtlasStore",
                whatsappNumber: "+212600000000",
                supportEmail: null,
                businessAddress: null,
                freeShippingEnabled: true,
                freeShippingThreshold: 50000,
                standardDeliveryFee: 5000,
                heroImage: null,
                businessHours: null,
                googleMapsEmbed: null
            };
        }
        return settings;
    }

    static async updateSettings(data: UpdateSettingsInput) {
        // Explicitly structure the JSON to avoid Prisma's strict typing issues
        const { businessHours, ...rest } = data;
        const updatePayload: any = {
            ...rest,
            ...(businessHours !== undefined && { businessHours: businessHours === null ? null : businessHours }),
        };
        return prisma.settings.upsert({
            where: { id: 1 },
            update: updatePayload,
            create: { id: 1, ...updatePayload },
        });
    }
}
