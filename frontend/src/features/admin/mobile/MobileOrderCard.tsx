'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { CheckCircle, Flag, MapPin, Package, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ApiOrder, OrderStatus } from '@/lib/types';
import { centsToMad } from '@/lib/types';
import { cn } from '@/lib/utils';

// ── Constants ─────────────────────────────────────────────────────────────────
const SWIPE_THRESHOLD = 50;     // px before action triggers
const SWIPE_MAX = 80;           // max drag extent
const RESISTANCE = 0.2;         // heavily damped drag friction multiplier

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
    animate(x, 0, { type: 'spring', stiffness: 600, damping: 40 });
    setSwipeDir(null);
    setSwipeProgress(0);
    hasTriggeredRef.current = false;
    setTimeout(() => setTriggered(false), 300);
  }

  return (
    <div className="w-full relative overflow-hidden rounded-xl mb-3 border border-border/40 bg-muted/30">
      {/* ── Background Action Layer (Hidden behind card) ── */}
      {canAct && (
        <div className="absolute inset-0 flex items-center justify-between">
          {/* Left Action (Confirm - revealed when dragging right) */}
          <div className="h-full bg-emerald-500 w-1/2 flex items-center pl-5 opacity-0 transition-opacity duration-200" style={{ opacity: swipeDir === 'right' ? 1 : 0 }}>
            <CheckCircle className="h-5 w-5 text-white" strokeWidth={2.5} />
            <span className="ml-2 text-xs font-bold text-white uppercase tracking-wider">Confirm</span>
          </div>
          {/* Right Action (Flag - revealed when dragging left) */}
          <div className="h-full bg-rose-500 w-1/2 flex items-center justify-end pr-5 opacity-0 transition-opacity duration-200" style={{ opacity: swipeDir === 'left' ? 1 : 0 }}>
            <span className="mr-2 text-xs font-bold text-white uppercase tracking-wider">Flag</span>
            <Flag className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
        </div>
      )}

      {/* ── Foreground Draggable Card ── */}
      <motion.div
        style={{ x, boxShadow: '0 1px 4px 0 rgb(0 0 0 / 0.05), -1px 0 0 0 rgb(0 0 0 / 0.02), 1px 0 0 0 rgb(0 0 0 / 0.02)' }}
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

          if (Math.abs(raw) >= SWIPE_THRESHOLD && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            setTriggered(true);
          }
        }}
        onDragEnd={(_, info) => {
          setIsDragging(false);
          const offset = info.offset.x;

          if (offset > SWIPE_THRESHOLD && order.status === 'PENDING') {
            onConfirm(order);
          } else if (offset < -SWIPE_THRESHOLD) {
            onFlag(order);
          }
          snapBack();
        }}
        whileTap={!isDragging ? { scale: 0.99 } : {}}
        className={cn(
          'relative z-10 w-full bg-card rounded-xl flex flex-col',
          'transition-shadow duration-200 will-change-transform',
          triggered && 'ring-1 ring-primary/20 bg-card/95 backdrop-blur-sm',
          isPending && 'opacity-60 pointer-events-none'
        )}
      >
        <div onClick={() => !isDragging && onTap(order)} className="flex flex-col w-full p-3 gap-2.5">
          
          {/* ROW 1: Customer Name + Status */}
          <div className="flex items-start justify-between gap-3 w-full">
            <div className="flex-1 min-w-0">
              <span className="text-[14px] font-bold text-foreground leading-tight truncate block">
                {order.customerName}
              </span>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 gap-1.5 border shrink-0',
                status.color
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
              {status.label}
            </Badge>
          </div>

          {/* ROW 2: Order ID + Date */}
          <div className="flex items-center gap-2.5 w-full">
            <span className="font-mono text-[11px] text-muted-foreground/80 tracking-wider">
              #{order.id.slice(-6).toUpperCase()}
            </span>
            <span className="h-3 w-px bg-border/60 shrink-0" />
            <span className="text-[11px] text-muted-foreground/60 truncate flex-1 min-w-0">
              {timeAgo(order.createdAt)}
            </span>
          </div>

          {/* ROW 3: Stats + Total */}
          <div className="flex justify-between items-center w-full bg-muted/20 border border-border/30 rounded-lg p-2.5 mt-0.5">
            <div className="flex flex-col gap-1.5 min-w-0">
              <span className="text-[11px] font-medium text-foreground flex items-center gap-1.5 truncate">
                <Package className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
              <span className="text-[10px] text-muted-foreground/80 flex items-center gap-1.5 font-medium truncate">
                {order.deliveryMethod === 'PICKUP' ? (
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <Truck className="h-3.5 w-3.5 shrink-0" />
                )}
                {order.deliveryMethod === 'PICKUP' ? 'Pickup' : 'Delivery'}
              </span>
            </div>
            <div className="flex flex-col items-end shrink-0 pl-2">
              <span className="text-[16px] font-extrabold text-foreground tabular-nums leading-none block" dir="ltr">
                {centsToMad(order.total)}
              </span>
              <span className="text-[9px] text-muted-foreground/60 font-bold uppercase mt-1 block tracking-wider">MAD</span>
            </div>
          </div>

          {/* ROW 4: Inline Action Buttons */}
          {canAct && (
            <div className="flex items-center gap-2 pt-1 w-full">
              {order.status === 'PENDING' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onConfirm(order); }}
                  className="flex-1 h-8 rounded-lg border border-emerald-600/20 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center gap-1.5 text-[11px] font-bold tracking-wide transition-colors shrink-0"
                >
                  <CheckCircle className="h-3 w-3" /> CONFIRM
                </button>
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); onFlag(order); }}
                className="flex-1 h-8 rounded-lg border border-rose-600/20 bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center justify-center gap-1.5 text-[11px] font-bold tracking-wide transition-colors shrink-0"
              >
                <Flag className="h-3 w-3" /> FLAG
              </button>
            </div>
          )}
          
        </div>
      </motion.div>
    </div>
  );
}
