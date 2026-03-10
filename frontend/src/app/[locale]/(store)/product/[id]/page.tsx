import { Metadata, ResolvingMetadata } from 'next';
import ProductDetails from "@/features/public/products/ProductDetails";
import type { ApiProduct } from '@/lib/types';

type Props = {
    params: Promise<{ id: string }>
};

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const resolvedParams = await params;
    const { id, locale } = resolvedParams as any;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    try {
        const res = await fetch(`${apiUrl}/api/public/products/${id}`, { next: { revalidate: 60 } });
        if (!res.ok) throw new Error('Failed to fetch');
        const product: ApiProduct = await res.json();

        return {
            title: `${product.name} | Caftan Latifa`,
            description: product.description.slice(0, 160),
            openGraph: {
                title: product.name,
                description: product.description.slice(0, 160),
                images: product.images && product.images.length > 0 ? [{ url: product.images[0] }] : [],
            },
        };
    } catch (e) {
        // Fallback for metadata error (e.g. product not found)
        return {
            title: locale === 'ar' ? 'التصميم غير موجود | قفطان لطيفة' : 'Création Introuvable | Caftan Latifa',
        };
    }
}

export default async function ProductPage({ params }: Props) {
    const resolvedParams = await params;
    return <ProductDetails params={resolvedParams} />;
}
