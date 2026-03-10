"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '@/features/public/cart/cartContext';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Minus, Plus, ShoppingCart, Check, ShieldCheck, Truck, RotateCcw, Loader2
} from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { ProductGallery } from '@/components/ui/product-gallery';
import { ProductCard } from '@/components/ui/product-card';
import type { ApiProduct, ApiInitData, ProductSize } from '@/lib/types';
import { centsToMad } from '@/lib/types';
import { useTranslation } from '@/i18n/provider';

import { use } from 'react';

export default function ProductDetails({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { t } = useTranslation();
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [sizeError, setSizeError] = useState(false);

  const { data: product, isLoading, isError } = useQuery<ApiProduct>({
    queryKey: [`/api/public/products/${resolvedParams.id}`],
  });

  const { data: initData } = useQuery<ApiInitData>({
    queryKey: ['/api/public/init'],
  });

  const { data: relatedProducts } = useQuery<ApiProduct[]>({
    queryKey: [`/api/public/products/related/${resolvedParams.id}`],
    enabled: !!product,
  });

  const handleAddToCart = () => {
    if (!product) return;

    if (product.availableSizes && product.availableSizes.length > 0 && !selectedSize) {
      setSizeError(true);
      const sizeEl = document.getElementById('size-selector');
      if (sizeEl) {
        const y = sizeEl.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      return;
    }

    setSizeError(false);
    addToCart(product, quantity, selectedSize || undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleSizeSelect = (size: ProductSize) => {
    setSelectedSize(prev => prev === size ? null : size);
    if (sizeError) setSizeError(false);
  };

  // ── Loading ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF7F2]">
        <Loader2 className="h-7 w-7 animate-spin text-[#C9A227]/50" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FAF7F2] px-6 text-center">
        <h1 className="font-serif text-3xl mb-4 text-[#1A1A1A]">{t('productDetails.notFoundTitle')}</h1>
        <p className="text-[#1A1A1A]/50 font-light text-sm mb-8">
          {t('productDetails.notFoundDesc')}
        </p>
        <Link href="/products">
          <Button variant="outline" className="rounded-none border-[#C9A227]/30 uppercase tracking-[0.2em] text-[10px] px-8 h-12">
            {t('productDetails.backCol')}
          </Button>
        </Link>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [''];
  const subtotal = (product.price * quantity) / 100;

  return (
    <div className="bg-[#FAF7F2] min-h-screen">
      {/* ── Floating back button (mobile only) ───────────────────── */}
      <div className="fixed top-4 start-4 z-40 md:hidden">
        <Link href="/products">
          <button
            aria-label={t('productDetails.backCol')}
            className="w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-full shadow-md text-[#1A1A1A] hover:bg-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
          </button>
        </Link>
      </div>

      {/* ── Desktop Breadcrumb ────────────────────────────────────── */}
      <div className="hidden md:block max-w-7xl mx-auto px-12 pt-10 pb-2 text-start">
        <Link href="/products">
          <button className="flex items-center gap-2.5 text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/40 hover:text-[#C9A227] transition-colors font-light">
            <ArrowLeft className="h-3 w-3 rtl:-scale-x-100" />
            {t('productDetails.backCol')}
          </button>
        </Link>
      </div>

      {/* ── Main Layout ──────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto md:grid md:grid-cols-2 md:gap-16 md:px-12 md:py-8 md:pb-20">

        {/* ── GALLERY SECTION ─────────────────────────────────────── */}
        <div className="w-full md:sticky md:top-8 md:self-start">
          <ProductGallery images={images} productName={product.name} />
        </div>

        {/* ── DETAILS PANEL ────────────────────────────────────────── */}
        {/* 
          Mobile: Slides up with rounded corners over the gallery (-mt-8) 
          Desktop: Standard column layout
        */}
        <div className="relative -mt-8 md:mt-0 bg-[#FAF7F2] rounded-t-[32px] md:rounded-none px-6 pt-8 pb-40 md:pb-8 md:px-0 text-start">

          {/* ── Category + Stock tags ──────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="text-[9px] uppercase tracking-[0.35em] font-semibold text-[#C9A227] border border-[#C9A227]/25 px-3 py-1 bg-[#C9A227]/5">
              {product.category?.name}
            </span>
            {product.inStock ? (
              <span className="text-[9px] uppercase tracking-[0.3em] font-medium text-emerald-600 border border-emerald-200 px-3 py-1 bg-emerald-50">
                {t('product.inStock')}
              </span>
            ) : (
              <span className="text-[9px] uppercase tracking-[0.3em] font-medium text-red-500 border border-red-200 px-3 py-1 bg-red-50">
                {t('product.soldOut')}
              </span>
            )}
          </div>

          {/* ── Product name ──────────────────────────────────── */}
          <h1 className="font-serif text-3xl md:text-4xl text-[#1A1A1A] tracking-tight leading-[1.1] mb-4">
            {product.name}
          </h1>

          {/* ── Price ─────────────────────────────────────────── */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="font-serif text-2xl text-[#C9A227]" dir="ltr">
              {centsToMad(product.price)} {t('common.currency')}
            </span>
            {initData?.settings?.standardDeliveryFee ? (
              <span className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/35 font-light" dir="ltr">
                {t('product.deliveryFee', { amount: centsToMad(initData.settings.standardDeliveryFee) })}
              </span>
            ) : null}
          </div>

          {/* ── Divider ───────────────────────────────────────── */}
          <div className="h-px w-12 bg-[#C9A227]/30 mb-6" />

          {/* ── Size Selector ─────────────────────────────────── */}
          {product.availableSizes && product.availableSizes.length > 0 ? (
            <div id="size-selector" className="mb-6 scroll-mt-24">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-[#1A1A1A]/35 w-20 shrink-0">
                  {t('product.size')}
                </span>
                {sizeError && !selectedSize && (
                  <span className="text-[9px] uppercase tracking-[0.2em] text-red-500 font-bold animate-pulse">
                    {t('product.selectSizePrompt')}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {product.availableSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleSizeSelect(size)}
                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all duration-200 ${selectedSize === size
                      ? 'bg-[#C9A227] text-black border-[#C9A227] shadow-md shadow-[#C9A227]/20'
                      : sizeError
                        ? 'bg-red-50 text-red-500 border-red-200 hover:border-red-300'
                        : 'bg-white text-[#1A1A1A]/60 border-[#1A1A1A]/10 hover:border-[#C9A227]/50 hover:text-[#C9A227]'
                      }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 mb-6">
              <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-[#1A1A1A]/35 w-20 shrink-0">
                {t('product.size')}
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 border border-[#1A1A1A]/10 px-3 py-1">
                {t('product.oneSize')}
              </span>
            </div>
          )}

          {/* ── Description ───────────────────────────────────── */}
          <p className="text-[13.5px] leading-relaxed text-[#1A1A1A]/60 font-light tracking-wide mb-8">
            {product.description}
          </p>

          {/* ── Quantity Selector ─────────────────────────────── */}
          <div className="flex items-center gap-6 mb-6">
            <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-[#1A1A1A]/35 w-20 shrink-0">
              {t('product.quantity')}
            </span>
            <div className="flex items-center border border-[#1A1A1A]/10 bg-white">
              <button
                className="h-10 w-10 flex items-center justify-center text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors disabled:opacity-25"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1 || !product.inStock}
                aria-label={t('productDetails.decrease')}
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-10 text-center text-sm font-medium text-[#1A1A1A] tabular-nums">
                {quantity}
              </span>
              <button
                className="h-10 w-10 flex items-center justify-center text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors disabled:opacity-25"
                onClick={() => setQuantity(quantity + 1)}
                disabled={!product.inStock}
                aria-label={t('productDetails.increase')}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* ── Add to Cart (Desktop inline button) ───────────── */}
          <div className="hidden md:block mb-10">
            <Button
              size="lg"
              className="w-full h-14 rounded-none bg-[#C9A227] hover:bg-[#b8911f] text-black text-[11px] uppercase tracking-[0.4em] font-bold shadow-lg shadow-[#C9A227]/20 transition-all duration-300 gap-3 disabled:opacity-40"
              onClick={handleAddToCart}
              disabled={!product.inStock}
            >
              {added ? (
                <><Check className="h-4 w-4" /> {t('product.addedToCartLong')}</>
              ) : (
                <><ShoppingCart className="h-4 w-4 rtl:-scale-x-100" /> {t('product.addToCartLong')}</>
              )}
            </Button>
          </div>

          {/* ── Selling points ────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-y-5 gap-x-4 mb-8">
            {[
              { Icon: Check, label: t('product.points.cod') },
              { Icon: Truck, label: t('product.points.shipping') },
              { Icon: ShieldCheck, label: t('product.points.quality') },
              { Icon: RotateCcw, label: t('product.points.return') },
            ].map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-7 h-7 flex items-center justify-center border border-[#C9A227]/20 rounded-full shrink-0">
                  <Icon className="h-3 w-3 text-[#C9A227]" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.15em] text-[#1A1A1A]/50 leading-tight">{label}</span>
              </div>
            ))}
          </div>

          {/* ── Accordions ────────────────────────────────────── */}
          <Accordion type="single" collapsible className="w-full border-t border-[#1A1A1A]/5 text-start">
            {product.specs && Object.keys(product.specs).length > 0 && (
              <AccordionItem value="specs" className="border-[#1A1A1A]/5 ">
                <AccordionTrigger className="text-[10px] uppercase tracking-[0.25em] font-medium hover:no-underline py-4 text-start">
                  {t('product.features')}
                </AccordionTrigger>
                <AccordionContent>
                  <dl className="space-y-3 pb-2 text-[13px]">
                    {Object.entries(product.specs as Record<string, string>).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-baseline border-b border-[#1A1A1A]/5 pb-3 last:border-0">
                        <dt className="text-[#1A1A1A]/50 font-light">{key}</dt>
                        <dd className="font-medium text-[#1A1A1A]">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </AccordionContent>
              </AccordionItem>
            )}
            <AccordionItem value="delivery" className="border-[#1A1A1A]/5">
              <AccordionTrigger className="text-[10px] uppercase tracking-[0.25em] font-medium hover:no-underline py-4 text-start">
                {t('productDetails.shippingTab')}
              </AccordionTrigger>
              <AccordionContent className="text-[13px] text-[#1A1A1A]/55 font-light leading-relaxed pb-2">
                {t('productDetails.shippingTabContent')}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="returns" className="border-none">
              <AccordionTrigger className="text-[10px] uppercase tracking-[0.25em] font-medium hover:no-underline py-4 text-start">
                {t('productDetails.returnsTab')}
              </AccordionTrigger>
              <AccordionContent className="text-[13px] text-[#1A1A1A]/55 font-light leading-relaxed pb-2">
                {t('productDetails.returnsTabContent')}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* ── Related Products ──────────────────────────────────────── */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto py-16 border-t border-[#1A1A1A]/5 overflow-hidden">
          <h3 className="font-serif text-2xl md:text-3xl text-center text-[#1A1A1A] mb-8 md:mb-12 px-6">
            {t('productDetails.related')}
          </h3>

          {/* Mobile: Horizontal scroll, Desktop: Grid */}
          <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 px-6 pb-8 md:grid md:grid-cols-4 md:gap-8 md:overflow-visible md:px-12">
            {relatedProducts.slice(0, 8).map((related) => (
              <div key={related.id} className="min-w-[240px] w-[70vw] md:w-auto md:min-w-0 snap-center shrink-0">
                <ProductCard product={related} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Mobile Sticky Bottom CTA ─────────────────────────────── */}
      <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] inset-x-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-[#1A1A1A]/5 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          {/* Left: Price */}
          <div className="flex flex-col shrink-0">
            <span className="font-serif text-[#C9A227] text-lg leading-none">
              {centsToMad(product.price)}
            </span>
            <span className="text-[8px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 font-light mt-1">
              {t('common.currency')}
            </span>
          </div>

          {/* Middle: Selected Size */}
          <div className="flex flex-col flex-1 items-center justify-center border-l border-r border-[#1A1A1A]/5 px-2">
            {product.availableSizes && product.availableSizes.length > 0 ? (
              selectedSize ? (
                <>
                  <span className="text-[8px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 leading-none mb-1">{t('product.size')}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]">{selectedSize}</span>
                </>
              ) : (
                <span className={`text-[9px] uppercase tracking-[0.1em] text-center font-medium leading-tight ${sizeError ? 'text-red-500 animate-pulse' : 'text-[#1A1A1A]/50'}`}>
                  {t('productDetails.chooseSize')}
                </span>
              )
            ) : (
              <span className="text-[9px] uppercase tracking-[0.15em] text-[#1A1A1A]/50">{t('product.oneSize')}</span>
            )}
          </div>

          {/* Right: CTA */}
          <Button
            className="h-11 rounded-none bg-[#C9A227] hover:bg-[#b8911f] text-black text-[10px] uppercase tracking-[0.3em] font-bold transition-all duration-300 px-4 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handleAddToCart}
            disabled={!product.inStock || (product.availableSizes && product.availableSizes.length > 0 ? !selectedSize : false)}
          >
            {added ? (
              <Check className="h-4 w-4" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
