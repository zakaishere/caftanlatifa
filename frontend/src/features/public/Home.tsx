"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowRight, Truck, CreditCard, Star, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { ProductCard } from '@/components/ui/product-card';
import type { ApiInitData } from '@/lib/types';

const PLACEHOLDER_HERO = "https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=1974&auto=format&fit=crop";

export default function Home() {
  const { data, isLoading } = useQuery<ApiInitData>({
    queryKey: ['/api/public/init'],
  });

  const categories = data?.categories ?? [];
  const featuredProducts = data?.featuredProducts ?? [];
  const settings = data?.settings;
  const heroImage = settings?.heroImage || PLACEHOLDER_HERO;

  return (
    <div className="flex flex-col bg-[#FAF7F2] min-h-screen">

      {/* ═══════════════════════════════════════════════════════
          HERO — full-bleed background image, text overlay left
      ═══════════════════════════════════════════════════════ */}
      <section className="relative w-full overflow-hidden min-h-[55vh] flex flex-col justify-center lg:min-h-[clamp(420px,60vh,620px)]">
        {/* Background image */}
        <Image
          src={heroImage}
          alt={settings?.storeName ?? 'Caftan Latifa'}
          fill
          sizes="100vw"
          className="object-cover object-[75%_center] md:object-center"
          priority
        />

        {/* Gradient overlay — stronger on mobile, fades right */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0806]/95 via-[#0A0806]/80 to-transparent md:from-[#0A0806]/85 md:via-[#0A0806]/60 md:to-transparent" />

        {/* Content — left column only */}
        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-16 py-12 md:py-20">
            <div className="max-w-lg space-y-7">

              {/* Eyebrow */}
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-[#C9A227]" />
                <span className="text-[10px] font-medium uppercase tracking-[0.45em] text-[#C9A227]">
                  Ramadan Collection · 2026
                </span>
              </div>

              {/* Headline */}
              <h1 className="font-serif text-[1.9rem] sm:text-5xl lg:text-[3.4rem] text-white leading-[1.1] tracking-[-0.01em] sm:leading-[1.08] sm:tracking-tight">
                L'Élégance du{' '}
                <span className="italic text-[#C9A227]">Caftan</span>
                <br />Marocain
              </h1>

              {/* Sub */}
              <p className="text-[13px] sm:text-[14px] text-white/65 leading-relaxed max-w-[22ch] sm:max-w-xs font-light tracking-[0.01em]">
                Des créations artisanales façonnées avec soin, alliant héritage berbère et couture contemporaine.
              </p>

              {/* CTA */}
              <div>
                <Link href="/products">
                  <Button
                    size="lg"
                    className="w-full xs:w-auto h-11 sm:h-12 px-8 sm:px-10 bg-[#C9A227] hover:bg-[#C9A227]/90 text-black rounded-none text-[10.5px] uppercase tracking-[0.22em] sm:tracking-[0.35em] transition-all duration-300 font-semibold shadow-xl shadow-[#C9A227]/25"
                  >
                    Explorer la Collection
                    <ArrowRight className="ml-2.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              {/* Trust row */}
              <div className="flex flex-wrap gap-5 pt-1 text-[10px] uppercase tracking-[0.25em] text-white/45">
                <span className="flex items-center gap-2">
                  <CreditCard className="h-3.5 w-3.5 text-[#C9A227]/80" strokeWidth={1.5} />
                  Paiement à la livraison
                </span>
                <span className="flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5 text-[#C9A227]/80" strokeWidth={1.5} />
                  Livraison partout au Maroc
                </span>
                <span className="flex items-center gap-2">
                  <Star className="h-3.5 w-3.5 text-[#C9A227]" strokeWidth={1.5} />
                  Finitions premium
                </span>
              </div>

            </div>{/* /max-w-lg text block */}
          </div>{/* /max-w-7xl */}
        </div>{/* /relative z-10 */}
      </section>

      {/* ═══════════════════════════════════════════════════════
          SHOP BY COLLECTION — minimal category cards
      ═══════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-16 py-20 md:py-24">
        {/* Section header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-[#C9A227] mb-2">Nos Univers</p>
            <h2 className="font-serif text-3xl md:text-4xl text-[#1A1A1A] tracking-tight">
              Par Collection
            </h2>
          </div>
          <Link href="/products">
            <span className="text-[10px] uppercase tracking-[0.35em] text-[#9B9B9B] hover:text-[#C9A227] transition-colors hidden sm:flex items-center gap-2">
              Voir tout <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-[#C9A227]/40" />
          </div>
        ) : categories.length === 0 ? null : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categories.slice(0, 4).map((cat) => (
              <Link key={cat.id} href={`/products?category=${cat.slug}`}>
                <div className="group relative bg-white border border-[#E8E2D9] hover:border-[#C9A227]/40 transition-all duration-500 p-8 flex flex-col items-center justify-center text-center gap-4 aspect-square md:aspect-auto md:py-12 cursor-pointer hover:shadow-md hover:shadow-[#C9A227]/5">
                  {/* Decorative corner */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#C9A227]/30 group-hover:border-[#C9A227] transition-colors duration-500" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#C9A227]/30 group-hover:border-[#C9A227] transition-colors duration-500" />

                  <div className="h-10 w-10 border border-[#C9A227]/20 group-hover:bg-[#C9A227]/10 flex items-center justify-center transition-colors duration-500">
                    <span className="font-serif text-[#C9A227] text-xl">{cat.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-serif text-[#1A1A1A] text-lg leading-tight">{cat.name}</h3>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#9B9B9B] mt-2">{cat._count?.products ?? 0} pièces</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════
          NEW ARRIVALS — image-first product grid
      ═══════════════════════════════════════════════════════ */}
      <section className="bg-white border-y border-[#E8E2D9] py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          {/* Header */}
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-[#C9A227] mb-2">Sélection</p>
              <h2 className="font-serif text-3xl md:text-4xl text-[#1A1A1A] tracking-tight">
                Nouvelles Arrivées
              </h2>
            </div>
            <Link href="/products">
              <Button
                variant="ghost"
                className="text-[10px] uppercase tracking-[0.35em] text-[#9B9B9B] hover:text-[#C9A227] hover:bg-transparent px-0 gap-2 hidden sm:flex"
              >
                Voir tout <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-[#C9A227]/40" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 md:gap-x-8 gap-y-12 md:gap-y-16">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Mobile CTA */}
          <div className="mt-12 flex justify-center sm:hidden">
            <Link href="/products">
              <Button variant="outline" className="rounded-none border-[#C9A227]/30 text-[10px] uppercase tracking-[0.35em] px-8 text-[#1A1A1A] hover:bg-[#C9A227]/5 hover:border-[#C9A227]">
                Voir toute la collection
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          WHY CAFTAN LATIFA — 3 benefits
      ═══════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-16 py-20 md:py-24">
        <div className="text-center mb-14">
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#C9A227] mb-3">L'Atelier Latifa</p>
          <h2 className="font-serif text-3xl md:text-4xl text-[#1A1A1A] tracking-tight">
            Pourquoi nous choisir ?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {[
            {
              icon: CheckCircle,
              title: "Artisanat Authentique",
              body: "Chaque pièce est confectionnée par des artisans marocains experts, avec des broderies faites à la main.",
            },
            {
              icon: Truck,
              title: "Livraison Rapide",
              body: "Livraison sous 24–48h dans toutes les grandes villes, paiement en espèces à la réception.",
            },
            {
              icon: Sparkles,
              title: "Qualité Premium",
              body: "Des tissus nobles sélectionnés pour leur douceur et leur tenue : georgette, velours, soie artisanale.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex flex-col items-center text-center gap-5 p-8 border border-[#E8E2D9] bg-white">
              <div className="h-11 w-11 border border-[#C9A227]/30 flex items-center justify-center">
                <Icon className="h-5 w-5 text-[#C9A227]" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-serif text-[#1A1A1A] text-lg mb-3">{title}</h3>
                <p className="text-[13px] text-[#6B6B6B] font-light leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FOOTER CTA STRIP — WhatsApp / contact
      ═══════════════════════════════════════════════════════ */}
      <section className="bg-[#1A1A1A] text-white py-16 md:py-20 text-center border-t border-[#C9A227]/20">
        <div className="max-w-2xl mx-auto px-6 space-y-6">
          <p className="text-[10px] uppercase tracking-[0.5em] text-[#C9A227]/70">Service Client</p>
          <h3 className="font-serif text-3xl md:text-4xl tracking-tight leading-tight">
            Une question sur votre commande ?
          </h3>
          <p className="text-[#FFFFFF60] text-sm font-light leading-relaxed max-w-sm mx-auto">
            Nos experts vous répondent sur WhatsApp, du lundi au samedi, de 9h à 21h.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <a
              href={`https://wa.me/${(settings?.whatsappNumber ?? '+212600000000').replace(/[^0-9]/g, '')}?text=${encodeURIComponent("Bonjour, j'aimerais avoir plus d'informations sur vos caftans.")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="h-12 px-10 bg-[#C9A227] hover:bg-[#C9A227]/90 text-black rounded-none text-[11px] uppercase tracking-[0.35em] font-semibold shadow-lg shadow-[#C9A227]/20 transition-all duration-300">
                Contacter sur WhatsApp
              </Button>
            </a>
            <Link href="/contact">
              <Button variant="outline" className="h-12 px-10 border-white/10 bg-transparent hover:bg-white/5 text-white rounded-none text-[11px] uppercase tracking-[0.35em] transition-all duration-300">
                Voir le contact
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
