"use client";
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { ApiProduct } from '@/lib/types';
import { centsToMad } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ProductForm } from './ProductForm';
import { useTranslation } from '@/i18n/provider';

export default function ProductsAdmin() {
  const { t } = useTranslation();
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
      toast({ title: t('admin.products.toast.deleted') });
    },
    onError: (err: Error) => {
      toast({ title: t('admin.products.toast.errorTitle'), description: err.message, variant: 'destructive' });
    },
  });

  const toggleStock = useMutation({
    mutationFn: async ({ id, inStock }: { id: string, inStock: boolean }) => {
      await apiRequest('PATCH', `/api/admin/products/${id}`, { inStock: !inStock });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      toast({ title: t('admin.products.toast.availabilityUpdated') });
    },
    onError: (err: Error) => {
      toast({ title: t('admin.products.toast.errorTitle'), description: err.message, variant: 'destructive' });
    },
  });

  return (
    <div className="space-y-6 text-start">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('admin.products.title')}</h1>
          <p className="text-muted-foreground">{t('admin.products.subtitle')}</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> {t('admin.products.addProduct')}
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

        <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto text-start">
            <DialogHeader className="text-start">
              <DialogTitle className="text-start">{t('admin.products.editProduct')}</DialogTitle>
              <DialogDescription className="text-start">{t('admin.products.editProductDesc')}</DialogDescription>
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
          <CardTitle className="text-base font-medium">{t('admin.products.allProducts')} ({products.length})</CardTitle>
          <div className="relative w-64">
            <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('admin.products.searchPlaceholder')}
              className="ps-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">{t('admin.products.noProducts')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">{t('admin.products.table.image')}</TableHead>
                  <TableHead>{t('admin.products.table.name')}</TableHead>
                  <TableHead>{t('admin.products.table.category')}</TableHead>
                  <TableHead>{t('admin.products.table.price')}</TableHead>
                  <TableHead>{t('admin.products.table.status')}</TableHead>
                  <TableHead className="text-end">{t('admin.products.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="h-10 w-10 rounded bg-muted overflow-hidden flex items-center justify-center">
                        {product.images && product.images.length > 0 ? (
                          <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category?.name}</TableCell>
                    <TableCell dir="ltr">{centsToMad(product.price)} {t('common.currency')}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => toggleStock.mutate({ id: product.id, inStock: product.inStock })}
                        className="hover:opacity-80 transition-opacity"
                        disabled={toggleStock.isPending}
                      >
                        <Badge
                          variant={product.inStock ? "outline" : "destructive"}
                          className={product.inStock ? "text-emerald-600 bg-emerald-50 border-emerald-200 cursor-pointer" : "cursor-pointer"}
                        >
                          {toggleStock.isPending && <Loader2 className="rtl:ml-1 ltr:mr-1 h-3 w-3 animate-spin" />}
                          {product.inStock ? t('admin.products.inStock') : t('admin.products.outOfStock')}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell className="text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">{t('admin.products.openMenu')}</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-start">
                          <DropdownMenuLabel>{t('admin.products.actionsMenu.title')}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setEditingProduct(product)}>
                            <Edit className="rtl:ml-2 ltr:mr-2 h-4 w-4" /> {t('admin.products.actionsMenu.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteProduct.mutate(product.id)}
                          >
                            <Trash2 className="rtl:ml-2 ltr:mr-2 h-4 w-4" /> {t('admin.products.actionsMenu.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
