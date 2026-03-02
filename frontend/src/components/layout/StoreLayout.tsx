"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, Menu, Search, Phone, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/features/public/cart/cartContext';
import { useQuery } from '@tanstack/react-query';
import type { ApiInitData } from '@/lib/types';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount } = useCart();
  const [headerSearch, setHeaderSearch] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data } = useQuery<ApiInitData>({
    queryKey: ['/api/public/init'],
  });
  const settings = data?.settings;

  const isActive = (path: string) => pathname === path;

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = headerSearch.trim();
    if (q) {
      router.push(`/products?search=${encodeURIComponent(q)}`);
      setHeaderSearch('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary" suppressHydrationWarning>
      {/* Top Bar - Elevated Boutique Feel */}
      <div className="bg-[#0B0B0B] text-primary-foreground text-[10px] uppercase tracking-[0.2em] py-2 px-4 md:px-8 border-b border-primary/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center opacity-90">
          <span className="font-light">L'élégance du Caftan Marocain</span>
          <div className="flex gap-6">
            <span className="hidden sm:inline font-light border-r border-white/10 pr-6">Service Client: {settings?.whatsappNumber ?? '+212 600 000 000'}</span>
            <span className="font-medium text-primary">Livraison Gratuite +{((settings?.freeShippingThreshold ?? 50000) / 100)} MAD</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between gap-8">

          {/* Logo & Mobile Menu */}
          <div className="flex items-center gap-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden hover:bg-primary/5" data-testid="button-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] border-r-primary/10">
                <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
                <div className="mt-8 mb-10 text-center">
                  <h2 className="font-serif text-2xl tracking-tighter text-primary">Caftan Latifa</h2>
                  <div className="h-[1px] w-12 bg-primary/30 mx-auto mt-2" />
                </div>
                <nav className="flex flex-col gap-2">
                  {[
                    { href: '/', label: 'Accueil' },
                    { href: '/products', label: 'Collections' },
                    { href: '/cart', label: 'Mon Panier' },
                    { href: '/contact', label: 'Contact' },
                    { href: '/orders', label: 'Mes Commandes' },
                  ].map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className={`text-base font-light px-4 py-3 transition-all duration-300 border-l-2 ${isActive(href)
                        ? 'text-primary bg-primary/5 border-primary font-medium'
                        : 'text-foreground border-transparent hover:border-primary/30 hover:bg-muted/30'
                        }`}
                    >
                      {label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex flex-col items-center group transition-all duration-500" data-testid="link-logo">
              <div className="relative h-14 w-32 md:h-16 md:w-40 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt={settings?.storeName ?? 'Caftan Latifa'}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-8 ml-8">
              {[
                { href: '/', label: 'Accueil' },
                { href: '/products', label: 'Collection' },
                { href: '/contact', label: 'Contact' },
                { href: '/orders', label: 'Mes Commandes' },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`text-[13px] uppercase tracking-widest transition-all duration-300 relative py-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-primary after:transform after:scale-x-0 group-hover:after:scale-x-100 after:transition-transform ${isActive(href) ? 'text-primary font-medium after:scale-x-100' : 'text-muted-foreground font-light hover:text-primary'}`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleHeaderSearch} className="hidden md:flex flex-1 max-w-xs mx-4 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type="search"
              placeholder="Rechercher un caftan..."
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              className="pl-10 h-10 w-full bg-transparent border-border/60 rounded-none focus:border-primary/40 focus:ring-0 transition-all font-light text-sm italic"
            />
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-6">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-muted-foreground hover:text-primary"
              onClick={() => router.push('/products?search=')}
              data-testid="button-mobile-search"
            >
              <Search className="h-5 w-5" />
            </Button>

            <Link href="/cart">
              <div className="relative group p-2 rounded-full hover:bg-primary/5 transition-colors cursor-pointer" data-testid="button-cart">
                <ShoppingCart className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
                {isMounted && itemCount > 0 && (
                  <Badge variant="default" className="absolute top-0 right-0 h-4 w-4 p-0 flex items-center justify-center rounded-full text-[9px] bg-primary text-primary-foreground font-bold border-2 border-background">
                    {itemCount}
                  </Badge>
                )}
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 pb-24 md:pb-20" suppressHydrationWarning>
        {children}
      </main>

      {/* Footer - Crafted for Luxury */}
      <footer className="relative bg-[#0B0B0B] text-white overflow-hidden border-t border-primary/10">
        {/* Subtle Moroccan Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#C9A227_1px,transparent_1px)] [background-size:32px_32px]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 md:gap-12">
            <div className="space-y-6">
              <div className="flex flex-col items-start gap-1">
                <span className="font-serif text-3xl tracking-tighter text-primary">{settings?.storeName ?? 'Caftan Latifa'}</span>
                <span className="text-[10px] uppercase tracking-[0.4em] text-white/60">Maison de Couture</span>
              </div>
              <p className="text-sm text-white/50 leading-loose font-light italic">
                L'héritage de l'artisanat marocain sublimé par une élégance contemporaine. Chaque pièce raconte une histoire de passion et de tradition.
              </p>
            </div>

            <div className="md:pl-8">
              <h3 className="font-serif text-lg text-primary mb-8 tracking-wide">Collections</h3>
              <ul className="space-y-4 text-[14px] text-white/60 font-light">
                <li><Link href="/products" className="hover:text-primary transition-all duration-300 flex items-center gap-2">Tout les modèles</Link></li>
                <li><Link href="/products?category=takchita" className="hover:text-primary transition-all duration-300">Takchitas d'exception</Link></li>
                <li><Link href="/products?category=caftan" className="hover:text-primary transition-all duration-300">Caftans Haute Couture</Link></li>
                <li><Link href="/products?category=accessories" className="hover:text-primary transition-all duration-300">Accessoires & Parures</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-serif text-lg text-primary mb-8 tracking-wide">La Maison</h3>
              <ul className="space-y-4 text-[14px] text-white/60 font-light">
                <li><Link href="/contact" className="hover:text-primary transition-all duration-300">Notre Atelier</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-all duration-300">Guide des Tailles</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-all duration-300">Livraison & Retours</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-all duration-300">FAQ</Link></li>
              </ul>
            </div>

            <div className="bg-white/5 p-8 border border-white/10 relative">
              <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-primary/30"></div>
              <h3 className="font-serif text-lg text-primary mb-6 tracking-wide">Contact</h3>
              <ul className="space-y-6 text-sm">
                <li className="group cursor-pointer">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">WhatsApp Support</span>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary transition-colors duration-500">
                      <Phone className="h-4 w-4 text-primary group-hover:text-black transition-colors" />
                    </div>
                    <span className="text-white font-medium text-lg tracking-tight">{settings?.whatsappNumber ?? '+212 600 000 000'}</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 mt-20 pt-10 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] uppercase tracking-[0.2em] text-white/30 font-light">
            <p>&copy; {new Date().getFullYear()} {settings?.storeName ?? 'Caftan Latifa'}. Tous droits réservés.</p>
            <div className="flex gap-8">
              <span>L'Art de Vivre à la Marocaine</span>
              <span className="text-primary/60">Imaginé au Maroc 🇲🇦</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      {!['/checkout', '/cart'].includes(pathname) && <MobileBottomNav />}
    </div>
  );
}
