"use client";

import { useState, memo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
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
      <div className="group flex flex-col w-full text-left">
        {/* ── Image Container (Portrait 4:5) ─────────────────────────────── */}
        <div
          className="relative w-full aspect-[4/5] overflow-hidden bg-[#F3EFE9] cursor-pointer"
          onClick={() => setQuickViewOpen(true)}
        >
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

          {/* ── Desktop: Dual Action Overlay ────────────────────────────────── */}
          <div className="hidden sm:flex absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500 items-end justify-center pb-8 pointer-events-none opacity-0 group-hover:opacity-100">
            <div className="flex flex-col gap-2 pointer-events-auto translate-y-4 group-hover:translate-y-0 transition-transform duration-500 w-34">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setQuickViewOpen(true);
                }}
                className="w-full text-[9px] uppercase tracking-[0.2em] bg-white text-black px-4 py-2.5 shadow-lg hover:bg-[#F3EFE9] transition-colors text-center font-medium"
              >
                Aperçu rapide
              </button>
              <Link
                href={`/product/${product.slug || product.id}`}
                onClick={(e) => e.stopPropagation()}
                className="w-full text-[9px] uppercase tracking-[0.2em] bg-black/80 backdrop-blur-sm text-white px-4 py-2.5 shadow-lg hover:bg-black transition-colors text-center font-medium"
              >
                Voir détails
              </Link>
            </div>
          </div>
        </div>

        {/* ── Product Content (Under Image) ──────────────────────────────── */}
        <div className="flex flex-col gap-1.5 pt-4 pb-2">
          {/* Product Name (Link) */}
          <Link
            href={`/product/${product.slug || product.id}`}
            className="text-[12px] sm:text-[13px] uppercase tracking-[0.15em] text-foreground font-light line-clamp-1 hover:text-[#C9A227] transition-colors duration-300 w-fit"
          >
            {product.name}
          </Link>

          {/* Price & Mobile Link */}
          <div className="flex items-center justify-between">
            <span className="font-medium text-[#C9A227] text-[13px] sm:text-[14px] tracking-wide">
              {centsToMad(product.price)} MAD
            </span>
            <Link
              href={`/product/${product.slug || product.id}`}
              className="sm:hidden text-[9px] uppercase tracking-[0.1em] text-[#1A1A1A]/40 hover:text-[#C9A227] transition-colors flex items-center gap-1"
            >
              Voir détails <span className="text-[10px] leading-none mb-0.5">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      <ProductQuickView
        product={product}
        open={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />
    </>
  );
});
