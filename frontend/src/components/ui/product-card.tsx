import { useState, useEffect, memo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ApiProduct, centsToMad, ApiInitData } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Eye, Image as ImageIcon, Check } from 'lucide-react';
import { useCart } from '@/features/public/cart/cartContext';

// Dynamic import for QuickView to reduce initial bundle size
const ProductQuickView = dynamic(() => import('@/components/ui/product-quick-view').then(mod => mod.ProductQuickView), {
  ssr: false,
});

// ─── Simple media query hook ──────────────────────────────────────────────────
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
    handler(mql);
    mql.addEventListener('change', handler as any);
    return () => mql.removeEventListener('change', handler as any);
  }, [breakpoint]);
  return isMobile;
}

interface ProductCardProps {
  product: ApiProduct;
}

// ─── Compact Mobile Card (minimal luxury) ─────────────────────────────────────
function MobileProductCard({ product, onOpen }: {
  product: ApiProduct;
  onOpen: () => void;
}) {
  const hasImage = product.images && product.images.length > 0;

  return (
    <button
      className="group relative w-full text-left flex flex-col overflow-hidden bg-background active:scale-[0.98] transition-all duration-300"
      onClick={onOpen}
      aria-label={`View details for ${product.name}`}
    >
      {/* ─── Image (4:5 Aspect) ────────────────────────────────────────── */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
        {hasImage ? (
          <Image
            src={product.images![0]}
            alt={product.name}
            fill
            sizes="50vw"
            className="object-cover transition-transform duration-700 group-active:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-primary/20">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}

        {/* Status/Badge */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-10">
            <span className="text-[10px] font-medium text-white uppercase tracking-[0.2em] border border-white/30 px-3 py-1">
              Épuisé
            </span>
          </div>
        )}
      </div>

      {/* ─── Content (Minimal line) ───────────────────────────────────── */}
      <div className="flex flex-col py-3 px-1 gap-1">
        <h3 className="text-[11px] font-light text-foreground uppercase tracking-widest truncate">
          {product.name}
        </h3>
        <span className="text-xs font-medium text-primary tracking-wider">
          {centsToMad(product.price)} MAD
        </span>
      </div>
    </button>
  );
}

// ─── Full Desktop Card (Luxury Overlay) ─────────────────────────────────────────
function DesktopProductCard({ product, onOpen }: {
  product: ApiProduct;
  onOpen: () => void;
}) {
  const hasImage = product.images && product.images.length > 0;
  const isNew = new Date(product.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;

  return (
    <div
      className="group relative aspect-[4/5] overflow-hidden bg-muted cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-black/5"
      onClick={onOpen}
    >
      {/* ─── Image ─────────────────────────────────────────────────── */}
      {hasImage ? (
        <Image
          src={product.images![0]}
          alt={product.name}
          fill
          sizes="(max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
          loading="lazy"
        />
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full text-primary/10">
          <ImageIcon className="h-12 w-12 mb-2" />
        </div>
      )}

      {/* ─── Badges ────────────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        {isNew && product.inStock && (
          <span className="text-[9px] font-medium uppercase tracking-[0.3em] bg-white text-black px-3 py-1 shadow-sm">
            Nouveau
          </span>
        )}
        {!product.inStock && (
          <span className="text-[9px] font-medium uppercase tracking-[0.3em] bg-black text-white px-3 py-1">
            Indisponible
          </span>
        )}
      </div>

      {/* ─── Hover Overlay ─────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8 text-center">
        <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out">
          <h3 className="font-serif text-2xl text-white mb-3 tracking-tight">
            {product.name}
          </h3>
          <div className="h-[1px] w-8 bg-primary/60 mx-auto mb-4" />
          <span className="text-primary font-medium text-lg tracking-widest mb-6 block">
            {centsToMad(product.price)} MAD
          </span>
          <Button
            variant="outline"
            className="rounded-none border-white/20 text-white hover:bg-white hover:text-black transition-all duration-300 uppercase text-[10px] tracking-[0.2em] px-8 py-6 h-auto"
          >
            Découvrir
          </Button>
        </div>
      </div>

      {/* Permanent Price (bottom right - subtle) when not hovered */}
      <div className="absolute bottom-4 right-4 z-10 group-hover:opacity-0 transition-opacity duration-300">
        <span className="text-[11px] font-medium text-white drop-shadow-md tracking-wider bg-black/10 backdrop-blur-sm px-2 py-1">
          {centsToMad(product.price)} MAD
        </span>
      </div>
    </div>
  );
}

// ─── Public export: adapts between mobile/desktop ─────────────────────────────
export const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleOpen = () => setQuickViewOpen(true);
  const handleClose = () => setQuickViewOpen(false);

  return (
    <>
      {isMobile ? (
        <MobileProductCard product={product} onOpen={handleOpen} />
      ) : (
        <DesktopProductCard product={product} onOpen={handleOpen} />
      )}

      <ProductQuickView
        product={product}
        open={quickViewOpen}
        onClose={handleClose}
      />
    </>
  );
});
