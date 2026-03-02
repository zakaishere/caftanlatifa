import prisma from '../lib/prisma.js';
import { AppError } from '../utils/errors.js';
import type { z } from 'zod';
import type { createOrderSchema, productParamsSchema } from '../validators/public.validator.js';
// import { sendOrderReceipt } from '../emails/receipt.js';

type ProductFilters = z.infer<typeof productParamsSchema>;
type CreateOrderInput = z.infer<typeof createOrderSchema>;

export class PublicService {
    static async getInitData() {
        let settings = null;
        try {
            settings = await prisma.settings.findUnique({ where: { id: 1 } });
        } catch (error: any) {
            console.warn('Could not fetch settings (possible schema mismatch):', error.message);
            // Fallback to default values if table is missing columns or doesn't exist
            settings = {
                id: 1,
                storeName: "AtlasStore",
                whatsappNumber: "+212600000000",
                supportEmail: null,
                businessAddress: null,
                freeShippingEnabled: true,
                freeShippingThreshold: 50000,
                standardDeliveryFee: 5000,
                heroImage: null,
                logoUrl: null,
                ogImageUrl: null,
                ogDescription: null,
                googleMapsEmbed: null
            };
        }

        const [featuredProducts, categories] = await Promise.all([
            prisma.product.findMany({
                where: { inStock: true },
                take: 4,
                include: { category: true },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.category.findMany({
                include: { _count: { select: { products: true } } },
            }),
        ]);

        return { featuredProducts, categories, settings };
    }

    static async getProducts(filters: ProductFilters) {
        const { category, search, inStock, minPrice, maxPrice, page = 1, limit = 12, sort = 'newest' } = filters;

        const where = {
            ...(category && { category: { slug: category } }),
            ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
            ...(inStock !== undefined && { inStock }),
            ...((minPrice !== undefined || maxPrice !== undefined) && {
                price: {
                    ...(minPrice !== undefined && { gte: minPrice }),
                    ...(maxPrice !== undefined && { lte: maxPrice }),
                },
            }),
        };

        const orderBy = sort === 'price_asc'
            ? { price: 'asc' as const }
            : sort === 'price_desc'
                ? { price: 'desc' as const }
                : { createdAt: 'desc' as const };

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: { category: true },
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.product.count({ where }),
        ]);

        return {
            products,
            total,
            page,
            limit,
            hasNextPage: page * limit < total,
        };
    }

    static async getProductById(id: string) {
        const product = await prisma.product.findUnique({
            where: { id },
            include: { category: true },
        });

        if (!product) throw new AppError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
        return product;
    }

    /**
     * SECURITY: Prices are fetched from the database — never trusted from the
     * client. This prevents cart price tampering attacks.
     */
    static async createOrder(data: CreateOrderInput) {
        const { items, deliveryMethod, ...orderData } = data;

        // Validate address for delivery orders
        if (deliveryMethod === 'DELIVERY') {
            if (!orderData.city || orderData.city.length < 2) {
                throw new AppError(400, 'City is required for delivery orders', 'VALIDATION_ERROR');
            }
            if (!orderData.address || orderData.address.length < 5) {
                throw new AppError(400, 'Address is required for delivery orders', 'VALIDATION_ERROR');
            }
        }

        // Fetch all products and settings in one DB round-trip
        const productIds = items.map((i) => i.productId);
        const [dbProducts, settings] = await Promise.all([
            prisma.product.findMany({
                where: { id: { in: productIds } },
                select: { id: true, name: true, price: true, inStock: true },
            }),
            prisma.settings.findUnique({ where: { id: 1 } })
        ]);

        // Validate every requested product exists and is in stock
        const productMap = new Map(dbProducts.map((p) => [p.id, p]));
        for (const item of items) {
            const product = productMap.get(item.productId);
            if (!product) {
                throw new AppError(404, `Product "${item.name}" is no longer available`, 'PRODUCT_NOT_FOUND');
            }
            if (!product.inStock) {
                throw new AppError(409, `Product "${product.name}" is out of stock`, 'OUT_OF_STOCK');
            }
        }

        // Calculate subtotal from DB prices
        const subtotal = items.reduce((acc, item) => {
            const dbPrice = productMap.get(item.productId)!.price;
            return acc + dbPrice * item.quantity;
        }, 0);

        // Calculate delivery fee: Standard shipping logic
        const deliveryFee = deliveryMethod === 'PICKUP'
            ? 0
            : (settings?.freeShippingEnabled && subtotal >= (settings?.freeShippingThreshold || 0))
                ? 0
                : (settings?.standardDeliveryFee || 0);

        const total = subtotal + deliveryFee;

        const order = await prisma.order.create({
            data: {
                ...orderData,
                deliveryMethod,
                total,
                deliveryFee,
                items: {
                    create: items.map((item) => ({
                        productId: item.productId,
                        name: productMap.get(item.productId)!.name, // Use DB name (snapshot)
                        price: productMap.get(item.productId)!.price, // Use DB price (snapshot)
                        quantity: item.quantity,
                    })),
                },
            },
            include: { items: true },
        });

        return order;
    }
    static async getOrdersByIds(ids: string[]) {
        if (!ids || ids.length === 0) return [];
        return prisma.order.findMany({
            where: { id: { in: ids } },
            include: { items: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    static async searchOrders(query: string) {
        return prisma.order.findMany({
            where: {
                OR: [
                    { id: { startsWith: query, mode: 'insensitive' } },
                    { phone: { contains: query, mode: 'insensitive' } },
                    { email: { equals: query, mode: 'insensitive' } }
                ]
            },
            include: { items: true },
            orderBy: { createdAt: 'desc' },
            take: 10 // Limit results to prevent abuse
        });
    }

    static async cancelOrder(id: string) {
        const order = await prisma.order.findUnique({
            where: { id }
        });

        if (!order) {
            throw new AppError(404, 'Order not found', 'ORDER_NOT_FOUND');
        }

        if (order.status !== 'PENDING') {
            throw new AppError(400, 'Only pending orders can be cancelled', 'INVALID_ORDER_STATE');
        }

        return prisma.order.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });
    }
}
