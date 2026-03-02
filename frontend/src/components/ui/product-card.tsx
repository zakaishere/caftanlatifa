"use client";

import { useState, memo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { ApiProduct, centsToMad } from '@/lib/types';
import { Image as ImageIcon } from 'lucide-react';

// Dynamic import — keeps QuickView out of initial bundle
const ProductQuickView = dynamic(
  () => import('@/components/ui/product-quick-view').then((m) => m.ProductQuickView),
  { ssr: false },
);

interface ProductCardProps {
  product: ApiProduct;
}

// ─── Single unified card ───────────────────────────────────────────────────────
// Portrait 4:5 image with a bottom gradient overlay.
// Price (gold) is always visible.  Desktop adds hover zoom + slide-up button.
// Mobile retains the tap-to-open behaviour.
// ──────────────────────────────────────────────────────────────────────────────
export const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const hasImage = product.images && product.images.length > 0;

  return (
    <>
      <button
        className="group flex flex-col w-full text-left cursor-pointer focus-visible:outline-none"
        onClick={() => setQuickViewOpen(true)}
        aria-label={`Voir les détails de ${product.name}`}
      >
        {/* ── Image Container (Portrait 4:5) ─────────────────────────────── */}
        <div className="relative w-full aspect-[4/5] overflow-hidden bg-[#F3EFE9]">
          {hasImage ? (
            <Image
              src={product.images![0]}
              alt={product.name}
              fill
              sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
              className="object-cover object-center transition-transform duration-[1.2s] ease-out group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[#C9A227]/20">
              <ImageIcon className="h-10 w-10" />
            </div>
          )}

          {/* ── Out-of-stock veil ─────────────────────────────────────────── */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-20">
              <span className="text-[10px] font-medium text-white uppercase tracking-[0.25em] border border-white/30 px-3 py-1">
                Épuisé
              </span>
            </div>
          )}

          {/* ── Desktop: Slide-up "Voir" button overlay ───────────────────── */}
          <div className="hidden sm:flex absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 items-center justify-center pointer-events-none">
            <span className="text-[9px] uppercase tracking-[0.3em] bg-white/90 text-black px-4 py-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out shadow-lg">
              Voir le produit
            </span>
          </div>
        </div>

        {/* ── Product Content (Under Image) ──────────────────────────────── */}
        <div className="flex flex-col gap-1.5 pt-4 pb-2">
          {/* Product Name (1 line clamp) */}
          <h3 className="text-[12px] sm:text-[13px] uppercase tracking-[0.15em] text-foreground font-light line-clamp-1 group-hover:text-[#C9A227] transition-colors duration-300">
            {product.name}
          </h3>

          {/* Price (Gold) */}
          <span className="font-medium text-[#C9A227] text-[13px] sm:text-[14px] tracking-wide">
            {centsToMad(product.price)} MAD
          </span>
        </div>
      </button>

      <ProductQuickView
        product={product}
        open={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />
    </>
  );
});
