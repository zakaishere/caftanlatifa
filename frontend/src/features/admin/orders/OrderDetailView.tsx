'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle, Truck, XCircle, Phone, MapPin,
  Clock, Package, CreditCard, MessageSquare, Loader2, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { ApiOrder, ApiOrderItem, OrderStatus } from '@/lib/types';
import { centsToMad } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { i18n } from '@/i18n/config';

// ── Status styles ────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<OrderStatus, { label: string; color: string; dot: string }> = {
  PENDING:   { label: 'Pending',   color: 'text-amber-700 bg-amber-50 border-amber-200',         dot: 'bg-amber-400' },
  CONFIRMED: { label: 'Confirmed', color: 'text-blue-700 bg-blue-50 border-blue-200',            dot: 'bg-blue-400' },
  DELIVERED: { label: 'Delivered', color: 'text-emerald-700 bg-emerald-50 border-emerald-200',   dot: 'bg-emerald-400' },
  CANCELLED: { label: 'Cancelled', color: 'text-rose-700 bg-rose-50 border-rose-200',            dot: 'bg-rose-400' },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-2 px-1">
      {children}
    </p>
  );
}

function InfoRow({ icon: Icon, label, value, mono = false }: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/40 last:border-0">
      <Icon className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground/50 mb-0.5">{label}</p>
        <p className={cn('text-[14px] text-foreground leading-snug', mono && 'font-mono')} dir={mono ? 'ltr' : undefined}>
          {value}
        </p>
      </div>
    </div>
  );
}

function ItemCard({ item }: { item: ApiOrderItem }) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-border/30 last:border-0">
      <div className="h-14 w-14 rounded-xl bg-muted overflow-hidden border border-border/30 shrink-0 flex items-center justify-center">
        {item.image
          ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
          : <Package className="h-5 w-5 text-muted-foreground/30" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-foreground truncate">{item.name}</p>
        <div className="flex items-center gap-2 mt-0.5 text-[12px] text-muted-foreground/60">
          {item.size && <span className="uppercase font-medium bg-muted px-1.5 py-px rounded text-[10px]">{item.size}</span>}
          <span>× {item.quantity}</span>
          <span className="text-muted-foreground/30">·</span>
          <span dir="ltr">{centsToMad(item.price)} MAD each</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[15px] font-bold text-foreground tabular-nums" dir="ltr">
          {centsToMad(item.price * item.quantity)}
        </p>
        <p className="text-[10px] text-muted-foreground/50 font-medium">MAD</p>
      </div>
    </div>
  );
}

// ── Props ────────────────────────────────────────────────────────────────────
interface OrderDetailViewProps {
  orderId: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function OrderDetailView({ orderId }: OrderDetailViewProps) {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  // Derive locale from pathname
  const locale = i18n.locales.find(
    (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
  ) ?? i18n.defaultLocale;

  const backHref = `/${locale}/admin/orders`;

  // Fetch order list and find by id (reuses the cached list — no extra network request)
  const { data: orders = [], isLoading, refetch, isFetching } = useQuery<ApiOrder[]>({
    queryKey: ['/api/admin/orders'],
  });

  const order = orders.find((o) => o.id === orderId) ?? null;
  const status = order ? STATUS_STYLES[order.status] : null;

  // Status mutation
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const res = await apiRequest('PATCH', `/api/admin/orders/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({ title: 'Status updated' });
    },
    onError: (err: Error) => {
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
    },
  });

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
        <Package className="h-12 w-12 text-muted-foreground/30" />
        <div>
          <p className="text-[16px] font-semibold text-foreground">Order not found</p>
          <p className="text-[13px] text-muted-foreground mt-1">
            The order ID <span className="font-mono">{orderId.slice(-8).toUpperCase()}</span> does not exist.
          </p>
        </div>
        <Link href={backHref}>
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  const canAct = order.status === 'PENDING' || order.status === 'CONFIRMED';
  const subtotal = (order.items ?? []).reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* ── Top Nav Bar ── */}
      <div className="flex items-center gap-3 mb-5 md:mb-6">
        <Link href={backHref}>
          <button className="h-9 w-9 rounded-xl flex items-center justify-center border border-border/50 bg-card hover:bg-muted transition-colors shrink-0">
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-[18px] font-bold text-foreground truncate leading-tight">
            {order.customerName}
          </h1>
          <p className="font-mono text-[11px] text-muted-foreground/60 mt-0.5" dir="ltr">
            #{order.id.slice(-8).toUpperCase()}
          </p>
        </div>
        {status && (
          <Badge
            variant="outline"
            className={cn(
              'text-[11px] font-bold uppercase tracking-wider gap-1.5 px-3 py-1 shrink-0',
              status.color,
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', status.dot)} />
            {status.label}
          </Badge>
        )}
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="Refresh"
          className="h-9 w-9 rounded-xl flex items-center justify-center border border-border/50 bg-card hover:bg-muted transition-colors shrink-0"
        >
          <RefreshCw className={cn('h-3.5 w-3.5 text-muted-foreground', isFetching && 'animate-spin')} />
        </button>
      </div>

      {/* ── Main content: 1 col mobile, 2 col desktop ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 pb-24 md:pb-8">

        {/* ── Left column: customer + summary ── */}
        <div className="md:col-span-1 space-y-4">

          {/* Summary card */}
          <div className="bg-card border border-border/40 rounded-2xl p-4">
            <SectionHeading>Order Summary</SectionHeading>
            <div className="space-y-2 mt-3">
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold tabular-nums" dir="ltr">{centsToMad(subtotal)} MAD</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Delivery fee</span>
                <span className="font-semibold tabular-nums" dir="ltr">{centsToMad(order.deliveryFee)} MAD</span>
              </div>
              <div className="border-t border-border/40 pt-2 mt-1 flex justify-between">
                <span className="text-[14px] font-bold text-foreground">Total</span>
                <span className="text-[16px] font-extrabold text-foreground tabular-nums" dir="ltr">
                  {centsToMad(order.total)} MAD
                </span>
              </div>
            </div>
          </div>

          {/* Customer info card */}
          <div className="bg-card border border-border/40 rounded-2xl p-4">
            <SectionHeading>Customer</SectionHeading>
            <InfoRow icon={Phone}        label="Phone"          value={order.phone} mono />
            <InfoRow icon={MapPin}        label="City"           value={order.city} />
            <InfoRow icon={MapPin}        label="Address"        value={order.address} />
            <InfoRow icon={MessageSquare} label="Notes"          value={order.notes} />
            <InfoRow icon={CreditCard}    label="Method"         value={order.deliveryMethod === 'PICKUP' ? 'Store pickup' : 'Home delivery'} />
            <InfoRow icon={Clock}         label="Ordered"        value={new Date(order.createdAt).toLocaleString()} />
          </div>
        </div>

        {/* ── Right column: items + actions ── */}
        <div className="md:col-span-2 space-y-4">

          {/* Items card */}
          <div className="bg-card border border-border/40 rounded-2xl p-4">
            <SectionHeading>Items ({order.items?.length ?? 0})</SectionHeading>
            {order.items && order.items.length > 0 ? (
              order.items.map((item) => <ItemCard key={item.id} item={item} />)
            ) : (
              <p className="text-[13px] text-muted-foreground py-4 text-center">No items in this order.</p>
            )}
          </div>

          {/* Action card */}
          {canAct && (
            <div className="bg-card border border-border/40 rounded-2xl p-4 space-y-2.5">
              <SectionHeading>Update Status</SectionHeading>

              {updateStatus.isPending && (
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating…
                </div>
              )}

              {order.status === 'PENDING' && (
                <Button
                  className="w-full h-11 gap-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                  onClick={() => updateStatus.mutate({ id: order.id, status: 'CONFIRMED' })}
                  disabled={updateStatus.isPending}
                >
                  <CheckCircle className="h-4 w-4" />
                  Confirm Order
                </Button>
              )}

              {order.status === 'CONFIRMED' && (
                <Button
                  variant="outline"
                  className="w-full h-11 gap-2 font-semibold rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={() => updateStatus.mutate({ id: order.id, status: 'DELIVERED' })}
                  disabled={updateStatus.isPending}
                >
                  <Truck className="h-4 w-4" />
                  Mark as Delivered
                </Button>
              )}

              <Button
                variant="ghost"
                className="w-full h-10 gap-2 text-[13px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                onClick={() => updateStatus.mutate({ id: order.id, status: 'CANCELLED' })}
                disabled={updateStatus.isPending}
              >
                <XCircle className="h-4 w-4" />
                Cancel Order
              </Button>
            </div>
          )}

          {!canAct && (
            <div className="bg-muted/30 border border-border/30 rounded-2xl p-4 text-center text-[13px] text-muted-foreground">
              Order is <strong className="text-foreground">{order.status.toLowerCase()}</strong> — no further actions available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
