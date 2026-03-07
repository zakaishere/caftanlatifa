import prisma from '../lib/prisma.js';
/**
 * Mutates the provided orders in place to attach product images
 * for order items that don't have an explicitly snapshotted `image`.
 */
export async function attachFallbackImages(orders) {
    const productIdsToFetch = new Set();
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
