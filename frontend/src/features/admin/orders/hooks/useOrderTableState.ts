'use client';

import { useState, useCallback, useMemo } from 'react';
import type { SortingState, ColumnFiltersState, VisibilityState, RowSelectionState } from '@tanstack/react-table';
import type { OrderStatus } from '@/lib/types';

export type DateRangePreset = 'all' | 'today' | 'yesterday' | '7days' | '30days' | 'custom';

export interface OrderTableState {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  rowSelection: RowSelectionState;
  pagination: { pageIndex: number; pageSize: number };
  globalFilter: string;
  statusFilter: OrderStatus | 'ALL';
  datePreset: DateRangePreset;
  dateRange: { from: Date | undefined; to: Date | undefined };
}

export interface OrderTableActions {
  setSorting: (updater: SortingState | ((prev: SortingState) => SortingState)) => void;
  setColumnFilters: (updater: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => void;
  setColumnVisibility: (updater: VisibilityState | ((prev: VisibilityState) => VisibilityState)) => void;
  setRowSelection: (updater: RowSelectionState | ((prev: RowSelectionState) => RowSelectionState)) => void;
  setPagination: (updater: { pageIndex: number; pageSize: number } | ((prev: { pageIndex: number; pageSize: number }) => { pageIndex: number; pageSize: number })) => void;
  setGlobalFilter: (value: string) => void;
  setStatusFilter: (value: OrderStatus | 'ALL') => void;
  setDatePreset: (value: DateRangePreset) => void;
  setDateRange: (value: { from: Date | undefined; to: Date | undefined }) => void;
  clearSelection: () => void;
  resetFilters: () => void;
}

export function useOrderTableState(defaultPageSize = 25): OrderTableState & OrderTableActions {
  const [sorting, setSortingRaw] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [columnFilters, setColumnFiltersRaw] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibilityRaw] = useState<VisibilityState>({});
  const [rowSelection, setRowSelectionRaw] = useState<RowSelectionState>({});
  const [pagination, setPaginationRaw] = useState({ pageIndex: 0, pageSize: defaultPageSize });
  const [globalFilter, setGlobalFilterRaw] = useState('');
  const [statusFilter, setStatusFilterRaw] = useState<OrderStatus | 'ALL'>('ALL');
  const [datePreset, setDatePresetRaw] = useState<DateRangePreset>('all');
  const [dateRange, setDateRangeRaw] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });

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

  const setStatusFilter = useCallback((value: OrderStatus | 'ALL') => {
    setStatusFilterRaw(value);
    setPaginationRaw((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const setDatePreset = useCallback((value: DateRangePreset) => {
    setDatePresetRaw(value);
    setPaginationRaw((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const setDateRange = useCallback((value: { from: Date | undefined; to: Date | undefined }) => {
    setDateRangeRaw(value);
    setPaginationRaw((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const clearSelection = useCallback(() => setRowSelectionRaw({}), []);

  const resetFilters = useCallback(() => {
    setGlobalFilterRaw('');
    setColumnFiltersRaw([]);
    setSortingRaw([{ id: 'createdAt', desc: true }]);
    setStatusFilterRaw('ALL');
    setDatePresetRaw('all');
    setDateRangeRaw({ from: undefined, to: undefined });
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
      statusFilter,
      datePreset,
      dateRange,
      setSorting,
      setColumnFilters,
      setColumnVisibility: setColumnVisibilityRaw,
      setRowSelection: setRowSelectionRaw,
      setPagination: setPaginationRaw,
      setGlobalFilter,
      setStatusFilter,
      setDatePreset,
      setDateRange,
      clearSelection,
      resetFilters,
    }),
    [sorting, columnFilters, columnVisibility, rowSelection, pagination, globalFilter, statusFilter, datePreset, dateRange, setSorting, setColumnFilters, setGlobalFilter, setStatusFilter, setDatePreset, setDateRange, clearSelection, resetFilters]
  );
}
