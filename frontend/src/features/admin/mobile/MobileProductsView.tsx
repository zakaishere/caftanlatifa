'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Package, Loader2, RefreshCw, Search, Plus
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { ApiProduct } from '@/lib/types';
import { useTranslation } from '@/i18n/provider';
import { MobileProductCard } from './MobileProductCard';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';

interface MobileProductsViewProps {
  onOpenAddProduct: () => void;
  onEditProduct: (product: ApiProduct) => void;
}

function ProductCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 bg-card border-b border-border/40 animate-pulse">
      <div className="h-12 w-12 rounded-lg bg-muted shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-3/4 bg-muted rounded" />
        <div className="h-2.5 w-1/3 bg-muted/60 rounded" />
      </div>
      <div className="h-6 w-16 bg-muted rounded shrink-0" />
    </div>
  );
}

export function MobileProductsView({ onOpenAddProduct, onEditProduct }: MobileProductsViewProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  // Default query for mobile (initial load size is ~20 items)
  const { data, isLoading, refetch, isFetching } = useQuery<{ data: ApiProduct[], total: number }>({
    queryKey: ['/api/admin/products', debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      params.set('limit', '50'); // Load enough to scroll but not crash
      
      const res = await fetch(`/api/admin/products?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch products');
      const json = await res.json();
      return Array.isArray(json) ? { data: json, total: json.length } : json;
    },
  });

  const products = data?.data ?? [];
  const total = data?.total ?? 0;

  // Toggle stock status
  const toggleStatus = useMutation({
    mutationFn: async ({ id, inStock }: { id: string; inStock: boolean }) => {
      await apiRequest('PATCH', `/api/admin/products/${id}`, { inStock });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      toast({ title: t('admin.products.toast.statusUpdated') });
    },
    onError: (err: Error) => {
      toast({ title: t('admin.products.toast.errorTitle'), description: err.message, variant: 'destructive' });
    },
  });

  return (
    <div className="min-h-full pb-20">
      {/* ── Sticky Header & Search ── */}
      <div className="sticky top-[56px] z-30 bg-background/95 backdrop-blur-md pt-2 pb-3 px-4 -mx-4 border-b border-border/40 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Products
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">
              {total} total
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className={cn(
                'h-8 w-8 rounded-lg flex items-center justify-center border border-border/50 bg-card text-muted-foreground hover:bg-muted transition-colors'
              )}
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
            </button>
            <Button size="sm" onClick={onOpenAddProduct} className="h-8 px-3 text-xs gap-1.5 font-semibold">
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
          <Input
            type="search"
            placeholder="Search products…"
            className="ps-9 h-9 text-[13px] border-border/60 bg-muted/30 focus-visible:ring-1 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Product List ── */}
      <div className="mt-2 -mx-4">
        {isLoading ? (
          <div>
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Package className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No products found</p>
              <p className="text-[13px] text-muted-foreground mt-1 max-w-[250px] mx-auto">
                {debouncedSearch ? `No results for "${debouncedSearch}"` : 'Get started by creating your first product'}
              </p>
            </div>
            {debouncedSearch && (
              <Button variant="outline" size="sm" onClick={() => setSearch('')} className="mt-2 h-8 text-xs font-semibold">
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <motion.div>
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 10) * 0.03, duration: 0.2 }}
              >
                <MobileProductCard
                  product={product}
                  onEdit={onEditProduct}
                  onToggleStatus={(id, inStock) => toggleStatus.mutate({ id, inStock: !inStock })}
                  isToggling={toggleStatus.isPending && toggleStatus.variables?.id === product.id}
                />
              </motion.div>
            ))}
            
            {products.length === 50 && (
              <p className="text-center text-xs text-muted-foreground py-6">
                Showing top 50 results. Use search to find more.
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
