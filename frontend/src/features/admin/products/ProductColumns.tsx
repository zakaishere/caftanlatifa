"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, MoreHorizontal, Loader2, Image as ImageIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ApiProduct } from "@/lib/types";
import { centsToMad } from "@/lib/types";
import { UseMutationResult } from "@tanstack/react-query";

interface ProductActionProps {
  product: ApiProduct;
  onEdit: (product: ApiProduct) => void;
  deleteMutation: UseMutationResult<void, Error, string, unknown>;
  toggleStockMutation: UseMutationResult<void, Error, { id: string; inStock: boolean }, unknown>;
}

export const getColumns = ({
  onEdit,
  deleteMutation,
  toggleStockMutation,
}: Omit<ProductActionProps, "product">): ColumnDef<ApiProduct>[] => [
  {
    accessorKey: "images",
    header: "Image",
    cell: ({ row }) => {
      const images = row.getValue("images") as string[];
      return (
        <div className="h-10 w-10 rounded-md bg-neutral-100 overflow-hidden flex items-center justify-center border border-neutral-200/50">
          {images && images.length > 0 ? (
            <img src={images[0]} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-4 w-4 text-neutral-400" />
          )}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <span className="font-mono text-[11px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
        {(row.getValue("id") as string).slice(0, 8)}
      </span>
    ),
  },
  {
    accessorKey: "name",
    header: "Product Name",
    cell: ({ row }) => <span className="font-medium text-neutral-900">{row.getValue("name")}</span>,
  },
  {
    accessorKey: "category.name",
    header: "Category",
    cell: ({ row }) => <span className="text-neutral-600">{row.original.category?.name || '—'}</span>,
  },
  {
    accessorKey: "price",
    header: () => <div className="text-right">Price</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("price"));
      return <div className="text-right font-medium text-neutral-700">{centsToMad(amount)} MAD</div>;
    },
  },
  {
    accessorKey: "inStock",
    header: "Availability",
    cell: ({ row }) => {
      const product = row.original;
      const isPending = toggleStockMutation.isPending && toggleStockMutation.variables?.id === product.id;

      return (
        <button
          onClick={() => toggleStockMutation.mutate({ id: product.id, inStock: product.inStock })}
          className="hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-neutral-200 rounded-full"
          disabled={toggleStockMutation.isPending}
        >
          <Badge
            variant={product.inStock ? "outline" : "destructive"}
            className={`cursor-pointer px-2.5 py-0.5 text-[11px] uppercase tracking-wider font-semibold 
              ${product.inStock 
                ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" 
                : "bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200"
              }`
            }
          >
            {isPending && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
            {product.inStock ? 'In Stock' : 'Out of Stock'}
          </Badge>
        </button>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-neutral-100">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4 text-neutral-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuLabel className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">
                Actions
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(product)} className="text-neutral-700 cursor-pointer">
                <Edit className="mr-2 h-4 w-4 text-neutral-500" /> Edit Product
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"
                onClick={() => deleteMutation.mutate(product.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
