"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, Menu, Search, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/features/public/cart/cartContext';
import { useQuery } from '@tanstack/react-query';
import type { ApiInitData } from '@/lib/types';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { MobileDrawer } from '@/components/layout/MobileDrawer';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useTranslation } from '@/i18n/provider';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount } = useCart();
  const [headerSearch, setHeaderSearch] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data } = useQuery<ApiInitData>({
    queryKey: ['/api/public/init'],
  });
  const settings = data?.settings;

  const isActive = (path: string) => {
    const currentLocale = pathname.split('/')[1];
    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/';
    
    if (path === '/') return pathWithoutLocale === '/';
    return pathWithoutLocale.startsWith(path);
  };

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = headerSearch.trim();
    if (q) {
      // Need to keep the locale prefix
      const currentLocale = pathname.split('/')[1];
      router.push(`/${currentLocale}/products?search=${encodeURIComponent(q)}`);
      setHeaderSearch('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary" suppressHydrationWarning>
      {/* Top Bar - Elevated Boutique Feel */}
      <div className="bg-[#0B0B0B] text-primary-foreground text-[10px] uppercase tracking-[0.2em] py-2 px-4 md:px-8 border-b border-primary/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center opacity-90">
          <span className="font-light hidden sm:inline-block">{t('layout.topbar.tagline')}</span>
          <div className="flex gap-4 sm:gap-6 items-center w-full justify-between sm:w-auto">
            <LanguageSwitcher />
            <span className="hidden sm:inline font-light border-x border-white/10 px-4 sm:px-6">{t('layout.topbar.customerService')} {settings?.whatsappNumber ?? '+212 600 000 000'}</span>
            <span className="font-medium text-primary rtl:text-end rtl:ms-auto sm:rtl:ms-0">{t('layout.topbar.freeShipping', { amount: (settings?.freeShippingThreshold ?? 50000) / 100 })}</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between gap-4 relative">
          {/* ZONE 1: Left Group (Hamburger + Logo) */}
          <div className="flex items-center gap-2 sm:gap-6 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:bg-primary/5"
              data-testid="button-menu"
              aria-label={t('layout.header.menuOpen')}
              aria-expanded={isDrawerOpen}
              aria-controls="mobile-nav-drawer"
              onClick={() => setIsDrawerOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Smooth mobile drawer — replaces Radix Sheet */}
            <MobileDrawer
              isOpen={isDrawerOpen}
              onClose={() => setIsDrawerOpen(false)}
              pathname={pathname}
              storeName={settings?.storeName}
            />

            <Link href="/" className="flex items-center flex-shrink-0" data-testid="link-logo">
              <div className="relative h-10 w-16 md:h-12 md:w-20">
                <Image
                  src="/logo.png"
                  alt={settings?.storeName ?? 'Caftan Latifa'}
                  fill
                  className="object-contain object-left md:object-center rtl:object-right"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* ZONE 2: Center Group (Flexible Store Name) */}
          <div className="flex-1 min-w-0 flex items-center">
            <Link href="/" className="group min-w-0 flex flex-col items-start transition-all duration-500">
              <span className="font-sans font-medium text-[12px] sm:font-serif sm:text-xl md:text-3xl sm:font-normal uppercase sm:normal-case tracking-[0.2em] sm:tracking-tighter text-foreground group-hover:text-primary transition-colors truncate block w-full leading-none">
                {settings?.storeName ?? 'Caftan Latifa'}
              </span>
              <span className="hidden sm:inline-block text-[8px] md:text-[9px] uppercase tracking-[0.4em] text-primary -mt-1 opacity-80 group-hover:opacity-100 line-clamp-1 font-serif italic">
                {t('layout.header.subtitle')}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8 ms-8 flex-shrink-0">
              {[
                { href: '/', label: t('layout.nav.home') },
                { href: '/products', label: t('layout.nav.collection') },
                { href: '/contact', label: t('layout.nav.contact') },
                { href: '/orders', label: t('layout.nav.orders') },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`text-[13px] uppercase tracking-widest transition-all duration-300 relative py-2 after:content-[''] after:absolute after:bottom-0 after:left-0 rtl:after:right-0 rtl:after:left-auto after:w-full after:h-[1px] after:bg-primary after:transform after:scale-x-0 group-hover:after:scale-x-100 after:transition-transform ${isActive(href) ? 'text-primary font-medium after:scale-x-100' : 'text-muted-foreground font-light hover:text-primary'}`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleHeaderSearch} className="hidden md:flex flex-1 max-w-xs mx-4 relative group flex-shrink-0">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors rtl:-scale-x-100" />
            <Input
              type="search"
              placeholder={t('layout.header.searchPlaceholder')}
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              className="ps-10 h-10 w-full bg-transparent border-border/60 rounded-none focus:border-primary/40 focus:ring-0 transition-all font-light text-sm italic"
            />
          </form>

          {/* ZONE 3: Right Group (Search + Cart) */}
          <div className="flex items-center gap-2 sm:gap-6 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-muted-foreground hover:text-primary"
              onClick={() => router.push('/products?search=')}
              data-testid="button-mobile-search"
            >
              <Search className="h-5 w-5 rtl:-scale-x-100" />
            </Button>

            <Link href="/cart">
              <div className="relative group p-2 rounded-full hover:bg-primary/5 transition-colors cursor-pointer" data-testid="button-cart">
                <ShoppingCart className="h-5 w-5 text-foreground group-hover:text-primary transition-colors rtl:-scale-x-100" />
                {isMounted && itemCount > 0 && (
                  <Badge variant="default" className="absolute top-0 end-0 h-4 w-4 p-0 flex items-center justify-center rounded-full text-[9px] bg-primary text-primary-foreground font-bold border-2 border-background">
                    {itemCount}
                  </Badge>
                )}
              </div>
            </Link>
          </div>
        </div>

      </header>

      {/* Main Content */}
      {/* pb-40 on mobile: 64px sticky checkout bar + 64px bottom nav + 16px gap */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-20 pb-40 md:pb-20" suppressHydrationWarning>
        {children}
      </main>

      {/* Footer - Crafted for Luxury */}
      <footer className="relative bg-[#0B0B0B] text-white overflow-hidden border-t border-primary/10">
        {/* Subtle Moroccan Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#C9A227_1px,transparent_1px)] [background-size:32px_32px]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 md:gap-12">
            <div className="space-y-6 flex flex-col items-start text-start">
              <div className="flex flex-col items-start gap-1">
                <span className="font-serif text-3xl tracking-tighter text-primary">{settings?.storeName ?? 'Caftan Latifa'}</span>
                <span className="text-[10px] uppercase tracking-[0.4em] text-white/60 text-start">{t('layout.header.subtitle')}</span>
              </div>
              <p className="text-sm text-white/50 leading-loose font-light italic text-start">
                {t('layout.footer.description')}
              </p>
            </div>

            <div className="md:ps-8 flex flex-col items-start text-start w-full">
              <h3 className="font-serif text-lg text-primary mb-8 tracking-wide text-start">{t('layout.footer.collections.title')}</h3>
              <ul className="space-y-4 text-[14px] text-white/60 font-light text-start w-full">
                <li className="text-start"><Link href="/products" className="hover:text-primary transition-all duration-300 flex items-center gap-2">{t('layout.footer.collections.all')}</Link></li>
                <li className="text-start"><Link href="/products?category=takchita" className="hover:text-primary transition-all duration-300">{t('layout.footer.collections.takchita')}</Link></li>
                <li className="text-start"><Link href="/products?category=caftan" className="hover:text-primary transition-all duration-300">{t('layout.footer.collections.caftan')}</Link></li>
                <li className="text-start"><Link href="/products?category=accessories" className="hover:text-primary transition-all duration-300">{t('layout.footer.collections.accessories')}</Link></li>
              </ul>
            </div>

            <div className="flex flex-col items-start text-start w-full">
              <h3 className="font-serif text-lg text-primary mb-8 tracking-wide text-start">{t('layout.footer.house.title')}</h3>
              <ul className="space-y-4 text-[14px] text-white/60 font-light text-start w-full">
                <li className="text-start"><Link href="/contact" className="hover:text-primary transition-all duration-300">{t('layout.footer.house.atelier')}</Link></li>
                <li className="text-start"><Link href="/contact" className="hover:text-primary transition-all duration-300">{t('layout.footer.house.sizes')}</Link></li>
                <li className="text-start"><Link href="/contact" className="hover:text-primary transition-all duration-300">{t('layout.footer.house.shipping')}</Link></li>
                <li className="text-start"><Link href="/contact" className="hover:text-primary transition-all duration-300">{t('layout.footer.house.faq')}</Link></li>
              </ul>
            </div>

            <div className="bg-white/5 p-8 border border-white/10 relative text-start flex flex-col items-start">
              <div className="absolute top-0 end-0 w-12 h-12 border-t border-e border-primary/30"></div>
              <h3 className="font-serif text-lg text-primary mb-6 tracking-wide text-start">{t('layout.footer.contact.title')}</h3>
              <ul className="space-y-6 text-sm">
                <li className="group cursor-pointer">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 block mb-1 text-start">{t('layout.footer.contact.whatsapp')}</span>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary transition-colors duration-500">
                      <Phone className="h-4 w-4 text-primary group-hover:text-black transition-colors rtl:-scale-x-100" />
                    </div>
                    <span className="text-white font-medium text-lg tracking-tight">{settings?.whatsappNumber ?? '+212 600 000 000'}</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 mt-20 pt-10 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] uppercase tracking-[0.2em] text-white/30 font-light">
            <p>&copy; {new Date().getFullYear()} {settings?.storeName ?? 'Caftan Latifa'}. {t('layout.footer.copyright')}</p>
            <div className="flex gap-8">
              <span>{t('layout.footer.artOfLiving')}</span>
              <span className="text-primary/60">{t('layout.footer.madeIn')}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation — shown on all store pages except checkout */}
      {pathname !== '/checkout' && <MobileBottomNav />}

    </div>
  );
}
