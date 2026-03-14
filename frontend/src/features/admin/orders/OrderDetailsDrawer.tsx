import React, { useEffect, useState } from 'react';
import {
  X, CheckCircle, Truck, XCircle, Phone, MapPin,
  Clock, Package, CreditCard, MessageSquare, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { ApiOrder, ApiOrderItem, OrderStatus } from '@/lib/types';
import { centsToMad } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; dot: string }> = {
  PENDING:   { label: 'Pending',   color: 'text-amber-700 bg-amber-50 border-amber-200',         dot: 'bg-amber-400' },
  CONFIRMED: { label: 'Confirmed', color: 'text-blue-700 bg-blue-50 border-blue-200',            dot: 'bg-blue-400' },
  DELIVERED: { label: 'Delivered', color: 'text-emerald-700 bg-emerald-50 border-emerald-200',   dot: 'bg-emerald-400' },
  CANCELLED: { label: 'Cancelled', color: 'text-rose-700 bg-rose-50 border-rose-200',            dot: 'bg-rose-400' },
};

// ── Item row ──────────────────────────────────────────────────────────────────
function OrderItemRow({ item }: { item: ApiOrderItem }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/40 last:border-0">
      <div className="h-11 w-11 rounded-lg bg-muted overflow-hidden border border-border/30 shrink-0 flex items-center justify-center">
        {item.image ? (
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <Package className="h-4 w-4 text-muted-foreground/40" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-foreground truncate">{item.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {item.size && (
            <span className="text-[11px] text-muted-foreground/70 uppercase font-medium tracking-wide">
              {item.size}
            </span>
          )}
          <span className="text-[11px] text-muted-foreground/50">×{item.quantity}</span>
        </div>
      </div>
      <span className="text-[13px] font-semibold tabular-nums shrink-0" dir="ltr">
        {centsToMad(item.price * item.quantity)}
        <span className="text-[10px] text-muted-foreground/60 font-normal ml-0.5">MAD</span>
      </span>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-2 mt-6">
      {children}
    </p>
  );
}

// ── Info row ──────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, mono = false }: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <span className="text-[11px] text-muted-foreground/60">{label}</span>
        <p className={cn('text-[13px] text-foreground mt-0.5', mono && 'font-mono')} dir={mono ? 'ltr' : undefined}>
          {value}
        </p>
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
export interface OrderDetailsDrawerProps {
  order: ApiOrder | null;
  open: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  isPending?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function OrderDetailsDrawer({
  order,
  open,
  onClose,
  onUpdateStatus,
  isPending = false,
}: OrderDetailsDrawerProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  // We need to delay mounting until we know if it's desktop to avoid layout shifts or hydration errors,
  // but useMediaQuery is generally safe if matching the initial render. 
  // However, Radix UI Dialog automatically rendering into a portal ensures the container rules don't trap it.
  
  if (!order) return null;
  
  const status = STATUS_CONFIG[order.status];

  // The Sheet component wraps Radix Dialog which securely handles Portals and z-index blocking
  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side={isDesktop ? 'right' : 'bottom'}
        className={cn(
          "flex flex-col p-0 gap-0 border-border/40 bg-card",
          isDesktop 
            ? "w-[450px] sm:max-w-none" 
            : "rounded-t-2xl max-h-[85vh] sm:max-w-none border-t"
        )}
      >
        {/* Header container */}
        <SheetHeader className="px-5 py-3 border-b border-border/40 shrink-0 text-left items-start flex flex-row justify-between w-full space-y-0 relative !m-0">
          <div className="flex items-center gap-2.5">
            <div>
              <SheetTitle className="text-[15px] font-semibold text-foreground leading-tight text-left">
                {order.customerName}
              </SheetTitle>
              <p className="font-mono text-[11px] text-muted-foreground/60 mt-0.5" dir="ltr">
                #{order.id.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pr-6"> {/* Room for absolute close button */}
            {status && (
              <Badge
                variant="outline"
                className={cn('text-[10px] font-semibold tracking-wider border gap-1.5 px-2 py-0.5', status.color)}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                {status.label}
              </Badge>
            )}
          </div>
        </SheetHeader>

        {/* Scrollable content container */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-5 py-4 space-y-5">

            {/* ── Order summary pill ── */}
            <div className="flex items-center justify-between bg-muted/40 rounded-xl px-4 py-3">
              <div className="text-center">
                <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">Items</p>
                <p className="text-[18px] font-bold text-foreground mt-0.5">{order.items?.length ?? 0}</p>
              </div>
              <div className="h-8 w-px bg-border/40" />
              <div className="text-center">
                <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">Delivery</p>
                <p className="text-[18px] font-bold text-foreground mt-0.5" dir="ltr">
                  {centsToMad(order.deliveryFee)}
                  <span className="text-[11px] text-muted-foreground/50 font-normal ml-0.5">MAD</span>
                </p>
              </div>
              <div className="h-8 w-px bg-border/40" />
              <div className="text-center">
                <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">Total</p>
                <p className="text-[18px] font-bold text-primary mt-0.5" dir="ltr">
                  {centsToMad(order.total)}
                  <span className="text-[11px] font-normal ml-0.5">MAD</span>
                </p>
              </div>
            </div>

            {/* ── Customer details ── */}
            <div>
              <SectionLabel>Customer</SectionLabel>
              <div className="bg-muted/20 rounded-xl px-4 divide-y divide-border/30">
                <InfoRow icon={Phone} label="Phone" value={order.phone} mono />
                <InfoRow icon={MapPin} label="City" value={order.city} />
                <InfoRow icon={MapPin} label="Address" value={order.address} />
                {order.notes && <InfoRow icon={MessageSquare} label="Notes" value={order.notes} />}
                <InfoRow
                  icon={CreditCard}
                  label="Delivery method"
                  value={order.deliveryMethod === 'PICKUP' ? 'Store pickup' : 'Home delivery'}
                />
                <InfoRow
                  icon={Clock}
                  label="Ordered"
                  value={new Date(order.createdAt).toLocaleString()}
                />
              </div>
            </div>

            {/* ── Items ── */}
            {order.items && order.items.length > 0 && (
              <div>
                <SectionLabel>Order items</SectionLabel>
                <div className="bg-muted/20 rounded-xl px-4">
                  {order.items.map((item) => (
                    <OrderItemRow key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Bottom breathing room */}
            <div className="h-4" />
          </div>
        </div>

        {/* ── Sticky action footer ── */}
        {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
          <div
            className="shrink-0 px-5 py-4 border-t border-border/40 space-y-2.5 bg-card mt-auto"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            {isPending && (
              <div className="flex items-center justify-center gap-2 py-1 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating…
              </div>
            )}

            {order.status === 'PENDING' && (
              <Button
                size="lg"
                className="w-full gap-2 h-12 text-[15px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                onClick={() => onUpdateStatus(order.id, 'CONFIRMED')}
                disabled={isPending}
              >
                <CheckCircle className="h-5 w-5" />
                Confirm Order
              </Button>
            )}

            {order.status === 'CONFIRMED' && (
              <Button
                size="lg"
                variant="outline"
                className="w-full gap-2 h-12 text-[15px] font-semibold rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() => onUpdateStatus(order.id, 'DELIVERED')}
                disabled={isPending}
              >
                <Truck className="h-5 w-5" />
                Mark Delivered
              </Button>
            )}

            <Button
              size="lg"
              variant="ghost"
              className="w-full gap-2 h-11 text-[14px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
              onClick={() => onUpdateStatus(order.id, 'CANCELLED')}
              disabled={isPending}
            >
              <XCircle className="h-4 w-4" />
              Cancel Order
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
