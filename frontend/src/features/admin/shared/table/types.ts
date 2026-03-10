import type { ColumnDef, SortingState, ColumnFiltersState, VisibilityState, RowSelectionState } from '@tanstack/react-table';

export type { ColumnDef, SortingState, ColumnFiltersState, VisibilityState, RowSelectionState };

export interface DataTablePaginationState {
  pageIndex: number;
  pageSize: number;
}

export interface DataTableServerState {
  pagination: DataTablePaginationState;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  globalFilter: string;
}

export interface DataTableServerResult<TData> {
  data: TData[];
  total: number;
  pageCount: number;
}

export interface BulkAction<TData> {
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive';
  onClick: (rows: TData[]) => void | Promise<void>;
}
