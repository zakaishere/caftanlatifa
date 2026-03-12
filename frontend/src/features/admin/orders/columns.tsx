'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Eye, Truck, Package, MapPin, CheckCircle, XCircle } from 'lucide-react';
import type { ApiOrder, OrderStatus } from '@/lib/types';
import { centsToMad } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/provider';

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
};

// We wrap the columns in a hook so we can use translation (t)
export function useOrderColumns(
  onViewOrder: (order: ApiOrder) => void,
  onUpdateStatus: (id: string, status: OrderStatus) => void
): ColumnDef<ApiOrder>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'id',
      header: 'Order ID',
      cell: ({ row }) => <span className="font-mono text-xs font-semibold">#{row.original.id.slice(-6).toUpperCase()}</span>,
    },
    {
      accessorKey: 'customerName',
      header: 'Customer',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground text-sm">{row.original.customerName}</span>
          <span className="text-xs text-muted-foreground" dir="ltr">{row.original.phone || 'No phone'}</span>
        </div>
      ),
      // Custom filter function for customer / phone / id global search
      filterFn: (row, id, value) => {
        const query = (value as string).toLowerCase();
        const orderId = row.original.id.toLowerCase();
        const customer = row.original.customerName?.toLowerCase() || '';
        const phone = row.original.phone?.toLowerCase() || '';
        return customer.includes(query) || phone.includes(query) || orderId.includes(query);
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{format(new Date(row.original.createdAt), 'MMM d, yyyy')}</span>
          <span className="text-[11px] text-muted-foreground">{format(new Date(row.original.createdAt), 'HH:mm')}</span>
        </div>
      ),
    },
    {
      id: 'items',
      header: 'Items',
      cell: ({ row }) => {
        const count = row.original.items?.length || 0;
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
            <Package className="h-3.5 w-3.5 text-muted-foreground" />
            {count} {count === 1 ? 'item' : 'items'}
          </span>
        );
      },
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => (
        <div className="flex flex-col items-start font-medium tabular-nums text-sm text-foreground" dir="ltr">
          {centsToMad(row.original.total)} MAD
        </div>
      ),
    },
    {
      accessorKey: 'deliveryMethod',
      header: 'Delivery',
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          {row.original.deliveryMethod === 'PICKUP' ? (
            <MapPin className="h-3.5 w-3.5" />
          ) : (
            <Truck className="h-3.5 w-3.5" />
          )}
          {row.original.deliveryMethod === 'PICKUP' ? 'Pickup' : 'Delivery'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant="outline" className={cn('gap-1.5 px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold', STATUS_COLORS[status])}>
            {status}
          </Badge>
        );
      },
      // Status filter compares against the selected value
      filterFn: (row, id, value) => {
        if (value === 'ALL') return true;
        return row.getValue(id) === value;
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <Button
              variant="secondary"
              size="sm"
              className="h-8 shadow-sm font-semibold"
              onClick={() => onViewOrder(order)}
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" /> View
            </Button>
          </div>
        );
      },
    },
  ];
}
