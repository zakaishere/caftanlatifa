import ProductDetails from "@/features/public/products/ProductDetails";

export default function ProductPage({ params }: { params: { id: string } }) {
    return <ProductDetails params={params} />;
}
