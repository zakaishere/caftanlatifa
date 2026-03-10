'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { CheckCircle, Flag, ChevronRight, MapPin, Phone, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ApiOrder, OrderStatus } from '@/lib/types';
import { centsToMad } from '@/lib/types';
import { cn } from '@/lib/utils';

// ── Constants ─────────────────────────────────────────────────────────────────
const SWIPE_THRESHOLD = 72;     // px before action triggers
const SWIPE_MAX = 100;          // max drag extent
const RESISTANCE = 0.45;        // drag friction multiplier

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<OrderStatus, {
  label: string;
  color: string;
  dot: string;
}> = {
  PENDING:   { label: 'Pending',   color: 'text-amber-700 bg-amber-50 border-amber-200',   dot: 'bg-amber-400' },
  CONFIRMED: { label: 'Confirmed', color: 'text-blue-700 bg-blue-50 border-blue-200',      dot: 'bg-blue-400' },
  DELIVERED: { label: 'Delivered', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-400' },
  CANCELLED: { label: 'Cancelled', color: 'text-rose-700 bg-rose-50 border-rose-200',      dot: 'bg-rose-400' },
};

// ── Time-ago helper ───────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ── Swipe action hint layer ───────────────────────────────────────────────────
function SwipeHintLayer({
  direction,
  progress,
}: {
  direction: 'left' | 'right' | null;
  progress: number; // 0-1
}) {
  return (
    <>
      {/* Right → Confirm */}
      <div
        className={cn(
          'absolute inset-y-0 left-0 flex items-center px-5 gap-2 rounded-l-xl overflow-hidden',
          'bg-emerald-500 transition-none',
        )}
        style={{ width: `${Math.min(SWIPE_MAX * 1.2, 120)}px`, opacity: direction === 'right' ? Math.min(progress * 1.5, 1) : 0 }}
        aria-hidden
      >
        <CheckCircle className="h-5 w-5 text-white shrink-0" strokeWidth={2.5} />
        <span className="text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
          Confirm
        </span>
      </div>

      {/* Left → Flag */}
      <div
        className={cn(
          'absolute inset-y-0 right-0 flex items-center justify-end px-5 gap-2 rounded-r-xl overflow-hidden',
          'bg-rose-500 transition-none',
        )}
        style={{ width: `${Math.min(SWIPE_MAX * 1.2, 120)}px`, opacity: direction === 'left' ? Math.min(progress * 1.5, 1) : 0 }}
        aria-hidden
      >
        <span className="text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
          Flag
        </span>
        <Flag className="h-5 w-5 text-white shrink-0" strokeWidth={2.5} />
      </div>
    </>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
export interface MobileOrderCardProps {
  order: ApiOrder;
  onTap: (order: ApiOrder) => void;
  onConfirm: (order: ApiOrder) => void;
  onFlag: (order: ApiOrder) => void;
  isPending?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function MobileOrderCard({
  order,
  onTap,
  onConfirm,
  onFlag,
  isPending = false,
}: MobileOrderCardProps) {
  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [triggered, setTriggered] = useState(false);
  const hasTriggeredRef = useRef(false);

  const status = STATUS_CONFIG[order.status];
  const itemCount = order.items?.length ?? 0;
  const canAct = order.status === 'PENDING' || order.status === 'CONFIRMED';

  // Derived card scale / shadow on drag
  const cardScale = useTransform(x, [-SWIPE_MAX, 0, SWIPE_MAX], [0.97, 1, 0.97]);
  const cardOpacity = useTransform(x, [-SWIPE_MAX * 2, -SWIPE_MAX, 0, SWIPE_MAX, SWIPE_MAX * 2], [0.6, 1, 1, 1, 0.6]);

  function snapBack() {
    animate(x, 0, { type: 'spring', stiffness: 500, damping: 35 });
    setSwipeDir(null);
    setSwipeProgress(0);
    hasTriggeredRef.current = false;
    setTimeout(() => setTriggered(false), 300);
  }

  return (
    <div className="relative overflow-hidden rounded-xl select-none touch-pan-y">
      {/* Background action layers */}
      {canAct && (
        <SwipeHintLayer direction={swipeDir} progress={swipeProgress} />
      )}

      {/* Draggable card */}
      <motion.div
        style={{ x, scale: cardScale, opacity: cardOpacity }}
        drag={canAct ? 'x' : false}
        dragConstraints={{ left: -SWIPE_MAX, right: SWIPE_MAX }}
        dragElastic={RESISTANCE}
        onDragStart={() => {
          setIsDragging(true);
          hasTriggeredRef.current = false;
        }}
        onDrag={(_, info) => {
          const raw = info.offset.x;
          const dir = raw > 0 ? 'right' : 'left';
          const progress = Math.abs(raw) / SWIPE_THRESHOLD;
          setSwipeDir(dir);
          setSwipeProgress(progress);

          // Haptic-like: trigger early visual feedback at threshold
          if (Math.abs(raw) >= SWIPE_THRESHOLD && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            setTriggered(true);
          }
        }}
        onDragEnd={(_, info) => {
          setIsDragging(false);
          const offset = info.offset.x;

          if (offset > SWIPE_THRESHOLD) {
            // Confirm: only for PENDING orders
            if (order.status === 'PENDING') {
              onConfirm(order);
            }
          } else if (offset < -SWIPE_THRESHOLD) {
            onFlag(order);
          }
          snapBack();
        }}
        whileTap={!isDragging ? { scale: 0.985 } : {}}
        className="relative"
      >
        <div
          onClick={() => !isDragging && onTap(order)}
          className={cn(
            'relative bg-card border border-border/50 rounded-xl overflow-hidden',
            'transition-shadow duration-200',
            triggered && 'ring-1 ring-primary/20',
            isPending && 'opacity-60 pointer-events-none',
          )}
          style={{ boxShadow: '0 1px 4px 0 rgb(0 0 0 / 0.06), 0 0 0 1px rgb(0 0 0 / 0.03)' }}
        >
          {/* ── Top row: ID + Status + Time ── */}
          <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-border/40">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-muted-foreground/70 tracking-wider" dir="ltr">
                #{order.id.slice(-6).toUpperCase()}
              </span>
              <span className="h-3.5 w-px bg-border/60" />
              <span className="text-[11px] text-muted-foreground/60 font-medium">
                {timeAgo(order.createdAt)}
              </span>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 gap-1.5 border',
                status.color,
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
              {status.label}
            </Badge>
          </div>

          {/* ── Main body ── */}
          <div className="px-4 py-3 flex items-start justify-between gap-3">
            {/* Left: Customer info */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <p className="text-[15px] font-semibold text-foreground truncate leading-tight">
                {order.customerName}
              </p>

              <div className="flex items-center gap-3">
                {order.city && (
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
                    <MapPin className="h-2.5 w-2.5 shrink-0" />
                    {order.city}
                  </span>
                )}
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60" dir="ltr">
                  <Phone className="h-2.5 w-2.5 shrink-0" />
                  {order.phone}
                </span>
              </div>

              <div className="flex items-center gap-1.5 pt-0.5">
                <Package className="h-2.5 w-2.5 text-muted-foreground/50 shrink-0" />
                <span className="text-[11px] text-muted-foreground/60">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  {order.deliveryMethod === 'PICKUP' && (
                    <span className="ml-1.5 text-primary/70 font-medium">· Pickup</span>
                  )}
                </span>
              </div>
            </div>

            {/* Right: Price + chevron */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className="text-[22px] font-bold text-foreground tabular-nums leading-none" dir="ltr">
                {centsToMad(order.total)}
                <span className="text-[11px] text-muted-foreground/60 font-normal ml-0.5">MAD</span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground/30 mt-0.5" />
            </div>
          </div>

          {/* ── Swipe hint strip (only for actionable orders) ── */}
          {canAct && (
            <div className="px-4 pb-3 flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground/40 font-medium tracking-wider uppercase">
                ← flag · confirm →
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
