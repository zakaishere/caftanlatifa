'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, CheckCircle, Truck, XCircle, Phone, MapPin,
  Clock, Package, CreditCard, MessageSquare, Loader2, ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ApiOrder, ApiOrderItem, OrderStatus } from '@/lib/types';
import { centsToMad } from '@/lib/types';
import { cn } from '@/lib/utils';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<OrderStatus, { label: string; color: string; dot: string }> = {
  PENDING:   { label: 'Pending',   color: 'text-amber-700 bg-amber-50 border-amber-200',         dot: 'bg-amber-400' },
  CONFIRMED: { label: 'Confirmed', color: 'text-blue-700 bg-blue-50 border-blue-200',            dot: 'bg-blue-400' },
  DELIVERED: { label: 'Delivered', color: 'text-emerald-700 bg-emerald-50 border-emerald-200',   dot: 'bg-emerald-400' },
  CANCELLED: { label: 'Cancelled', color: 'text-rose-700 bg-rose-50 border-rose-200',            dot: 'bg-rose-400' },
};

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-2">
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
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground/50 mb-0.5">{label}</p>
        <p className={cn('text-[13px] text-foreground leading-snug', mono && 'font-mono')} dir={mono ? 'ltr' : undefined}>
          {value}
        </p>
      </div>
    </div>
  );
}

function ItemRow({ item }: { item: ApiOrderItem }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
      <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden border border-border/30 shrink-0 flex items-center justify-center">
        {item.image
          ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
          : <Package className="h-4 w-4 text-muted-foreground/30" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-foreground truncate">{item.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground/60">
          {item.size && <span className="uppercase font-medium">{item.size}</span>}
          {item.size && <span>·</span>}
          <span>×{item.quantity}</span>
        </div>
      </div>
      <span className="text-[13px] font-semibold tabular-nums shrink-0" dir="ltr">
        {centsToMad(item.price * item.quantity)}
        <span className="text-[9px] text-muted-foreground/50 ml-0.5">MAD</span>
      </span>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
export interface OrderDetailSheetProps {
  order: ApiOrder | null;
  open: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  isPending?: boolean;
}

/**
 * OrderDetailSheet — full-screen bottom sheet for mobile order details.
 *
 * Architecture:
 * - Single motion.div, slides up from bottom on mobile
 * - Slides in from right on desktop (md+)
 * - NO window.innerWidth hacks — uses CSS classes only
 * - No nested motion.div animation conflicts
 * - All actions are inside the fixed footer
 */
export function OrderDetailSheet({
  order,
  open,
  onClose,
  onUpdateStatus,
  isPending = false,
}: OrderDetailSheetProps) {
  const status = order ? STATUS_STYLES[order.status] : null;
  const canAct = order && (order.status === 'PENDING' || order.status === 'CONFIRMED');

  return (
    <AnimatePresence>
      {open && order && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Sheet — mobile: slides from bottom. desktop: slides from right via CSS */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 0.9 }}
            className={cn(
              // Base — full-screen bottom sheet on mobile
              'fixed inset-x-0 bottom-0 z-[60] bg-background flex flex-col',
              'h-[92svh] max-h-[92svh] rounded-t-2xl',
              // Desktop — right drawer
              'md:inset-x-auto md:inset-y-0 md:right-0 md:left-auto',
              'md:h-svh md:max-h-svh md:w-[420px] md:rounded-none md:translate-y-0',
              'md:border-l md:border-border/40',
            )}
            style={{ boxShadow: '0 -12px 40px -8px rgb(0 0 0 / 0.15)' }}
          >
            {/* Drag handle (mobile only) */}
            <div className="flex justify-center pt-3 pb-0 shrink-0 md:hidden">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/20" />
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 shrink-0">
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors shrink-0"
              >
                <ArrowLeft className="h-4 w-4 text-foreground" />
              </button>

              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-foreground truncate leading-tight">
                  {order.customerName}
                </p>
                <p className="font-mono text-[10px] text-muted-foreground/50 mt-0.5" dir="ltr">
                  #{order.id.slice(-8).toUpperCase()}
                </p>
              </div>

              {status && (
                <span className={cn(
                  'inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider',
                  'border rounded-full px-2.5 py-1 shrink-0',
                  status.color,
                )}>
                  <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', status.dot)} />
                  {status.label}
                </span>
              )}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="px-4 py-4 space-y-5">

                {/* ── Stats summary ── */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Items', value: String(order.items?.length ?? 0), sub: '' },
                    { label: 'Delivery', value: centsToMad(order.deliveryFee), sub: 'MAD' },
                    { label: 'Total', value: centsToMad(order.total), sub: 'MAD', highlight: true },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-muted/30 rounded-xl px-3 py-2.5 text-center">
                      <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider mb-1">{stat.label}</p>
                      <p className={cn('text-[15px] font-bold tabular-nums', stat.highlight ? 'text-foreground' : 'text-foreground')} dir="ltr">
                        {stat.value}
                        {stat.sub && <span className="text-[10px] font-normal text-muted-foreground/60 ml-0.5">{stat.sub}</span>}
                      </p>
                    </div>
                  ))}
                </div>

                {/* ── Customer info ── */}
                <div>
                  <SectionHeading>Customer</SectionHeading>
                  <div className="bg-muted/20 rounded-xl px-3 divide-y divide-border/30">
                    <InfoRow icon={Phone}        label="Phone"           value={order.phone}  mono />
                    <InfoRow icon={MapPin}        label="City"            value={order.city} />
                    <InfoRow icon={MapPin}        label="Address"         value={order.address} />
                    <InfoRow icon={MessageSquare} label="Notes"           value={order.notes} />
                    <InfoRow
                      icon={CreditCard}
                      label="Method"
                      value={order.deliveryMethod === 'PICKUP' ? 'Store pickup' : 'Home delivery'}
                    />
                    <InfoRow
                      icon={Clock}
                      label="Placed"
                      value={new Date(order.createdAt).toLocaleString()}
                    />
                  </div>
                </div>

                {/* ── Order items ── */}
                {order.items && order.items.length > 0 && (
                  <div>
                    <SectionHeading>Items ({order.items.length})</SectionHeading>
                    <div className="bg-muted/20 rounded-xl px-3">
                      {order.items.map((item) => (
                        <ItemRow key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom breathing room so footer doesn't cover content */}
                <div className="h-2" />
              </div>
            </div>

            {/* ── Sticky action footer ── */}
            <div
              className="shrink-0 px-4 pt-3 border-t border-border/40 bg-background space-y-2"
              style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
            >
              {isPending ? (
                <div className="flex items-center justify-center gap-2 h-11 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating status…
                </div>
              ) : (
                <>
                  {order.status === 'PENDING' && (
                    <Button
                      className="w-full h-11 gap-2 text-[14px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                      onClick={() => onUpdateStatus(order.id, 'CONFIRMED')}
                      disabled={isPending}
                    >
                      <CheckCircle className="h-4.5 w-4.5" />
                      Confirm Order
                    </Button>
                  )}

                  {order.status === 'CONFIRMED' && (
                    <Button
                      variant="outline"
                      className="w-full h-11 gap-2 text-[14px] font-semibold rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => onUpdateStatus(order.id, 'DELIVERED')}
                      disabled={isPending}
                    >
                      <Truck className="h-4.5 w-4.5" />
                      Mark as Delivered
                    </Button>
                  )}

                  {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                    <Button
                      variant="ghost"
                      className="w-full h-10 gap-2 text-[13px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                      onClick={() => onUpdateStatus(order.id, 'CANCELLED')}
                      disabled={isPending}
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel Order
                    </Button>
                  )}

                  {(order.status === 'DELIVERED' || order.status === 'CANCELLED') && (
                    <p className="text-center text-[12px] text-muted-foreground py-2">
                      This order is <strong>{order.status.toLowerCase()}</strong> — no further actions available.
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
