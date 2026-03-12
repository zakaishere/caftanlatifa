'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ShoppingBag, Loader2, RefreshCw, Flag } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { ApiOrder, OrderStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/i18n/provider';
import { MobileOrderCard } from './MobileOrderCard';
import { OrderQuickEditDrawer } from './OrderQuickEditDrawer';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ── Status filter tabs ────────────────────────────────────────────────────────
const STATUS_TABS = [
  { key: null,        label: 'All' },
  { key: 'PENDING',   label: 'Pending' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' },
] as const;

type FilterKey = typeof STATUS_TABS[number]['key'];

// ── Skeleton card ─────────────────────────────────────────────────────────────
function OrderCardSkeleton() {
  return (
    <div className="bg-card border border-border/40 rounded-xl overflow-hidden animate-pulse">
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="h-3 w-12 rounded bg-muted/60" />
        </div>
        <div className="h-5 w-20 rounded-full bg-muted" />
      </div>
      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-3 w-24 rounded bg-muted/60" />
          <div className="h-3 w-16 rounded bg-muted/50" />
        </div>
        <div className="h-7 w-20 rounded bg-muted" />
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function MobileOrdersView() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>(null);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

  const { data: orders = [], isLoading, refetch, isFetching } = useQuery<ApiOrder[]>({
    queryKey: ['/api/admin/orders'],
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const res = await apiRequest('PATCH', `/api/admin/orders/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setDrawerOpen(false);
      toast({ title: t('admin.orders.toast.statusUpdated') });
    },
    onError: (err: Error) => {
      toast({ title: t('admin.orders.toast.errorTitle'), description: err.message, variant: 'destructive' });
    },
  });

  const handleTap = useCallback((order: ApiOrder) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  }, []);

  const handleConfirm = useCallback((order: ApiOrder) => {
    if (order.status === 'PENDING') {
      updateStatus.mutate({ id: order.id, status: 'CONFIRMED' });
      toast({ title: `#${order.id.slice(-6).toUpperCase()} confirmed` });
    }
  }, [updateStatus, toast]);

  const handleFlag = useCallback((order: ApiOrder) => {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      next.has(order.id) ? next.delete(order.id) : next.add(order.id);
      return next;
    });
    toast({ title: `#${order.id.slice(-6).toUpperCase()} flagged for review` });
  }, [toast]);

  // Filter by tab
  const filteredOrders = activeFilter
    ? orders.filter((o) => o.status === activeFilter)
    : orders;

  // Sort: PENDING first, then by date desc
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
    if (b.status === 'PENDING' && a.status !== 'PENDING') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;

  return (
    <div className="min-h-full pb-28 w-full max-w-full overflow-x-hidden box-border">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-3 mt-1">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Orders
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {orders.length} total
            {pendingCount > 0 && (
              <span className="ml-1.5 text-amber-600 font-medium">· {pendingCount} pending</span>
            )}
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className={cn(
            'h-9 w-9 rounded-lg flex items-center justify-center',
            'border border-border/50 bg-card text-muted-foreground',
            'hover:bg-muted transition-colors',
          )}
        >
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
        </button>
      </div>

      {/* ── Flagged banner ── */}
      {flaggedIds.size > 0 && (
        <div className="flex items-center gap-2 px-2.5 py-1.5 mb-2.5 bg-rose-50 border border-rose-200 rounded-lg">
          <Flag className="h-3 w-3 text-rose-500 shrink-0" />
          <p className="text-[11px] text-rose-700 font-medium tracking-tight">
            {flaggedIds.size} order{flaggedIds.size > 1 ? 's' : ''} flagged for review
          </p>
          <button
            onClick={() => setFlaggedIds(new Set())}
            className="ml-auto text-[11px] text-rose-500 font-medium"
          >
            Clear
          </button>
        </div>
      )}

      {/* ── Filter tabs (horizontal scroll) ── */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none w-full max-w-full">
        {STATUS_TABS.map(({ key, label }) => {
          const count = key
            ? orders.filter((o) => o.status === key).length
            : orders.length;
          const isActive = activeFilter === key;

          return (
            <button
              key={String(key)}
              onClick={() => setActiveFilter(key)}
              className={cn(
                'shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all',
                isActive
                  ? 'bg-foreground text-background shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted',
              )}
            >
              {label}
              <span className={cn(
                'text-[9px] font-bold px-1.5 py-[1px] rounded-full',
                isActive ? 'bg-background/20 text-background' : 'bg-background/80 text-muted-foreground',
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Order card list ── */}
      {isLoading ? (
        <div className="space-y-3 w-full">
          {Array.from({ length: 5 }).map((_, i) => (
            <OrderCardSkeleton key={i} />
          ))}
        </div>
      ) : sortedOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <ShoppingBag className="h-6 w-6 text-muted-foreground/40" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No orders</p>
            <p className="text-xs text-muted-foreground mt-1">
              {activeFilter ? 'Try a different filter' : 'Orders will appear here'}
            </p>
          </div>
          {activeFilter && (
            <Button variant="outline" size="sm" onClick={() => setActiveFilter(null)} className="h-8 text-xs mt-1">
              Show all
            </Button>
          )}
        </div>
      ) : (
        <motion.div className="space-y-3 w-full pb-6">
          {sortedOrders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
            >
              <MobileOrderCard
                order={order}
                onTap={handleTap}
                onConfirm={handleConfirm}
                onFlag={handleFlag}
                isPending={updateStatus.isPending && updateStatus.variables?.id === order.id}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Quick edit drawer ── */}
      <OrderQuickEditDrawer
        order={selectedOrder}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdateStatus={(id, status) => updateStatus.mutate({ id, status })}
        isPending={updateStatus.isPending}
      />
    </div>
  );
}
