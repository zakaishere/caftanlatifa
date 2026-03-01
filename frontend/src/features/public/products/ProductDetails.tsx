"use client";
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '@/features/public/cart/cartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Minus, Plus, ShoppingCart, Check, ShieldCheck, Truck, RotateCcw, Loader2, Image
} from 'lucide-react';
import { useState } from 'react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import type { ApiProduct, ApiInitData } from '@/lib/types';
import { centsToMad } from '@/lib/types';

export default function ProductDetails({ params }: { params: { id: string } }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const { data: product, isLoading, isError } = useQuery<ApiProduct>({
    queryKey: [`/api/public/products/${params.id}`],
  });

  const { data: initData } = useQuery<ApiInitData>({
    queryKey: ['/api/public/init'],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold">Product Not Found</h1>
        <Link href="/products">
          <Button className="mt-4">Retour à la Collection</Button>
        </Link>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [''];

  return (
    <div className="max-w-6xl mx-auto py-8">
      <Link href="/products">
        <Button variant="ghost" className="mb-6 pl-0 hover:bg-transparent hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la Collection
        </Button>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-secondary rounded-lg overflow-hidden border border-border">
            <img
              src={images[activeImage]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {images.map((img, index) => (
              <button
                key={index}
                className={`aspect-square rounded-md overflow-hidden border-2 ${activeImage === index ? 'border-primary' : 'border-transparent'
                  }`}
                onClick={() => setActiveImage(index)}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <Badge variant="secondary" className="mb-3">{product.category?.name}</Badge>
            <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-2xl font-bold text-primary">{centsToMad(product.price)} MAD</span>

              {initData?.settings?.freeShippingEnabled && product.price >= (initData.settings.freeShippingThreshold || 0) ? (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Free Shipping
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-secondary text-muted-foreground font-normal">
                  Shipping: {centsToMad(initData?.settings?.standardDeliveryFee || 0)} MAD
                </Badge>
              )}

              {product.inStock ? (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  In Stock
                </Badge>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
            </div>
          </div>

          <p className="text-muted-foreground leading-relaxed">{product.description}</p>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="font-medium min-w-[60px]">Quantity</span>
              <div className="flex items-center border rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-none"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || !product.inStock}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-none"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={!product.inStock}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                size="lg"
                className="flex-1 text-base h-12"
                onClick={() => addToCart(product, quantity)}
                disabled={!product.inStock}
              >
                <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground pt-4">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              <span>Cash on Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-emerald-500" />
              <span>{initData?.settings?.freeShippingEnabled && product.price >= (initData.settings.freeShippingThreshold || 0) ? 'Free standard delivery' : `Delivery: ${centsToMad(initData?.settings?.standardDeliveryFee || 0)} MAD`}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>1 Year Warranty</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-emerald-500" />
              <span>7 Days Return</span>
            </div>
          </div>

          {product.specs && Object.keys(product.specs).length > 0 && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="specs">
                <AccordionTrigger>Technical Specifications</AccordionTrigger>
                <AccordionContent>
                  <dl className="space-y-2 text-sm">
                    {Object.entries(product.specs as Record<string, string>).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-2 border-b pb-2 last:border-0">
                        <dt className="text-muted-foreground">{key}</dt>
                        <dd className="font-medium text-right">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="delivery">
                <AccordionTrigger>Delivery Information</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  We deliver to all cities in Morocco. Delivery usually takes 24-48 hours for main cities and up to 72 hours for remote areas. Payment is made in cash upon delivery.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      </div>
    </div>
  );
}
