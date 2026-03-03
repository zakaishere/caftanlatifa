"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/features/public/cart/cartContext';
import { centsToMad } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { CheckoutStepper } from '@/components/ui/checkout-stepper';
import { useQuery } from '@tanstack/react-query';
import type { ApiInitData } from '@/lib/types';

export default function Cart() {
  const { items, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const router = useRouter();

  const { data: initData } = useQuery<ApiInitData>({
    queryKey: ['/api/public/init'],
  });
  const settings = initData?.settings;

  const isFreeShipping =
    settings?.freeShippingEnabled && cartTotal >= (settings?.freeShippingThreshold ?? 0);
  const deliveryFee = isFreeShipping ? 0 : (settings?.standardDeliveryFee ?? 0);
  const grandTotal = cartTotal + deliveryFee;

  // ── Empty State ───────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center min-h-[50vh] px-6 bg-background">
        <div className="h-20 w-20 md:h-24 md:w-24 rounded-none bg-primary/5 flex items-center justify-center mb-8 border border-primary/10">
          <ShoppingBag className="h-8 w-8 md:h-10 md:w-10 text-primary/30" strokeWidth={1} />
        </div>
        <h1 className="font-serif text-2xl md:text-3xl text-foreground mb-3 tracking-tight">Votre panier est vide</h1>
        <p className="text-muted-foreground max-w-xs mb-8 text-[11px] uppercase tracking-[0.2em] font-light leading-relaxed">
          Il semble que vous n'ayez pas encore ajouté de pièces à votre sélection.
        </p>
        <Link href="/products">
          <Button size="lg" className="h-12 md:h-14 px-8 md:px-10 text-[10px] uppercase tracking-[0.3em] font-bold rounded-none bg-black text-white hover:bg-primary shadow-xl shadow-primary/20">
            Découvrir la Collection
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-background" suppressHydrationWarning>
      <CheckoutStepper currentStep="cart" />

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col items-center text-center mb-8 md:mb-20">
        <span className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] text-primary mb-3">Votre Sélection</span>
        <h1 className="font-serif text-3xl md:text-5xl text-foreground tracking-tight mb-4">Panier</h1>
        <div className="h-px w-16 bg-primary/30" />
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50 mt-3 font-light">
          {items.length} {items.length === 1 ? 'article' : 'articles'}
        </p>
      </div>

      {/* ── Two-Column Layout (desktop) / Single Column (mobile) ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-20">

        {/* ── Cart Items ─────────────────────────────────────────────── */}
        <div className="lg:col-span-8">

          {/* Desktop header row */}
          <div className="hidden md:grid grid-cols-12 gap-4 pb-5 px-4 border-b border-primary/10 text-[9px] uppercase tracking-[0.3em] text-muted-foreground/50 font-medium">
            <div className="col-span-6">Pièce</div>
            <div className="col-span-2 text-center">Quantité</div>
            <div className="col-span-2 text-right">Prix unit.</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          {/* Items list */}
          <div className="divide-y divide-primary/5">
            {items.map((item) => (
              <div key={item.id}>

                {/* ══ DESKTOP row ══════════════════════════════════════ */}
                <div className="hidden md:grid grid-cols-12 gap-4 py-10 px-4 items-center group">
                  <div className="col-span-6 flex gap-8">
                    <div className="relative h-32 w-24 rounded-none overflow-hidden bg-muted flex-shrink-0 border border-primary/5">
                      {item.images?.[0] ? (
                        <Image src={item.images[0]} alt={item.name} fill sizes="150px" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="flex items-center justify-center h-full"><ImageIcon className="h-8 w-8 text-muted-foreground/20" /></div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center gap-2">
                      <h3 className="font-serif text-xl text-foreground tracking-tight">{item.name}</h3>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-primary/60 font-medium">{item.category?.name}</p>
                      <button
                        className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-red-800/40 hover:text-red-800 mt-4 transition-colors w-fit"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Supprimer ${item.name}`}
                      >
                        <Trash2 className="h-3 w-3" /> Supprimer
                      </button>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    <div className="flex items-center border border-primary/10 rounded-none p-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/5 rounded-none" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1} aria-label="Diminuer">
                        <Minus className="h-2.5 w-2.5" />
                      </Button>
                      <span className="w-10 text-center font-medium text-xs">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/5 rounded-none" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Augmenter">
                        <Plus className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="col-span-2 text-right text-muted-foreground/60 font-light text-[11px] tracking-widest">{centsToMad(item.price)}</div>
                  <div className="col-span-2 text-right font-medium text-primary text-lg tracking-tight">{centsToMad(item.price * item.quantity)} MAD</div>
                </div>

                {/* ══ MOBILE row ═══════════════════════════════════════ */}
                <div className="md:hidden flex gap-4 py-5">
                  {/* Thumbnail */}
                  <div className="relative w-20 h-24 flex-shrink-0 overflow-hidden bg-muted border border-primary/5">
                    {item.images?.[0] ? (
                      <Image src={item.images[0]} alt={item.name} fill sizes="80px" className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full"><ImageIcon className="h-6 w-6 text-muted-foreground/20" /></div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    {/* Name */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-serif text-[15px] text-foreground tracking-tight leading-snug line-clamp-2">
                          {item.name}
                        </h3>
                        <p className="text-[9px] uppercase tracking-[0.2em] text-primary/50 font-medium mt-0.5">
                          {item.category?.name}
                        </p>
                      </div>
                      {/* Remove button */}
                      <button
                        className="flex-shrink-0 h-8 w-8 flex items-center justify-center text-muted-foreground/30 hover:text-red-500 transition-colors"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Supprimer ${item.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Price + Quantity controls */}
                    <div className="flex items-center justify-between mt-1">
                      {/* Compact quantity stepper */}
                      <div className="flex items-center border border-primary/10 bg-transparent">
                        <button
                          className="h-7 w-7 flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors disabled:opacity-30"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label="Diminuer la quantité"
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </button>
                        <span className="w-7 text-center text-xs font-medium tabular-nums">{item.quantity}</span>
                        <button
                          className="h-7 w-7 flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Augmenter la quantité"
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                      </div>

                      {/* Item total */}
                      <span className="font-serif text-[#C9A227] text-base tracking-tight">
                        {centsToMad(item.price * item.quantity)} MAD
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Clear cart */}
          <button
            onClick={clearCart}
            className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground/30 hover:text-red-700 transition-colors mt-6 block"
          >
            Vider le panier
          </button>
        </div>

        {/* ── Order Summary (desktop sidebar / mobile card) ──────────── */}
        <div className="lg:col-span-4">
          {/* Desktop: sticky sidebar card */}
          <div className="hidden md:block sticky top-32 bg-white border border-primary/10 p-8 md:p-12 space-y-10 shadow-2xl shadow-primary/5">
            <div className="space-y-4">
              <h2 className="font-serif text-2xl text-foreground tracking-tight">Résumé</h2>
              <div className="h-px w-10 bg-primary/40" />
            </div>
            <div className="space-y-5">
              <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] font-medium">
                <span className="text-muted-foreground/60">Sous-total</span>
                <span>{centsToMad(cartTotal)} MAD</span>
              </div>
              <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] font-medium">
                <span className="text-muted-foreground/60">Livraison</span>
                {isFreeShipping ? (
                  <span className="text-primary font-bold">Gratuite</span>
                ) : (
                  <span>{centsToMad(deliveryFee)} MAD</span>
                )}
              </div>
              <div className="pt-5 border-t border-primary/10 flex justify-between items-end">
                <span className="font-serif text-xl text-foreground">Total</span>
                <span className="font-serif text-3xl text-primary tracking-tighter">{centsToMad(grandTotal)} MAD</span>
              </div>
            </div>
            <div className="space-y-4">
              <Button
                className="w-full flex items-center justify-center h-12 rounded-none bg-[#0B0B0B] text-white border border-[#C9A227]/30 text-xs font-semibold uppercase tracking-[0.08em] transition-all duration-300 hover:bg-[#1A1A1A] hover:border-[#C9A227]/50 gap-2"
                onClick={() => router.push('/checkout')}
              >
                Passer la commande <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <Link href="/products" className="block text-center pt-2">
                <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-primary border-b border-transparent hover:border-primary/30 pb-1 transition-all">
                  Continuer vos achats
                </span>
              </Link>
            </div>
            <div className="pt-6 flex items-center justify-center gap-2 text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40">
              <ShieldCheck className="h-3 w-3" />
              Paiement sécurisé à la livraison
            </div>
          </div>

          {/* Mobile: compact summary card (no CTA — that's in the sticky bar) */}
          <div className="md:hidden bg-white border border-primary/10 p-5 shadow-lg shadow-primary/5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg text-foreground tracking-tight">Résumé</h2>
              <div className="h-px flex-1 bg-primary/10 ml-4" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] font-medium text-muted-foreground/60">
                <span>Sous-total ({items.length} art.)</span>
                <span className="text-foreground">{centsToMad(cartTotal)} MAD</span>
              </div>
              <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] font-medium text-muted-foreground/60">
                <span>Livraison</span>
                {isFreeShipping ? (
                  <span className="text-primary font-bold">Gratuite</span>
                ) : (
                  <span className="text-foreground">{centsToMad(deliveryFee)} MAD</span>
                )}
              </div>
              <div className="pt-3 border-t border-primary/10 flex justify-between items-baseline">
                <span className="font-serif text-base text-foreground">Total</span>
                <span className="font-serif text-xl text-primary tracking-tight">{centsToMad(grandTotal)} MAD</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-1.5 pt-1 text-[9px] uppercase tracking-[0.2em] text-muted-foreground/35">
              <ShieldCheck className="h-3 w-3" /> Paiement à la livraison
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Sticky Checkout Bar ─────────────────────────────────
           Sits ABOVE the bottom nav (bottom-16 = 64px = height of bottom nav)
           ──────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-16 inset-x-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-primary/10">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-[0.3em] text-muted-foreground/40 leading-none mb-0.5">Total</span>
            <span className="font-serif text-[#C9A227] text-lg leading-none">{centsToMad(grandTotal)} MAD</span>
          </div>
          <Button
            className="flex-1 h-11 rounded-none bg-[#C9A227] hover:bg-[#b8911f] text-black text-[10px] uppercase tracking-[0.35em] font-bold transition-all gap-2"
            onClick={() => router.push('/checkout')}
          >
            Passer à la caisse <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
