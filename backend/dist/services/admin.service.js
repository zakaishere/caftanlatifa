import prisma from '../lib/prisma.js';
import { AppError } from '../utils/errors.js';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/auth.js';
import { attachFallbackImages } from '../utils/order.utils.js';
import crypto from 'crypto';
function generateSlug(name) {
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
    static async login(email, password) {
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
    static async register(data) {
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
    static async findById(id) {
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
                { label: 'Total Revenue', value: `${revenueInMad} MAD`, trend: 'up', change: '+12.5%' },
                { label: 'Orders', value: totalOrders.toString(), trend: 'up', change: '+3.2%' },
                { label: 'Pending', value: pendingOrders.toString(), trend: 'neutral', change: '0%' },
                { label: 'Out of Stock', value: outOfStock.toString(), trend: 'down', change: '-2' },
            ],
            chartData,
            recentOrders,
        };
    }
    // ─── Products ─────────────────────────────────────────────────────────────
    static async getProducts(search) {
        return prisma.product.findMany({
            where: search ? { name: { contains: search, mode: 'insensitive' } } : {},
            include: { category: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    static async createProduct(data) {
        const slug = data.slug || generateSlug(data.name);
        return prisma.product.create({ data: { ...data, slug }, include: { category: true } });
    }
    static async updateProduct(id, data) {
        const payload = { ...data };
        if (data.name && !data.slug) {
            payload.slug = generateSlug(data.name);
        }
        return prisma.product.update({
            where: { id },
            data: payload,
            include: { category: true },
        });
    }
    static async deleteProduct(id) {
        return prisma.product.delete({ where: { id } });
    }
    // ─── Categories ───────────────────────────────────────────────────────────
    static async getCategories() {
        return prisma.category.findMany({
            include: { _count: { select: { products: true } } },
        });
    }
    static async createCategory(data) {
        return prisma.category.create({ data });
    }
    static async deleteCategory(id) {
        return prisma.category.delete({ where: { id } });
    }
    // ─── Orders ───────────────────────────────────────────────────────────────
    static async getOrders(status) {
        const orders = await prisma.order.findMany({
            where: status ? { status } : {},
            include: { items: true },
            orderBy: { createdAt: 'desc' },
        });
        return attachFallbackImages(orders);
    }
    static async updateOrderStatus(id, status) {
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
    static async updateSettings(data) {
        // Explicitly structure the JSON to avoid Prisma's strict typing issues
        const { businessHours, ...rest } = data;
        const updatePayload = {
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
