import prisma from '../lib/prisma.js';
import type { Order, OrderItem } from '@prisma/client';

export type OrderWithItems = Order & { items: (OrderItem & { image?: string | null })[] };

/**
 * Mutates the provided orders in place to attach product images
 * for order items that don't have an explicitly snapshotted `image`.
 */
export async function attachFallbackImages<T extends OrderWithItems>(orders: T[]): Promise<T[]> {
    const productIdsToFetch = new Set<string>();

    // 1. Collect all product IDs that lack an image snapshot
    for (const order of orders) {
        for (const item of order.items) {
            if (!item.image && item.productId) {
                productIdsToFetch.add(item.productId);
            }
        }
    }

    if (productIdsToFetch.size === 0) {
        return orders;
    }

    // 2. Fetch those products and map their first image
    const products = await prisma.product.findMany({
        where: { id: { in: Array.from(productIdsToFetch) } },
        select: { id: true, images: true }
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    // 3. Apply the fallback image
    for (const order of orders) {
        for (const item of order.items) {
            if (!item.image && item.productId) {
                const product = productMap.get(item.productId);
                if (product && product.images && product.images.length > 0) {
                    item.image = product.images[0];
                }
            }
        }
    }

    return orders;
}
