"use client";
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { ApiProduct } from '@/lib/types';
import { centsToMad } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ProductForm } from './ProductForm';
import { ProductTable } from './ProductTable';
import { getColumns } from './ProductColumns';

export default function ProductsAdmin() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);

  const { data: products = [], isLoading } = useQuery<ApiProduct[]>({
    queryKey: ['/api/admin/products', search],
    queryFn: async () => {
      const url = search ? `/api/admin/products?search=${encodeURIComponent(search)}` : '/api/admin/products';
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/admin/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      toast({ title: 'Product deleted' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const toggleStock = useMutation({
    mutationFn: async ({ id, inStock }: { id: string, inStock: boolean }) => {
      await apiRequest('PATCH', `/api/admin/products/${id}`, { inStock: !inStock });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      toast({ title: 'Availability updated' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const columns = getColumns({
    onEdit: setEditingProduct,
    deleteMutation: deleteProduct,
    toggleStockMutation: toggleStock,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>Create a new product with multiple images.</DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <ProductForm onSuccess={() => setIsAddDialogOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>Update the product details, images, and pricing.</DialogDescription>
            </DialogHeader>
            <div className="py-2">
              {editingProduct && (
                <ProductForm
                  initialData={editingProduct}
                  onSuccess={() => setEditingProduct(null)}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-medium">All Products ({products.length})</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <ProductTable 
            columns={columns} 
            data={products} 
            isLoading={isLoading} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
