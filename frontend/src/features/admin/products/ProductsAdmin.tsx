'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Trash2, Package } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { ApiProduct } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ProductForm } from './ProductForm';
import { useTranslation } from '@/i18n/provider';
import { DataTable } from '@/features/admin/shared/table/DataTable';
import { DataTableSkeleton } from '@/features/admin/shared/table/DataTableSkeleton';
import { DataTableEmpty } from '@/features/admin/shared/table/DataTableEmpty';
import { DataTableToolbar } from '@/features/admin/shared/table/DataTableToolbar';
import { PaginationControls } from '@/features/admin/shared/table/PaginationControls';
import { getProductColumns } from './columns';
import { useProductTableState, buildProductQueryParams } from './hooks/useProductTableState';
import dynamic from 'next/dynamic';

const MobileProductsView = dynamic(
  () => import('@/features/admin/mobile/MobileProductsView').then((m) => ({ default: m.MobileProductsView })),
  { ssr: false }
);

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProductsPage {
  data: ApiProduct[];
  total: number;
  pageCount: number;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProductsAdmin() {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ApiProduct | null>(null);

  // All table state lives in this hook
  const tableState = useProductTableState(25);

  // Build query params from table state
  const queryParams = useMemo(
    () => buildProductQueryParams(tableState),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tableState.globalFilter, tableState.pagination, tableState.sorting]
  );

  // ─── Server data fetch ────────────────────────────────────────────────────
  const queryKey = ['/api/admin/products', queryParams.toString()];

  const { data, isLoading, isFetching } = useQuery<ProductsPage>({
    queryKey,
    queryFn: async () => {
      const url = `/api/admin/products?${queryParams.toString()}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch products');
      const json = await res.json();
      // Support both paginated { data, total, pageCount } and legacy array response
      if (Array.isArray(json)) {
        return { data: json, total: json.length, pageCount: 1 };
      }
      return json as ProductsPage;
    },
  });

  const products = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageCount = data?.pageCount ?? 1;

  // ─── Mutations ────────────────────────────────────────────────────────────
  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/admin/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      setDeletingProduct(null);
      tableState.clearSelection();
      toast({ title: t('admin.products.toast.deleted') });
    },
    onError: (err: Error) => {
      toast({ title: t('admin.products.toast.errorTitle'), description: err.message, variant: 'destructive' });
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async (products: ApiProduct[]) => {
      await Promise.all(products.map((p) => apiRequest('DELETE', `/api/admin/products/${p.id}`)));
    },
    onSuccess: (_, deletedProducts) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      tableState.clearSelection();
      toast({ title: `${deletedProducts.length} products deleted` });
    },
    onError: (err: Error) => {
      toast({ title: 'Bulk delete failed', description: err.message, variant: 'destructive' });
    },
  });

  // ─── Optimistic status mutate callback ───────────────────────────────────
  // Called by the column's status cell after a successful PATCH —
  // updates cache directly without a full refetch
  const handleStatusMutate = useCallback(
    (id: string, patch: Partial<ApiProduct>) => {
      queryClient.setQueryData<ProductsPage>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        };
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryKey.toString()]
  );

  // ─── Selected rows ────────────────────────────────────────────────────────
  const selectedProductIds = Object.keys(tableState.rowSelection);
  const selectedProducts = products.filter((p) => selectedProductIds.includes(p.id));

  // ─── Columns (memoized — only re-create when callbacks change) ────────────
  const columns = useMemo(
    () =>
      getProductColumns({
        onEdit: setEditingProduct,
        onDelete: setDeletingProduct,
        onStatusMutate: handleStatusMutate,
        currency: t('common.currency'),
      }),
    [handleStatusMutate, t]
  );

  const isFiltered = tableState.globalFilter.trim().length > 0;

  return (
    <>
      {/* ── Mobile view (hidden on md+) ────────────────────────────── */}
      <div className="block md:hidden">
        <MobileProductsView 
          onOpenAddProduct={() => setIsAddDialogOpen(true)}
          onEditProduct={(product) => setEditingProduct(product)}
        />
      </div>

      {/* ── Desktop view (hidden on mobile) ───────────────────────── */}
      <div className="hidden md:block space-y-5">
        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {t('admin.products.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total > 0 ? `${total.toLocaleString()} products` : t('admin.products.subtitle')}
          </p>
        </div>

        {/* Add product dialog trigger */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 h-8 text-sm shrink-0">
              <Plus className="h-3.5 w-3.5" />
              {t('admin.products.addProduct')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto text-start">
            <DialogHeader className="text-start">
              <DialogTitle className="text-start">{t('admin.products.addNew')}</DialogTitle>
              <DialogDescription className="text-start">{t('admin.products.addNewDesc')}</DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <ProductForm onSuccess={() => setIsAddDialogOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit dialog (no trigger — opened programmatically) */}
        <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto text-start">
            <DialogHeader className="text-start">
              <DialogTitle className="text-start">{t('admin.products.editProduct')}</DialogTitle>
              <DialogDescription className="text-start">{t('admin.products.editProductDesc')}</DialogDescription>
            </DialogHeader>
            <div className="py-2">
              {editingProduct && (
                <ProductForm initialData={editingProduct} onSuccess={() => setEditingProduct(null)} />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Table card ──────────────────────────────────────────────────── */}
      <Card className="overflow-hidden border-border/50 gap-0 py-0 shadow-none">
        {/* Card header: search + column count */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground/60" />
            <span className="text-sm font-medium text-foreground">
              {t('admin.products.allProducts')}
            </span>
            {!isLoading && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                {total}
              </span>
            )}
            {isFetching && !isLoading && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            )}
          </div>

          {/* Search */}
          <div className="relative w-56 sm:w-72">
            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
            <Input
              type="search"
              placeholder={t('admin.products.searchPlaceholder')}
              className="ps-8 h-8 text-sm border-border/60 focus-visible:ring-1 bg-muted/30"
              value={tableState.globalFilter}
              onChange={(e) => tableState.setGlobalFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Bulk action toolbar (slides in when rows selected) */}
        <DataTableToolbar
          selectedRows={selectedProducts}
          onClearSelection={tableState.clearSelection}
          bulkActions={[
            {
              label: `Delete (${selectedProducts.length})`,
              icon: <Trash2 className="h-3.5 w-3.5" />,
              variant: 'destructive',
              onClick: (rows) => bulkDelete.mutate(rows),
            },
          ]}
        />

        {/* Main table */}
        <DataTable
          columns={columns}
          data={products}
          isLoading={isLoading}
          sorting={tableState.sorting}
          onSortingChange={tableState.setSorting}
          rowSelection={tableState.rowSelection}
          onRowSelectionChange={tableState.setRowSelection}
          pagination={tableState.pagination}
          onPaginationChange={tableState.setPagination}
          pageCount={pageCount}
          getRowId={(row) => row.id}
          loadingSlot={<DataTableSkeleton columns={5} rows={8} hasCheckbox />}
          emptySlot={
            <DataTableEmpty
              isFiltered={isFiltered}
              onClearFilters={isFiltered ? tableState.resetFilters : undefined}
              noun="products"
              createLabel={t('admin.products.addProduct')}
              onCreateClick={() => setIsAddDialogOpen(true)}
            />
          }
        />

        {/* Pagination */}
        {!isLoading && total > 0 && (
          <PaginationControls
            page={tableState.pagination.pageIndex}
            pageSize={tableState.pagination.pageSize}
            pageCount={pageCount}
            total={total}
            selectedCount={selectedProducts.length}
            onPageChange={(p) =>
              tableState.setPagination((prev) => ({ ...prev, pageIndex: p }))
            }
            onPageSizeChange={(size) =>
              tableState.setPagination({ pageIndex: 0, pageSize: size })
            }
          />
        )}
      </Card>

      {/* ── Delete confirmation dialog ────────────────────────────────── */}
      <AlertDialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deletingProduct?.name}</strong> will be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingProduct && deleteProduct.mutate(deletingProduct.id)}
              disabled={deleteProduct.isPending}
            >
              {deleteProduct.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </>
  );
}
