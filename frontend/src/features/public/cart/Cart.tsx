"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/features/public/cart/cartContext';
import { centsToMad } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { CheckoutStepper } from '@/components/ui/checkout-stepper';

export default function Cart() {
  const { items, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center min-h-[60vh] px-6 bg-background">
        <div className="h-24 w-24 rounded-none bg-primary/5 flex items-center justify-center mb-10 border border-primary/10">
          <ShoppingBag className="h-10 w-10 text-primary/30" strokeWidth={1} />
        </div>
        <h1 className="font-serif text-3xl text-foreground mb-4 tracking-tight">Votre panier est vide</h1>
        <p className="text-muted-foreground max-w-xs mb-10 text-[11px] uppercase tracking-[0.2em] font-light leading-relaxed">
          Il semble que vous n'ayez pas encore ajouté de pièces d'exception à votre sélection.
        </p>
        <Link href="/products">
          <Button size="lg" className="h-14 px-10 text-[10px] uppercase tracking-[0.3em] font-bold rounded-none bg-black text-white hover:bg-primary shadow-2xl shadow-primary/20">
            Commencer vos achats
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 py-12 md:py-20 bg-background" suppressHydrationWarning>
      <CheckoutStepper currentStep="cart" />

      <div className="flex flex-col items-center text-center mb-16 md:mb-20">
        <span className="text-[10px] uppercase tracking-[0.4em] text-primary mb-4">Votre Sélection</span>
        <h1 className="font-serif text-4xl md:text-5xl text-foreground tracking-tight mb-6">Panier</h1>
        <div className="h-[1px] w-20 bg-primary/30"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        {/* Cart Items */}
        <div className="lg:col-span-8 flex flex-col gap-10">

          {/* ── Desktop View ── */}
          <div className="hidden md:block">
            <div className="grid grid-cols-12 gap-4 pb-6 px-4 border-b border-primary/10 text-[9px] uppercase tracking-[0.3em] text-muted-foreground/60 font-medium">
              <div className="col-span-6">Pièce</div>
              <div className="col-span-2 text-center">Quantité</div>
              <div className="col-span-2 text-right">Prix</div>
              <div className="col-span-2 text-right">Total</div>
            </div>
            <div className="divide-y divide-primary/5">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 py-10 px-4 items-center group">
                  <div className="col-span-6 flex gap-8">
                    <div className="relative h-32 w-24 rounded-none overflow-hidden bg-muted flex-shrink-0 border border-primary/5">
                      {item.images && item.images.length > 0 ? (
                        <Image
                          src={item.images[0]}
                          alt={item.name}
                          fill
                          sizes="150px"
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground/20" />
                      )}
                    </div>
                    <div className="flex flex-col justify-center gap-2">
                      <h3 className="font-serif text-xl text-foreground tracking-tight">{item.name}</h3>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-primary/60 font-medium">{item.category?.name}</p>
                      <button
                        className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-red-800/40 hover:text-red-800 mt-4 transition-colors w-fit"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    <div className="flex items-center border border-primary/10 rounded-none p-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/5 transition-colors rounded-none" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                        <Minus className="h-2.5 w-2.5" />
                      </Button>
                      <span className="w-10 text-center font-medium text-xs font-serif">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/5 transition-colors rounded-none" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <Plus className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="col-span-2 text-right text-muted-foreground/60 font-light text-[11px] tracking-widest">{centsToMad(item.price)}</div>
                  <div className="col-span-2 text-right font-medium text-primary text-lg tracking-tight">{centsToMad(item.price * item.quantity)} MAD</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Mobile Layout ── */}
          <div className="md:hidden space-y-12">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col gap-6">
                <div className="flex gap-6">
                  <div className="relative h-40 w-32 rounded-none overflow-hidden bg-muted border border-primary/5 flex-shrink-0">
                    {item.images && item.images.length > 0 ? (
                      <Image
                        src={item.images[0]}
                        alt={item.name}
                        fill
                        sizes="130px"
                        className="object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-10 w-10 text-muted-foreground/20" />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center gap-2">
                    <h3 className="font-serif text-xl text-foreground tracking-tight">{item.name}</h3>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-primary/60 font-medium">{item.category?.name}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-medium text-primary tracking-tight">{centsToMad(item.price)} MAD</span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="h-8 w-8 flex items-center justify-center text-red-800/40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between py-4 border-y border-primary/10">
                  <div className="flex items-center border border-primary/10 rounded-none p-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/5 rounded-none" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-10 text-center font-serif text-sm">{item.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/5 rounded-none" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 block mb-1">Sous-total</span>
                    <span className="font-serif text-lg text-primary tracking-tight">
                      {centsToMad(item.price * item.quantity)} MAD
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={clearCart}
            className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground/40 hover:text-red-800 transition-colors w-fit pt-8"
          >
            Vider le sac
          </button>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4">
          <div className="sticky top-32 bg-white border border-primary/10 p-8 md:p-12 space-y-10 shadow-2xl shadow-primary/5">
            <div className="space-y-4">
              <h2 className="font-serif text-2xl text-foreground tracking-tight">Résumé de la commande</h2>
              <div className="h-[1px] w-12 bg-primary/40"></div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.2em] font-medium">
                <span className="text-muted-foreground/60">Sous-total</span>
                <span className="text-foreground tracking-tight">{centsToMad(cartTotal)} MAD</span>
              </div>
              <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.2em] font-medium">
                <span className="text-muted-foreground/60">Livraison</span>
                <span className="text-primary font-bold tracking-[0.1em]">Gratuite</span>
              </div>

              <div className="pt-6 border-t border-primary/10 flex justify-between items-end">
                <span className="font-serif text-xl text-foreground tracking-tight">Total</span>
                <span className="font-serif text-3xl text-primary tracking-tighter">{centsToMad(cartTotal)} MAD</span>
              </div>
            </div>

            <div className="space-y-4 pt-6">
              <Button
                className="w-full flex items-center justify-center h-12 px-7 rounded-[12px] bg-[#0B0B0B] text-white border border-[#C9A227]/30 text-xs sm:text-sm font-semibold uppercase tracking-[0.08em] transition-all duration-300 hover:bg-[#1A1A1A] hover:border-[#C9A227]/50 hover:shadow-[0_0_15px_rgba(201,162,39,0.15)] focus-visible:ring-1 focus-visible:ring-[#C9A227]/50"
                onClick={() => router.push('/checkout')}
              >
                Passer la commande
              </Button>
              <Link href="/products" className="block text-center pt-4">
                <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-primary border-b border-transparent hover:border-primary/30 pb-1 transition-all">
                  Continuer vos achats
                </span>
              </Link>
            </div>

            <div className="pt-10 flex flex-col gap-4 text-center">
              <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40 font-light flex items-center justify-center gap-2">
                <ShieldCheck className="h-3 w-3" />
                Paiement sécurisé à la livraison
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
