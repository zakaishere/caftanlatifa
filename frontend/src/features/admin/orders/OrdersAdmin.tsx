"use client";

import React, { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { ApiOrder, OrderStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/i18n/provider';
import dynamic from 'next/dynamic';

// Shared Table Infrastructure
import { DataTable } from '@/features/admin/shared/table/DataTable';
import { DataTableSkeleton } from '@/features/admin/shared/table/DataTableSkeleton';
import { PaginationControls } from '@/features/admin/shared/table/PaginationControls';

// Order Feature Components
import { useOrderTableState } from './hooks/useOrderTableState';
import { useOrderColumns } from './columns';
import { OrdersCommandBar } from './OrdersCommandBar';

// Lazy-load the mobile view
const MobileOrdersView = dynamic(
  () => import('@/features/admin/mobile/MobileOrdersView').then((m) => ({ default: m.MobileOrdersView })),
  { ssr: false }
);

// Lazy-load the order detail sheet (used on desktop too for quick preview)
const OrderDetailSheet = dynamic(
  () => import('@/features/admin/mobile/OrderDetailSheet').then((m) => ({ default: m.OrderDetailSheet })),
  { ssr: false }
);

export default function OrdersAdmin() {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // State Manager
  const tableState = useOrderTableState();
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Data Fetching
  const { data: allOrders = [], isLoading } = useQuery<ApiOrder[]>({
    queryKey: ['/api/admin/orders'],
  });

  // Client-side filtering/sorting for now (can be ported to server-side later)
  const filteredAndSortedData = useMemo(() => {
    let result = [...allOrders];

    // Global filtering
    if (tableState.globalFilter) {
      const q = tableState.globalFilter.toLowerCase();
      result = result.filter(o => 
        o.customerName.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q)
      );
    }

    // Status filtering
    if (tableState.statusFilter !== 'ALL') {
      result = result.filter(o => o.status === tableState.statusFilter);
    }

    // Date filtering
    if (tableState.datePreset !== 'all') {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      result = result.filter(o => {
        const d = new Date(o.createdAt);
        if (tableState.datePreset === 'today') return d >= startOfDay;
        if (tableState.datePreset === 'yesterday') {
          const yesterday = new Date(startOfDay);
          yesterday.setDate(yesterday.getDate() - 1);
          return d >= yesterday && d < startOfDay;
        }
        if (tableState.datePreset === '7days') {
          const weekAgo = new Date(startOfDay);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return d >= weekAgo;
        }
        if (tableState.datePreset === '30days') {
          const monthAgo = new Date(startOfDay);
          monthAgo.setDate(monthAgo.getDate() - 30);
          return d >= monthAgo;
        }
        return true;
      });
    }

    // Manual Sorting
    if (tableState.sorting.length > 0) {
      const { id, desc } = tableState.sorting[0];
      result.sort((a, b) => {
        const valA = (a as any)[id];
        const valB = (b as any)[id];
        if (valA < valB) return desc ? 1 : -1;
        if (valA > valB) return desc ? -1 : 1;
        return 0;
      });
    } else {
      // Default sort by date desc
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [allOrders, tableState.globalFilter, tableState.statusFilter, tableState.datePreset, tableState.sorting]);

  // Paginated Data
  const paginatedData = useMemo(() => {
    const start = tableState.pagination.pageIndex * tableState.pagination.pageSize;
    const end = start + tableState.pagination.pageSize;
    return filteredAndSortedData.slice(start, end);
  }, [filteredAndSortedData, tableState.pagination]);

  // Status Mutation
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const res = await apiRequest('PATCH', `/api/admin/orders/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({ title: t('admin.orders.toast.statusUpdated') });
    },
    onError: (err: Error) => {
      toast({ title: t('admin.orders.toast.errorTitle'), description: err.message, variant: 'destructive' });
    },
  });

  const handleViewOrder = (order: ApiOrder) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  const columns = useOrderColumns(handleViewOrder, (id, status) => updateStatus.mutate({ id, status }));

  return (
    <div className="flex flex-col h-full min-h-screen md:min-h-0">
      {/* ── Mobile View ────────────────────────────────────────── */}
      <div className="md:hidden">
        <MobileOrdersView />
      </div>

      {/* ── Desktop View ───────────────────────────────────────── */}
      <div className="hidden md:flex flex-col flex-1 space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{t('admin.orders.title')}</h1>
            <p className="text-sm text-muted-foreground font-medium mt-1">{t('admin.orders.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 font-bold">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            <Button size="sm" className="h-9 font-bold shadow-sm">
              <Plus className="h-4 w-4 mr-2" /> New Order
            </Button>
          </div>
        </div>

        {/* Command Bar */}
        <OrdersCommandBar state={tableState} actions={tableState} />

        {/* Data Table */}
        <div className="flex-1 min-h-0 bg-card border border-border/40 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="flex-1 overflow-auto custom-scrollbar">
            <DataTable
              columns={columns}
              data={paginatedData}
              isLoading={isLoading}
              sorting={tableState.sorting}
              onSortingChange={tableState.setSorting}
              rowSelection={tableState.rowSelection}
              onRowSelectionChange={tableState.setRowSelection}
              pagination={tableState.pagination}
              onPaginationChange={tableState.setPagination}
              pageCount={Math.ceil(filteredAndSortedData.length / tableState.pagination.pageSize)}
              loadingSlot={<DataTableSkeleton columns={columns.length} rows={10} />}
              onRowClick={handleViewOrder}
            />
          </div>

          {/* Pagination Footer */}
          <div className="border-t border-border/40 bg-muted/5">
            <PaginationControls
              page={tableState.pagination.pageIndex}
              pageSize={tableState.pagination.pageSize}
              pageCount={Math.ceil(filteredAndSortedData.length / tableState.pagination.pageSize)}
              total={filteredAndSortedData.length}
              onPageChange={(idx) => tableState.setPagination({ ...tableState.pagination, pageIndex: idx })}
              onPageSizeChange={(size) => tableState.setPagination({ pageIndex: 0, pageSize: size })}
              selectedCount={Object.keys(tableState.rowSelection).length}
            />
          </div>
        </div>
      </div>

      {/* QuickView Drawer (also used as mobile bottom sheet from desktop) */}
      <OrderDetailSheet
        order={selectedOrder}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdateStatus={(id: string, status: OrderStatus) => updateStatus.mutate({ id, status })}
        isPending={updateStatus.isPending}
      />
    </div>
  );
}
