'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, ShoppingBag, Plus, Tags,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { i18n } from '@/i18n/config';

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
}

interface MobileBottomNavProps {
  unreadNotifications?: number;
}

export function MobileBottomNav({ unreadNotifications = 0 }: MobileBottomNavProps) {
  const pathname = usePathname();

  const currentLocale =
    i18n.locales.find((l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`) ||
    i18n.defaultLocale;

  const navItems: NavItem[] = [
    {
      id: 'home',
      icon: LayoutDashboard,
      label: 'Home',
      href: `/${currentLocale}/admin`,
    },
    {
      id: 'orders',
      icon: ShoppingBag,
      label: 'Orders',
      href: `/${currentLocale}/admin/orders`,
    },
    {
      id: 'add-product',
      icon: Plus,
      label: 'Add',
      href: `/${currentLocale}/admin/products?new=true`,
    },
    {
      id: 'categories',
      icon: Tags,
      label: 'Categories',
      href: `/${currentLocale}/admin/categories`,
    },
  ];

  return (
    <nav
      className={cn(
        'fixed bottom-0 inset-x-0 z-50 md:hidden',
        'bg-sidebar border-t border-sidebar-border',
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === `/${currentLocale}/admin`
              ? pathname === item.href
              : pathname.startsWith(item.href);
          const isScan = item.id === 'add-product';

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 relative',
                'text-sidebar-foreground/60 hover:text-sidebar-foreground',
                'transition-colors duration-150',
                isActive && 'text-sidebar-primary',
              )}
            >
              {/* Special "raised" pill for Scan */}
              {isScan ? (
                <div className="relative -mt-6">
                  <div
                    className={cn(
                      'h-12 w-12 rounded-full flex items-center justify-center',
                      'bg-sidebar-primary text-sidebar-primary-foreground',
                      'shadow-lg shadow-sidebar-primary/30',
                      'border-2 border-sidebar',
                    )}
                  >
                    <Icon className="h-6 w-6" strokeWidth={2.5} />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Icon
                    className={cn('h-5 w-5 transition-transform duration-150', isActive && 'scale-110')}
                    strokeWidth={isActive ? 2.5 : 1.75}
                  />
                  {/* Badge */}
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center leading-none">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  ) : null}
                </div>
              )}

              {/* Label */}
              <span
                className={cn(
                  'text-[10px] font-medium leading-none',
                  isScan && 'mt-1',
                  isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/50',
                )}
              >
                {item.label}
              </span>

              {/* Active indicator dot */}
              {isActive && !isScan && (
                <motion.div
                  layoutId="nav-active-dot"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full bg-sidebar-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
