import prisma from '../lib/prisma.js';
import { AppError } from '../utils/errors.js';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/auth.js';
import { OrderStatus } from '@prisma/client';
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
        return prisma.product.create({ data, include: { category: true } });
    }

    static async updateProduct(id: string, data: UpdateProductInput) {
        return prisma.product.update({
            where: { id },
            data,
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
        return prisma.order.findMany({
            where: status ? { status } : {},
            include: { items: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    static async updateOrderStatus(id: string, status: OrderStatus) {
        return prisma.order.update({
            where: { id },
            data: { status },
            include: { items: true },
        });
    }

    // ─── Settings ─────────────────────────────────────────────────────────────

    static async getSettings() {
        try {
            return await prisma.settings.findUnique({ where: { id: 1 } });
        } catch (error: any) {
            console.warn('Could not fetch settings (possible schema mismatch):', error.message);
            // Fallback to default values if table is missing columns or doesn't exist
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
                businessHours: {
                    timezone: "Africa/Casablanca",
                    regularHours: {
                        lundi: { isOpen: true, slots: [{ start: "09:00", end: "19:00" }] },
                        mardi: { isOpen: true, slots: [{ start: "09:00", end: "19:00" }] },
                        mercredi: { isOpen: true, slots: [{ start: "09:00", end: "19:00" }] },
                        jeudi: { isOpen: true, slots: [{ start: "09:00", end: "19:00" }] },
                        vendredi: { isOpen: true, slots: [{ start: "09:00", end: "19:00" }] },
                        samedi: { isOpen: true, slots: [{ start: "09:00", end: "19:00" }] },
                        dimanche: { isOpen: false, slots: [] }
                    },
                    exceptions: [],
                    lastUpdated: new Date().toISOString()
                },
                googleMapsEmbed: null
            };
        }
    }

    static async updateSettings(data: UpdateSettingsInput) {
        return prisma.settings.upsert({
            where: { id: 1 },
            update: data,
            create: { id: 1, ...data },
        });
    }
}
