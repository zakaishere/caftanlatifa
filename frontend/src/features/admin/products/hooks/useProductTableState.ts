'use client';

import { useState, useCallback, useMemo } from 'react';
import type { SortingState, ColumnFiltersState, VisibilityState, RowSelectionState } from '@tanstack/react-table';

export interface ProductTableState {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  rowSelection: RowSelectionState;
  pagination: { pageIndex: number; pageSize: number };
  globalFilter: string;
}

export interface ProductTableActions {
  setSorting: (updater: SortingState | ((prev: SortingState) => SortingState)) => void;
  setColumnFilters: (updater: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => void;
  setColumnVisibility: (updater: VisibilityState | ((prev: VisibilityState) => VisibilityState)) => void;
  setRowSelection: (updater: RowSelectionState | ((prev: RowSelectionState) => RowSelectionState)) => void;
  setPagination: (updater: { pageIndex: number; pageSize: number } | ((prev: { pageIndex: number; pageSize: number }) => { pageIndex: number; pageSize: number })) => void;
  setGlobalFilter: (value: string) => void;
  clearSelection: () => void;
  resetFilters: () => void;
}

export function useProductTableState(defaultPageSize = 25): ProductTableState & ProductTableActions {
  const [sorting, setSortingRaw] = useState<SortingState>([]);
  const [columnFilters, setColumnFiltersRaw] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibilityRaw] = useState<VisibilityState>({});
  const [rowSelection, setRowSelectionRaw] = useState<RowSelectionState>({});
  const [pagination, setPaginationRaw] = useState({ pageIndex: 0, pageSize: defaultPageSize });
  const [globalFilter, setGlobalFilterRaw] = useState('');

  // Wrap setters to reset page on sort/filter change
  const setSorting = useCallback((updater: SortingState | ((prev: SortingState) => SortingState)) => {
    setSortingRaw(updater);
    setPaginationRaw((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const setColumnFilters = useCallback((updater: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => {
    setColumnFiltersRaw(updater);
    setPaginationRaw((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const setGlobalFilter = useCallback((value: string) => {
    setGlobalFilterRaw(value);
    setPaginationRaw((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const clearSelection = useCallback(() => setRowSelectionRaw({}), []);

  const resetFilters = useCallback(() => {
    setGlobalFilterRaw('');
    setColumnFiltersRaw([]);
    setSortingRaw([]);
    setPaginationRaw((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  return useMemo(
    () => ({
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
      globalFilter,
      setSorting,
      setColumnFilters,
      setColumnVisibility: setColumnVisibilityRaw,
      setRowSelection: setRowSelectionRaw,
      setPagination: setPaginationRaw,
      setGlobalFilter,
      clearSelection,
      resetFilters,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sorting, columnFilters, columnVisibility, rowSelection, pagination, globalFilter]
  );
}

/**
 * Converts table state into URL search params for the products API.
 * The backend should accept: ?search=&page=&limit=&sortField=&sortDir=
 */
export function buildProductQueryParams(state: ProductTableState): URLSearchParams {
  const params = new URLSearchParams();

  if (state.globalFilter.trim()) {
    params.set('search', state.globalFilter.trim());
  }

  params.set('page', String(state.pagination.pageIndex + 1)); // backend is 1-indexed
  params.set('limit', String(state.pagination.pageSize));

  if (state.sorting.length > 0) {
    params.set('sortField', state.sorting[0].id);
    params.set('sortDir', state.sorting[0].desc ? 'desc' : 'asc');
  }

  return params;
}
