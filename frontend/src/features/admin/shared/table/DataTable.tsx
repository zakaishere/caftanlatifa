'use client';

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
  type PaginationState,
  type Table,
} from '@tanstack/react-table';
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  isLoading?: boolean;
  sorting: SortingState;
  onSortingChange: (updater: SortingState | ((prev: SortingState) => SortingState)) => void;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: (updater: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => void;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (updater: VisibilityState | ((prev: VisibilityState) => VisibilityState)) => void;
  rowSelection: RowSelectionState;
  onRowSelectionChange: (updater: RowSelectionState | ((prev: RowSelectionState) => RowSelectionState)) => void;
  pagination: PaginationState;
  onPaginationChange: (updater: PaginationState | ((prev: PaginationState) => PaginationState)) => void;
  pageCount: number;
  getRowId?: (row: TData) => string;
  loadingSlot?: React.ReactNode;
  emptySlot?: React.ReactNode;
  onTableReady?: (table: Table<TData>) => void;
  onRowClick?: (row: TData) => void;
}

function SortIcon({ isSorted }: { isSorted: false | 'asc' | 'desc' }) {
  if (isSorted === 'asc') return <ArrowUp className="h-3 w-3 text-foreground" />;
  if (isSorted === 'desc') return <ArrowDown className="h-3 w-3 text-foreground" />;
  return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />;
}

export function DataTable<TData>({
  columns,
  data,
  isLoading,
  sorting,
  onSortingChange,
  columnFilters = [],
  onColumnFiltersChange,
  columnVisibility = {},
  onColumnVisibilityChange,
  rowSelection,
  onRowSelectionChange,
  pagination,
  onPaginationChange,
  pageCount,
  getRowId,
  loadingSlot,
  emptySlot,
  onTableReady,
  onRowClick,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    getRowId,
    onSortingChange: (updater) => {
      onSortingChange(
        typeof updater === 'function' ? updater(sorting) : updater
      );
    },
    onColumnFiltersChange: (updater) => {
      onColumnFiltersChange?.(
        typeof updater === 'function' ? updater(columnFilters) : updater
      );
    },
    onColumnVisibilityChange: (updater) => {
      onColumnVisibilityChange?.(
        typeof updater === 'function' ? updater(columnVisibility) : updater
      );
    },
    onRowSelectionChange: (updater) => {
      onRowSelectionChange(
        typeof updater === 'function' ? updater(rowSelection) : updater
      );
    },
    onPaginationChange: (updater) => {
      onPaginationChange(
        typeof updater === 'function' ? updater(pagination) : updater
      );
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    enableRowSelection: true,
  });

  // Expose table instance to parent (for toolbar, etc.)
  React.useEffect(() => {
    onTableReady?.(table);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  if (isLoading && loadingSlot) {
    return <>{loadingSlot}</>;
  }

  const rows = table.getRowModel().rows;

  return (
    <UITable>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="border-b border-border/60 hover:bg-transparent">
            {headerGroup.headers.map((header) => {
              const canSort = header.column.getCanSort();
              const isSorted = header.column.getIsSorted();
              return (
                <TableHead
                  key={header.id}
                  className={cn(
                    'h-9 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80',
                    canSort && 'cursor-pointer select-none group',
                  )}
                  style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                >
                  <div className={cn('flex items-center gap-1.5', canSort && 'group')}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {canSort && <SortIcon isSorted={isSorted} />}
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>

      <TableBody>
        {rows.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={columns.length} className="p-0">
              {emptySlot ?? (
                <div className="py-12 text-center text-sm text-muted-foreground">No data</div>
              )}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() ? 'selected' : undefined}
              className={cn(
                'border-b border-border/40 transition-colors h-[52px]',
                'hover:bg-muted/40',
                onRowClick && 'cursor-pointer',
                row.getIsSelected() && 'bg-primary/[0.04] hover:bg-primary/[0.06]',
              )}
              onClick={() => onRowClick?.(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="px-3 py-0">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </UITable>
  );
}
