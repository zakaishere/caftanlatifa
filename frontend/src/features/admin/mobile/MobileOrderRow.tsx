'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Truck, MapPin, ChevronRight } from 'lucide-react';
import type { ApiOrder, OrderStatus } from '@/lib/types';
import { centsToMad } from '@/lib/types';
import { cn } from '@/lib/utils';
import { i18n } from '@/i18n/config';

// ── Status styles ─────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<OrderStatus, { pill: string; dot: string; label: string }> = {
  PENDING:   { pill: 'text-amber-700 bg-amber-50 border-amber-200',       dot: 'bg-amber-400',   label: 'Pending'   },
  CONFIRMED: { pill: 'text-blue-700 bg-blue-50 border-blue-200',          dot: 'bg-blue-400',    label: 'Confirmed' },
  DELIVERED: { pill: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-400', label: 'Delivered' },
  CANCELLED: { pill: 'text-rose-700 bg-rose-50 border-rose-200',          dot: 'bg-rose-400',    label: 'Cancelled' },
};

// ── Time-ago helper ───────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

// ── Props ─────────────────────────────────────────────────────────────────────
export interface MobileOrderRowProps {
  order: ApiOrder;
  /** @deprecated use Link navigation — this prop is kept for backward compat but ignored */
  onTap?: (order: ApiOrder) => void;
  isPending?: boolean;
}

/**
 * MobileOrderRow
 *
 * Navigation: uses Next.js <Link> for instant client-side route push.  
 * No swipe, no drawer, no onClick state. Tapping gives the full detail page.
 */
export function MobileOrderRow({ order, isPending = false }: MobileOrderRowProps) {
  const pathname = usePathname();
  const locale = i18n.locales.find(
    (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
  ) ?? i18n.defaultLocale;

  const href = `/${locale}/admin/orders/${order.id}`;
  const style = STATUS_STYLES[order.status];
  const itemCount = order.items?.length ?? 0;

  return (
    <Link
      href={href}
      prefetch={false}
      className={cn(
        // w-full + box-border = never wider than parent
        'w-full flex items-center gap-3 px-4 py-3 box-border',
        'bg-card border-b border-border/40',
        'active:bg-muted/40 transition-colors duration-100',
        'no-underline',
        isPending && 'opacity-50 pointer-events-none',
      )}
    >
      {/* Left: Status color strip */}
      <div className={cn('w-1 self-stretch rounded-full shrink-0', style.dot)} />

      {/* Center: Main content — min-w-0 REQUIRED to prevent flex overflow */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {/* Row 1: Name + Time */}
        <div className="flex items-baseline justify-between gap-2 w-full min-w-0">
          <span className="text-[13.5px] font-semibold text-foreground truncate leading-snug min-w-0 flex-1">
            {order.customerName}
          </span>
          <span className="text-[10px] text-muted-foreground/60 shrink-0 tabular-nums whitespace-nowrap">
            {timeAgo(order.createdAt)}
          </span>
        </div>

        {/* Row 2: ID + Delivery + Items */}
        <div className="flex items-center gap-1.5 mt-0.5 min-w-0 overflow-hidden">
          <span className="font-mono text-[10px] text-muted-foreground/60 tracking-wide shrink-0">
            #{order.id.slice(-6).toUpperCase()}
          </span>
          <span className="text-muted-foreground/30 shrink-0">·</span>
          <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5 shrink-0">
            {order.deliveryMethod === 'PICKUP'
              ? <MapPin className="h-2.5 w-2.5 shrink-0" />
              : <Truck className="h-2.5 w-2.5 shrink-0" />}
            {order.deliveryMethod === 'PICKUP' ? 'Pickup' : 'Delivery'}
          </span>
          <span className="text-muted-foreground/30 shrink-0">·</span>
          <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5 shrink-0">
            <Package className="h-2.5 w-2.5 shrink-0" />
            {itemCount}
          </span>
        </div>

        {/* Row 3: Status pill + Total */}
        <div className="flex items-center justify-between mt-1.5 gap-2 min-w-0">
          <span className={cn(
            'inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider shrink-0',
            'border rounded-full px-1.5 py-0.5',
            style.pill,
          )}>
            {style.label}
          </span>
          <span className="text-[13px] font-bold text-foreground tabular-nums shrink-0" dir="ltr">
            {centsToMad(order.total)}<span className="text-[9px] font-medium text-muted-foreground ml-0.5">MAD</span>
          </span>
        </div>
      </div>

      {/* Right: Chevron */}
      <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0" />
    </Link>
  );
}
