'use client';

import React from 'react';
import { Package, MoreHorizontal, Edit, Loader2, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ApiProduct } from '@/lib/types';
import { centsToMad } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface MobileProductCardProps {
  product: ApiProduct;
  onEdit: (product: ApiProduct) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  isToggling?: boolean;
}

export function MobileProductCard({
  product,
  onEdit,
  onToggleStatus,
  isToggling = false,
}: MobileProductCardProps) {
  const { name, category, price, inStock, images } = product;
  const image = images?.[0];

  return (
    <div className="flex items-center gap-3 p-3 bg-card border-b border-border/40 hover:bg-muted/30 transition-colors">
      {/* ── Thumbnail ── */}
      <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex items-center justify-center border border-border/50 shrink-0">
        {image ? (
          <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
        )}
      </div>

      {/* ── Info (Middle) ── */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p className="text-[14px] font-semibold text-foreground truncate leading-tight">
          {name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {category ? (
            <span className="text-[11px] font-medium text-muted-foreground/80 truncate">
              {category.name}
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground/40">—</span>
          )}
        </div>
      </div>

      {/* ── Price & Status (Right) ── */}
      <div className="flex flex-col items-end justify-center shrink-0 pr-1 gap-1">
        <span className="text-[14px] font-bold text-foreground tabular-nums leading-none" dir="ltr">
          {centsToMad(price)}
          <span className="text-[9px] text-muted-foreground/70 font-bold ml-0.5 uppercase tracking-wider">MAD</span>
        </span>
        
        <button
          onClick={() => onToggleStatus(product.id, inStock)}
          disabled={isToggling}
          className="mt-0.5 flex items-center shrink-0"
        >
          {isToggling ? (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground mr-1" />
          ) : null}
          <Badge
            variant={inStock ? 'outline' : 'destructive'}
            className={cn(
              "text-[9px] px-1.5 py-0 uppercase tracking-widest font-bold h-4 flex items-center leading-none",
              inStock 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
            )}
          >
            {inStock ? 'In Stock' : 'Out'}
          </Badge>
        </button>
      </div>

      {/* ── Context Menu ── */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted shrink-0 ml-1">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 z-[100]">
          <DropdownMenuItem onClick={() => onEdit(product)} className="gap-2.5 py-2.5">
            <Edit className="h-4 w-4" />
            <span className="text-[13px] font-medium">Edit product</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
