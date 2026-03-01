"use client";
import { useState, useEffect } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, ShoppingCart, ClipboardList } from 'lucide-react';
import { useCart } from '@/features/public/cart/cartContext';

const navItems = [
    { href: '/', icon: Home, label: 'Accueil' },
    { href: '/products', icon: ShoppingBag, label: 'Collections' },
    { href: '/cart', icon: ShoppingCart, label: 'Panier', showBadge: true },
    { href: '/orders', icon: ClipboardList, label: 'Commandes' },
];

export function MobileBottomNav() {
    const pathname = usePathname();
    const { itemCount } = useCart();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/80 backdrop-blur-xl border-t border-primary/10 pb-[env(safe-area-inset-bottom)]">
            <div className="grid grid-cols-4 h-16">
                {navItems.map(({ href, icon: Icon, label, showBadge }) => {
                    const active = isActive(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex flex-col items-center justify-center gap-1 relative transition-all duration-300 ${active
                                ? 'text-primary'
                                : 'text-muted-foreground/60'
                                }`}
                        >
                            <div className="relative">
                                <Icon className={`h-[18px] w-[18px] transition-transform duration-500 ${active ? 'scale-110' : ''}`} strokeWidth={active ? 2 : 1.5} />
                                {showBadge && isMounted && itemCount > 0 && (
                                    <span className="absolute -top-2 -right-2 h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[8px] font-bold border-2 border-background">
                                        {itemCount > 99 ? '99+' : itemCount}
                                    </span>
                                )}
                            </div>
                            <span className={`text-[9px] uppercase tracking-widest ${active ? 'font-medium' : 'font-light opacity-70'}`}>
                                {label}
                            </span>
                            {active && (
                                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-primary rounded-full shadow-[0_0_8px_hsl(var(--primary)/0.4)]" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
