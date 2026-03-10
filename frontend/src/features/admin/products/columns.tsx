'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import type { ApiProduct } from '@/lib/types';
import { centsToMad } from '@/lib/types';
import { useOptimistic, useTransition } from 'react';
import { apiRequest } from '@/lib/queryClient';

// ─── Status Cell with useOptimistic ──────────────────────────────────────────
function ProductStatusCell({
  product,
  onMutate,
}: {
  product: ApiProduct;
  onMutate: (id: string, patch: Partial<ApiProduct>) => void;
}) {
  const [optimisticInStock, setOptimisticInStock] = useOptimistic(product.inStock);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    startTransition(async () => {
      setOptimisticInStock(!optimisticInStock);
      try {
        await apiRequest('PATCH', `/api/admin/products/${product.id}`, {
          inStock: !product.inStock,
        });
        onMutate(product.id, { inStock: !product.inStock });
      } catch {
        // Reverted automatically by React because transition threw
      }
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity disabled:opacity-50"
    >
      {isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      <Badge
        variant={optimisticInStock ? 'outline' : 'destructive'}
        className={
          optimisticInStock
            ? 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400 cursor-pointer text-[11px] font-medium px-2 py-0.5'
            : 'cursor-pointer text-[11px] font-medium px-2 py-0.5'
        }
      >
        {optimisticInStock ? 'In stock' : 'Out of stock'}
      </Badge>
    </button>
  );
}

// ─── Column Factory ────────────────────────────────────────────────────────────
export function getProductColumns({
  onEdit,
  onDelete,
  onStatusMutate,
  locale,
  currency,
}: {
  onEdit: (product: ApiProduct) => void;
  onDelete: (product: ApiProduct) => void;
  onStatusMutate: (id: string, patch: Partial<ApiProduct>) => void;
  locale?: string;
  currency?: string;
}): ColumnDef<ApiProduct, any>[] {
  return [
    // ── Checkbox ──────────────────────────────────────────────────────────────
    {
      id: 'select',
      size: 40,
      enableSorting: false,
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
              ? 'indeterminate'
              : false
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
          className="translate-y-[1px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
          className="translate-y-[1px]"
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },

    // ── Thumbnail ─────────────────────────────────────────────────────────────
    {
      id: 'image',
      size: 56,
      enableSorting: false,
      header: () => null,
      cell: ({ row }) => {
        const images = row.original.images;
        return (
          <div className="h-10 w-10 rounded-md bg-muted overflow-hidden flex items-center justify-center border border-border/40 shrink-0">
            {images && images.length > 0 ? (
              <img
                src={images[0]}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
            )}
          </div>
        );
      },
    },

    // ── Name + slug ───────────────────────────────────────────────────────────
    {
      id: 'name',
      accessorKey: 'name',
      enableSorting: true,
      header: 'Product',
      cell: ({ row }) => {
        const { name, slug } = row.original;
        return (
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate leading-snug">{name}</p>
            {slug && (
              <p className="text-[11px] text-muted-foreground/70 truncate font-mono leading-tight mt-0.5">
                /{slug}
              </p>
            )}
          </div>
        );
      },
    },

    // ── Category ──────────────────────────────────────────────────────────────
    {
      id: 'category',
      accessorKey: 'category.name',
      enableSorting: true,
      size: 130,
      header: 'Category',
      cell: ({ row }) => {
        const cat = row.original.category?.name;
        return cat ? (
          <Badge variant="secondary" className="text-[11px] font-medium border-0 bg-muted text-muted-foreground">
            {cat}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        );
      },
    },

    // ── Price ─────────────────────────────────────────────────────────────────
    {
      id: 'price',
      accessorKey: 'price',
      enableSorting: true,
      size: 100,
      header: 'Price',
      cell: ({ row }) => (
        <span className="text-sm font-medium tabular-nums" dir="ltr">
          {centsToMad(row.original.price)} {currency ?? 'MAD'}
        </span>
      ),
    },

    // ── Status (optimistic toggle) ────────────────────────────────────────────
    {
      id: 'inStock',
      accessorKey: 'inStock',
      enableSorting: true,
      size: 120,
      header: 'Status',
      cell: ({ row }) => (
        <ProductStatusCell product={row.original} onMutate={onStatusMutate} />
      ),
    },

    // ── Actions ───────────────────────────────────────────────────────────────
    {
      id: 'actions',
      size: 48,
      enableSorting: false,
      header: () => null,
      cell: ({ row }) => {
        const product = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">Open actions</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Actions
              </DropdownMenuLabel>
              <DropdownMenuItem
                className="gap-2 text-sm cursor-pointer"
                onClick={() => onEdit(product)}
              >
                <Edit className="h-3.5 w-3.5" />
                Edit product
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-sm text-destructive cursor-pointer focus:text-destructive"
                onClick={() => onDelete(product)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
