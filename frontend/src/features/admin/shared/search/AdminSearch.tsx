'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tags,
  Settings,
  ArrowRight,
  Search,
  Boxes,
  Plus,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { ApiProduct } from '@/lib/types';
import { centsToMad } from '@/lib/types';
import { i18n } from '@/i18n/config';
import { cn } from '@/lib/utils';

interface AdminSearchProps {
  onOpenAddProduct?: () => void;
}

export function AdminSearch({ onOpenAddProduct }: AdminSearchProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  const currentLocale =
    i18n.locales.find((l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`) ||
    i18n.defaultLocale;

  // ── Keyboard shortcut ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Product search (only when dialog is open and query ≥ 2 chars) ─────────
  const { data: products = [] } = useQuery<ApiProduct[]>({
    queryKey: ['/api/admin/products', 'search', search],
    queryFn: async () => {
      if (search.trim().length < 2) return [];
      const res = await fetch(
        `/api/admin/products?search=${encodeURIComponent(search)}&limit=6`,
        { credentials: 'include' }
      );
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json) ? json : (json.data ?? []);
    },
    enabled: open && search.trim().length >= 2,
    staleTime: 30_000,
  });

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', href: `/${currentLocale}/admin` },
    { icon: Tags, label: 'Categories', href: `/${currentLocale}/admin/categories` },
    { icon: Package, label: 'Products', href: `/${currentLocale}/admin/products` },
    { icon: ShoppingBag, label: 'Orders', href: `/${currentLocale}/admin/orders` },
    { icon: Settings, label: 'Settings', href: `/${currentLocale}/admin/settings` },
  ];

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      setSearch('');
      router.push(href);
    },
    [router]
  );

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) setSearch('');
  };

  return (
    <>
      {/* Trigger button (used in admin header) */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center gap-2 h-8 px-3 rounded-md text-sm',
          'bg-muted/60 hover:bg-muted border border-border/50 hover:border-border',
          'text-muted-foreground hover:text-foreground transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        )}
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline text-[13px]">Search…</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border/60 bg-background text-[10px] font-mono text-muted-foreground/70 ml-1">
          <span>⌘K</span>
        </kbd>
      </button>

      {/* Command palette dialog */}
      <CommandDialog open={open} onOpenChange={handleClose}>
        <CommandInput
          placeholder="Search products, pages, actions…"
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>
            <div className="flex flex-col items-center gap-1.5 py-2 text-center">
              <Boxes className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No results for "{search}"</p>
            </div>
          </CommandEmpty>

          {/* Actions */}
          <CommandGroup heading="Actions">
            <CommandItem
              onSelect={() => {
                setOpen(false);
                onOpenAddProduct?.();
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4 text-muted-foreground" />
              Add new product
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* Navigation */}
          <CommandGroup heading="Navigate to">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.href}
                  onSelect={() => navigate(item.href)}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {item.label}
                  <CommandShortcut>
                    <ArrowRight className="h-3.5 w-3.5 opacity-40" />
                  </CommandShortcut>
                </CommandItem>
              );
            })}
          </CommandGroup>

          {/* Product search results */}
          {search.trim().length >= 2 && products.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Products">
                {products.map((product) => (
                  <CommandItem
                    key={product.id}
                    onSelect={() =>
                      navigate(`/${currentLocale}/admin/products?highlight=${product.id}`)
                    }
                    className="gap-3"
                  >
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt=""
                        className="h-6 w-6 rounded object-cover border border-border/40 shrink-0"
                      />
                    ) : (
                      <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm truncate">{product.name}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {centsToMad(product.price)} MAD
                        {product.category ? ` · ${product.category.name}` : ''}
                      </span>
                    </div>
                    <CommandShortcut>
                      <ArrowRight className="h-3.5 w-3.5 opacity-40" />
                    </CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
