'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, ShoppingBag, RefreshCw, X } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { ApiOrder, OrderStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { MobileOrderRow } from './MobileOrderRow';
import { OrderDetailSheet } from './OrderDetailSheet';

// ── Filter config ─────────────────────────────────────────────────────────────
const STATUS_FILTERS: { key: OrderStatus | null; label: string }[] = [
  { key: null,        label: 'All'       },
  { key: 'PENDING',   label: 'Pending'   },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

// ── Count badge ───────────────────────────────────────────────────────────────
const STATUS_COUNTS_STYLE: Record<OrderStatus, string> = {
  PENDING:   'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30 animate-pulse">
      <div className="w-1 h-10 rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-2/3 rounded bg-muted" />
        <div className="h-2.5 w-1/2 rounded bg-muted/60" />
        <div className="h-2.5 w-1/3 rounded bg-muted/40" />
      </div>
      <div className="h-3 w-3 rounded bg-muted/40 shrink-0" />
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function MobileOrdersView() {
  const { toast } = useToast();

  // UI state
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<OrderStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Data
  const { data: orders = [], isLoading, refetch, isFetching } = useQuery<ApiOrder[]>({
    queryKey: ['/api/admin/orders'],
  });

  // Mutation
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const res = await apiRequest('PATCH', `/api/admin/orders/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setDrawerOpen(false);
      toast({ title: 'Order status updated' });
    },
    onError: (err: Error) => {
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
    },
  });

  const handleTap = useCallback((order: ApiOrder) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  }, []);

  const handleUpdateStatus = useCallback((id: string, status: OrderStatus) => {
    updateStatus.mutate({ id, status });
  }, [updateStatus]);

  // Filtering + Searching + Sorting (all client-side — data set is small)
  const displayedOrders = useMemo(() => {
    let result = [...orders];

    // Search: name, order id, phone
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((o) =>
        o.customerName.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        (o.phone || '').toLowerCase().includes(q)
      );
    }

    // Status chip filter
    if (activeFilter) {
      result = result.filter((o) => o.status === activeFilter);
    }

    // Sort: PENDING first, then newest
    result.sort((a, b) => {
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
      if (b.status === 'PENDING' && a.status !== 'PENDING') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [orders, searchQuery, activeFilter]);

  // Count badges per status
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: orders.length };
    for (const o of orders) {
      map[o.status] = (map[o.status] || 0) + 1;
    }
    return map;
  }, [orders]);

  const pendingCount = counts['PENDING'] ?? 0;

  return (
    // Root wrapper: must NEVER be wider than the viewport.
    // overflow-x-hidden clips any accidental overflow at this level.
    // pb-28 gives space above the sticky mobile bottom nav.
    <div
      className="w-full max-w-full overflow-x-hidden min-h-svh pb-28 box-border"
      style={{ contain: 'layout' }}
    >

      {/* ── Sticky command bar ── */}
      {/* overflow-x-hidden + w-full here prevents the backdrop-blur from expanding layout */}
      <div className="sticky top-0 z-30 w-full overflow-x-hidden bg-background/95 backdrop-blur-sm border-b border-border/40 box-border">

        {/* Page title row */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 w-full min-w-0">
          <div className="min-w-0 flex-1 mr-3">
            <h1 className="text-[17px] font-bold tracking-tight text-foreground">Orders</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {orders.length} total
              {pendingCount > 0 && (
                <span className="ml-1.5 text-amber-600 font-semibold">· {pendingCount} pending</span>
              )}
            </p>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh orders"
            className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center border border-border/50 bg-card active:bg-muted transition-colors"
          >
            <RefreshCw className={cn('h-4 w-4 text-muted-foreground', isFetching && 'animate-spin')} />
          </button>
        </div>

        {/* Search input */}
        <div className="px-4 pb-2.5 w-full box-border">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
            <input
              type="search"
              placeholder="Search name, ID, or phone…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full h-9 rounded-xl pl-9 pr-9 text-[13px] box-border',
                'bg-muted/40 border border-border/30',
                'placeholder:text-muted-foreground/40 text-foreground',
                'focus:outline-none focus:ring-1 focus:ring-ring focus:bg-background',
                'transition-colors',
              )}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Status filter chips — scrollable horizontally but clips at container edge */}
        <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-none w-full box-border">
          {STATUS_FILTERS.map(({ key, label }) => {
            const count = key ? (counts[key] ?? 0) : counts.all;
            const isActive = activeFilter === key;
            const countStyle = key && !isActive ? STATUS_COUNTS_STYLE[key] : '';

            return (
              <button
                key={String(key)}
                onClick={() => setActiveFilter(key)}
                className={cn(
                  'shrink-0 flex items-center gap-1.5 h-7 px-3 rounded-full',
                  'text-[11px] font-semibold transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-foreground text-background shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted active:bg-muted',
                )}
              >
                {label}
                <span className={cn(
                  'text-[9px] font-bold px-1 py-0.5 rounded-full min-w-[16px] text-center',
                  isActive ? 'bg-white/20 text-background' : cn('bg-background', countStyle || 'text-muted-foreground'),
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Order list ── */}
      {isLoading ? (
        <div>
          {Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)}
        </div>
      ) : displayedOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <ShoppingBag className="h-6 w-6 text-muted-foreground/30" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-foreground">No orders found</p>
            <p className="text-[12px] text-muted-foreground mt-1">
              {searchQuery || activeFilter ? 'Try clearing your filters' : 'Orders will appear here'}
            </p>
          </div>
          {(searchQuery || activeFilter) && (
            <button
              onClick={() => { setSearchQuery(''); setActiveFilter(null); }}
              className="text-[12px] font-semibold text-primary underline underline-offset-2 mt-1"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="w-full">
          {displayedOrders.map((order) => (
            <MobileOrderRow
              key={order.id}
              order={order}
              onTap={handleTap}
              isPending={updateStatus.isPending && updateStatus.variables?.id === order.id}
            />
          ))}
          {displayedOrders.length > 0 && (
            <p className="text-center text-[10px] text-muted-foreground/40 py-6">
              {displayedOrders.length} order{displayedOrders.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* ── Detail sheet ── */}
      <OrderDetailSheet
        order={selectedOrder}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdateStatus={handleUpdateStatus}
        isPending={updateStatus.isPending}
      />
    </div>
  );
}
