"use client";
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { ApiCategory } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/i18n/provider';

export default function CategoriesAdmin() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [open, setOpen] = useState(false);

  const { data: categories = [], isLoading } = useQuery<ApiCategory[]>({
    queryKey: ['/api/admin/categories'],
  });

  const createCategory = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/categories', { name, slug });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
      toast({ title: t('admin.categories.toast.created') });
      setName(''); setSlug(''); setOpen(false);
    },
    onError: (err: Error) => {
      toast({ title: t('admin.categories.toast.errorTitle'), description: err.message, variant: 'destructive' });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/admin/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
      toast({ title: t('admin.categories.toast.deleted') });
    },
    onError: (err: Error) => {
      toast({ title: t('admin.categories.toast.errorTitle'), description: err.message, variant: 'destructive' });
    },
  });

  return (
    <div className="space-y-6 text-start">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('admin.categories.title')}</h1>
          <p className="text-muted-foreground">{t('admin.categories.subtitle')}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> {t('admin.categories.addCategory')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] text-start">
            <DialogHeader className="text-start">
              <DialogTitle className="text-start">{t('admin.categories.addNew')}</DialogTitle>
              <DialogDescription className="text-start">{t('admin.categories.addNewDesc')}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">{t('admin.categories.name')}</label>
                <Input id="name" placeholder={t('admin.categories.namePlaceholder')} value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <label htmlFor="slug" className="text-sm font-medium">{t('admin.categories.slug')}</label>
                <Input id="slug" placeholder={t('admin.categories.slugPlaceholder')} value={slug} onChange={e => setSlug(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={createCategory.isPending || !name || !slug}
                onClick={() => createCategory.mutate()}
              >
                {createCategory.isPending ? t('admin.categories.saving') : t('admin.categories.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-medium">{t('admin.categories.allCategories')} ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.categories.table.name')}</TableHead>
                  <TableHead>{t('admin.categories.table.slug')}</TableHead>
                  <TableHead>{t('admin.categories.table.productsCount')}</TableHead>
                  <TableHead className="text-end">{t('admin.categories.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
                    <TableCell>{cat._count?.products ?? 0}</TableCell>
                    <TableCell className="text-end">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteCategory.mutate(cat.id)}
                          disabled={deleteCategory.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
