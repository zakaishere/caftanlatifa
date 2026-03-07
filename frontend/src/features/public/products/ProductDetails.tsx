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
import type { ApiProduct, ApiInitData, ProductSize } from '@/lib/types';
import { centsToMad } from '@/lib/types';

export default function ProductDetails({ params }: { params: { id: string } }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [sizeError, setSizeError] = useState(false);

  const { data: product, isLoading, isError } = useQuery<ApiProduct>({
    queryKey: [`/api/public/products/${params.id}`],
  });

  const { data: initData } = useQuery<ApiInitData>({
    queryKey: ['/api/public/init'],
  });

  const handleAddToCart = () => {
    if (!product) return;

    if (product.availableSizes && product.availableSizes.length > 0 && !selectedSize) {
      setSizeError(true);
      // Scroll to size selector (optional, but good UX on mobile)
      return;
    }

    setSizeError(false);
    addToCart(product, quantity, selectedSize);
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
        <h1 className="font-serif text-3xl mb-4 text-[#1A1A1A]">Création Introuvable</h1>
        <p className="text-[#1A1A1A]/50 font-light text-sm mb-8">
          Désolé, cette pièce n'est plus disponible dans notre collection.
        </p>
        <Link href="/products">
          <Button variant="outline" className="rounded-none border-[#C9A227]/30 uppercase tracking-[0.2em] text-[10px] px-8 h-12">
            Retour à la Collection
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
      <div className="fixed top-4 left-4 z-40 md:hidden">
        <Link href="/products">
          <button
            aria-label="Retour à la collection"
            className="w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-full shadow-md text-[#1A1A1A] hover:bg-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
      </div>

      {/* ── Desktop Breadcrumb ────────────────────────────────────── */}
      <div className="hidden md:block max-w-7xl mx-auto px-12 pt-10 pb-2">
        <Link href="/products">
          <button className="flex items-center gap-2.5 text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/40 hover:text-[#C9A227] transition-colors font-light">
            <ArrowLeft className="h-3 w-3" />
            Retour à la Collection
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
        <div className="relative -mt-8 md:mt-0 bg-[#FAF7F2] rounded-t-[32px] md:rounded-none px-6 pt-8 pb-32 md:pb-8 md:px-0">

          {/* ── Category + Stock tags ──────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="text-[9px] uppercase tracking-[0.35em] font-semibold text-[#C9A227] border border-[#C9A227]/25 px-3 py-1 bg-[#C9A227]/5">
              {product.category?.name}
            </span>
            {product.inStock ? (
              <span className="text-[9px] uppercase tracking-[0.3em] font-medium text-emerald-600 border border-emerald-200 px-3 py-1 bg-emerald-50">
                En stock
              </span>
            ) : (
              <span className="text-[9px] uppercase tracking-[0.3em] font-medium text-red-500 border border-red-200 px-3 py-1 bg-red-50">
                Épuisé
              </span>
            )}
          </div>

          {/* ── Product name ──────────────────────────────────── */}
          <h1 className="font-serif text-3xl md:text-4xl text-[#1A1A1A] tracking-tight leading-[1.1] mb-4">
            {product.name}
          </h1>

          {/* ── Price ─────────────────────────────────────────── */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="font-serif text-2xl text-[#C9A227]">
              {centsToMad(product.price)} MAD
            </span>
            {initData?.settings?.standardDeliveryFee ? (
              <span className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/35 font-light">
                + {centsToMad(initData.settings.standardDeliveryFee)} livraison
              </span>
            ) : null}
          </div>

          {/* ── Divider ───────────────────────────────────────── */}
          <div className="h-px w-12 bg-[#C9A227]/30 mb-6" />

          {/* ── Size Selector ─────────────────────────────────── */}
          {product.availableSizes && product.availableSizes.length > 0 ? (
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-[#1A1A1A]/35 w-20 shrink-0">
                  Taille
                </span>
                {sizeError && !selectedSize && (
                  <span className="text-[9px] uppercase tracking-[0.2em] text-red-500 font-bold animate-pulse">
                    Veuillez sélectionner une taille
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
                Taille
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 border border-[#1A1A1A]/10 px-3 py-1">
                Taille unique
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
              Quantité
            </span>
            <div className="flex items-center border border-[#1A1A1A]/10 bg-white">
              <button
                className="h-10 w-10 flex items-center justify-center text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors disabled:opacity-25"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1 || !product.inStock}
                aria-label="Diminuer la quantité"
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
                aria-label="Augmenter la quantité"
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
                <><Check className="h-4 w-4" /> Ajouté au Panier</>
              ) : (
                <><ShoppingCart className="h-4 w-4" /> Ajouter au Panier</>
              )}
            </Button>
          </div>

          {/* ── Selling points ────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-y-5 gap-x-4 mb-8">
            {[
              { Icon: Check, label: "Paiement à la livraison" },
              { Icon: Truck, label: "Livraison partout au Maroc" },
              { Icon: ShieldCheck, label: "Qualité artisanale" },
              { Icon: RotateCcw, label: "Retour sous 7 jours" },
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
          <Accordion type="single" collapsible className="w-full border-t border-[#1A1A1A]/5">
            {product.specs && Object.keys(product.specs).length > 0 && (
              <AccordionItem value="specs" className="border-[#1A1A1A]/5">
                <AccordionTrigger className="text-[10px] uppercase tracking-[0.25em] font-medium hover:no-underline py-4">
                  Caractéristiques
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
              <AccordionTrigger className="text-[10px] uppercase tracking-[0.25em] font-medium hover:no-underline py-4">
                Expédition & Livraison
              </AccordionTrigger>
              <AccordionContent className="text-[13px] text-[#1A1A1A]/55 font-light leading-relaxed pb-2">
                Nos pièces sont livrées dans toutes les villes du Maroc. Le délai de livraison est généralement de 24 à 48 heures pour les grandes villes et jusqu'à 72 heures pour les zones plus éloignées. Le paiement s'effectue en espèces à la réception.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="returns" className="border-none">
              <AccordionTrigger className="text-[10px] uppercase tracking-[0.25em] font-medium hover:no-underline py-4">
                Retours & Échanges
              </AccordionTrigger>
              <AccordionContent className="text-[13px] text-[#1A1A1A]/55 font-light leading-relaxed pb-2">
                Chez Caftan Latifa, nous acceptons les retours et les échanges sous 7 jours, à condition que la pièce soit dans son état d'origine. Les frais de retour sont à la charge du client, sauf en cas de défaut de fabrication.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* ── Mobile Sticky Bottom CTA ─────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-[#1A1A1A]/5 pb-safe">
        <div className="px-5 pt-3 pb-4 flex items-center gap-4">
          {/* Price + Subtotal */}
          <div className="flex flex-col min-w-0">
            <span className="text-[8px] uppercase tracking-[0.3em] text-[#1A1A1A]/30 font-light leading-none mb-1">
              {quantity > 1 ? `Sous-total (×${quantity})` : 'Prix'}
            </span>
            <span className="font-serif text-[#C9A227] text-lg leading-none">
              {subtotal.toFixed(0)} MAD
            </span>
          </div>
          {/* CTA */}
          <Button
            className="flex-1 h-12 rounded-none bg-[#C9A227] hover:bg-[#b8911f] text-black text-[10px] uppercase tracking-[0.3em] font-bold transition-all duration-300 gap-2 shrink-0 disabled:opacity-40"
            onClick={handleAddToCart}
            disabled={!product.inStock}
          >
            {added ? (
              <><Check className="h-3.5 w-3.5" /> Ajouté !</>
            ) : (
              <><ShoppingCart className="h-3.5 w-3.5" /> Ajouter</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
