"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '@/features/public/cart/cartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Minus, Plus, ShoppingCart, Check, ShieldCheck, Truck, RotateCcw, Loader2, Image
} from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { ProductGallery } from '@/components/ui/product-gallery';
import type { ApiProduct, ApiInitData } from '@/lib/types';
import { centsToMad } from '@/lib/types';

export default function ProductDetails({ params }: { params: { id: string } }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading, isError } = useQuery<ApiProduct>({
    queryKey: [`/api/public/products/${params.id}`],
  });

  const { data: initData } = useQuery<ApiInitData>({
    queryKey: ['/api/public/init'],
  });

  const [isSticky, setIsSticky] = useState(false);

  // ── Handle sticky bar visibility on scroll ──────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar after scrolling past the main buy button section (~800px)
      setIsSticky(window.scrollY > 700);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A227] opacity-40" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="py-20 text-center px-6">
        <h1 className="font-serif text-2xl mb-4 text-[#1A1A1A]">Création Introuvable</h1>
        <p className="text-muted-foreground font-light mb-8">Désolé, cette pièce n'est plus disponible dans notre collection.</p>
        <Link href="/products">
          <Button variant="outline" className="rounded-none border-[#C9A227]/30 uppercase tracking-[0.2em] text-[10px] px-8">
            Retour à la Collection
          </Button>
        </Link>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [''];

  return (
    <div className="bg-[#FAF7F2] min-h-screen pb-20 md:pb-0">
      {/* ── Mobile Back Button (Floating) ──────────────────────────────── */}
      <div className="absolute top-4 left-4 z-40 md:hidden">
        <Link href="/products">
          <button className="w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-full shadow-sm text-[#1A1A1A]">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-0 md:px-12 py-0 md:py-16">
        {/* Breadcrumb / Back button (Desktop) */}
        <div className="hidden md:block mb-10">
          <Link href="/products">
            <Button variant="ghost" className="pl-0 hover:bg-transparent text-[10px] uppercase tracking-[0.3em] font-light text-muted-foreground hover:text-[#C9A227] transition-colors">
              <ArrowLeft className="mr-3 h-3.5 w-3.5" /> Retour à la Collection
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-20">
          {/* ── Product Gallery ─────────────────────────────────────────── */}
          <div className="w-full">
            <ProductGallery
              images={images}
              productName={product.name}
            />
          </div>

          {/* ── Product Info ────────────────────────────────────────────── */}
          <div className="relative z-10 -mt-10 md:mt-0 bg-[#FAF7F2] rounded-t-[40px] md:rounded-none px-8 pt-10 pb-16 md:p-0">
            <div className="space-y-10">
              {/* Header: Category + Name + Status */}
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-[#C9A227] border border-[#C9A227]/20 px-3 py-1 bg-[#C9A227]/5">
                    {product.category?.name}
                  </span>
                  {!product.inStock && (
                    <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-red-500 border border-red-200 px-3 py-1 bg-red-50">
                      Épuisé
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <h1 className="font-serif text-3xl md:text-5xl text-[#1A1A1A] tracking-tight leading-[1.1]">
                    {product.name}
                  </h1>
                  <div className="flex items-baseline gap-4">
                    <span className="text-2xl font-serif text-[#C9A227]">
                      {centsToMad(product.price)} MAD
                    </span>
                    {initData?.settings?.standardDeliveryFee && (
                      <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-light">
                        + {centsToMad(initData.settings.standardDeliveryFee)} MAD Livraison
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="h-[1px] w-16 bg-[#C9A227]/30" />

              <p className="text-[14px] leading-relaxed text-[#1A1A1A]/70 font-light tracking-wide max-w-lg">
                {product.description}
              </p>

              {/* Action Area: Quantity + Add to Cart */}
              <div className="space-y-8 pt-4">
                <div className="flex items-center gap-8">
                  <span className="text-[11px] uppercase tracking-[0.3em] font-medium text-[#1A1A1A]/40 min-w-[80px]">Quantité</span>
                  <div className="flex items-center border border-[#1A1A1A]/10 bg-white">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-none hover:bg-transparent"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1 || !product.inStock}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-none hover:bg-transparent"
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={!product.inStock}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full h-14 rounded-none bg-[#C9A227] hover:bg-[#C9A227]/90 text-black text-[11px] uppercase tracking-[0.4em] font-bold shadow-xl shadow-[#C9A227]/20 transition-all duration-300"
                  onClick={() => addToCart(product, quantity)}
                  disabled={!product.inStock}
                >
                  <ShoppingCart className="mr-3 h-4 w-4" /> Ajouter au Panier
                </Button>
              </div>

              {/* Selling Points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-10 text-[11px] uppercase tracking-[0.2em] text-[#1A1A1A]/60 pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 flex items-center justify-center border border-[#C9A227]/20 rounded-full">
                    <Check className="h-3.5 w-3.5 text-[#C9A227]" />
                  </div>
                  <span>Paiement à la livraison</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 flex items-center justify-center border border-[#C9A227]/20 rounded-full">
                    <Truck className="h-3.5 w-3.5 text-[#C9A227]" />
                  </div>
                  <span>Livraison Partout au Maroc</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 flex items-center justify-center border border-[#C9A227]/20 rounded-full">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#C9A227]" />
                  </div>
                  <span>Qualité Artisanale</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 flex items-center justify-center border border-[#C9A227]/20 rounded-full">
                    <RotateCcw className="h-3.5 w-3.5 text-[#C9A227]" />
                  </div>
                  <span>Retour sous 7 jours</span>
                </div>
              </div>

              {/* Accordions */}
              <div className="pt-8">
                <Accordion type="single" collapsible className="w-full">
                  {product.specs && Object.keys(product.specs).length > 0 && (
                    <AccordionItem value="specs" className="border-[#1A1A1A]/5">
                      <AccordionTrigger className="text-[11px] uppercase tracking-[0.25em] font-medium hover:no-underline">Questions techniques</AccordionTrigger>
                      <AccordionContent>
                        <dl className="space-y-4 pt-4 text-[13px]">
                          {Object.entries(product.specs as Record<string, string>).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-baseline border-b border-[#1A1A1A]/5 pb-3 last:border-0">
                              <dt className="text-muted-foreground font-light">{key}</dt>
                              <dd className="font-medium text-[#1A1A1A]">{value}</dd>
                            </div>
                          ))}
                        </dl>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                  <AccordionItem value="delivery" className="border-[#1A1A1A]/5">
                    <AccordionTrigger className="text-[11px] uppercase tracking-[0.25em] font-medium hover:no-underline">Expédition & Livraison</AccordionTrigger>
                    <AccordionContent className="text-[13px] text-[#1A1A1A]/60 font-light leading-relaxed pt-2">
                      Nos pièces sont livrées dans toutes les villes du Maroc. Le délai de livraison est généralement de 24 à 48 heures pour les grandes villes et jusqu'à 72 heures pour les zones plus éloignées. Le paiement s'effectue en espèces à la réception de votre colis.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="returns" className="border-none">
                    <AccordionTrigger className="text-[11px] uppercase tracking-[0.25em] font-medium hover:no-underline">Retours & Échanges</AccordionTrigger>
                    <AccordionContent className="text-[13px] text-[#1A1A1A]/60 font-light leading-relaxed pt-2">
                      Chez Caftan Latifa, nous acceptons les retours et les échanges sous 7 jours, à condition que la pièce soit dans son état d'origine. Les frais de retour sont à la charge du client, sauf en cas de défaut de fabrication.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Sticky Bottom Bar ──────────────────────────────────── */}
      <div className={`fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#1A1A1A]/5 transition-transform duration-500 ease-out md:hidden ${isSticky ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-light mb-0.5">Total</span>
            <span className="font-serif text-[#C9A227] text-lg">
              {centsToMad(product.price)} MAD
            </span>
          </div>
          <Button
            className="flex-1 h-12 rounded-none bg-[#C9A227] text-black text-[10px] uppercase tracking-[0.3em] font-bold"
            onClick={() => addToCart(product, quantity)}
            disabled={!product.inStock}
          >
            Ajouter au Panier
          </Button>
        </div>
      </div>
    </div>
  );
}
