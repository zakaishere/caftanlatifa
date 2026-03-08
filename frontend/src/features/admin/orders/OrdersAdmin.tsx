"use client";
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, CheckCircle, XCircle, Truck, Loader2 } from 'lucide-react';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { ApiOrder, OrderStatus } from '@/lib/types';
import { centsToMad } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { OrderItemsList } from '@/components/ui/order-items-list';
import { useTranslation } from '@/i18n/provider';

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function OrdersAdmin() {
  const { toast } = useToast();
  const { t, locale } = useTranslation();
  const { data: orders = [], isLoading } = useQuery<ApiOrder[]>({
    queryKey: ['/api/admin/orders'],
  });

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-start">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('admin.orders.title')}</h1>
        <p className="text-muted-foreground">{t('admin.orders.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.orders.allOrders')} ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">{t('admin.orders.noOrders')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.orders.table.id')}</TableHead>
                  <TableHead>{t('admin.orders.table.customer')}</TableHead>
                  <TableHead>{t('admin.orders.table.city')}</TableHead>
                  <TableHead>{t('admin.orders.table.total')}</TableHead>
                  <TableHead>{t('admin.orders.table.date')}</TableHead>
                  <TableHead>{t('admin.orders.table.status')}</TableHead>
                  <TableHead className="text-end">{t('admin.orders.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs text-start" dir="ltr">{order.id.slice(0, 8)}…</TableCell>
                    <TableCell className="font-medium">
                      {order.customerName}
                      <div className="text-xs text-muted-foreground" dir="ltr">{order.phone}</div>
                    </TableCell>
                    <TableCell>{order.city}</TableCell>
                    <TableCell dir="ltr">{centsToMad(order.total)} {t('common.currency')}</TableCell>
                    <TableCell className="text-muted-foreground text-sm" dir="ltr">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[order.status]}>
                        {t(`admin.dashboard.status.${order.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="ghost" size="sm" className="ltr:ml-auto rtl:mr-auto">{t('admin.orders.view')}</Button>
                        </SheetTrigger>
                        <SheetContent className={locale === 'ar' ? 'text-left' : 'text-start'} side={locale === 'ar' ? 'left' : 'right'}>
                          <div dir={locale === 'ar' ? 'ltr' : undefined} className={locale === 'ar' ? 'text-left h-full' : 'text-start h-full'}>
                            <SheetHeader className={locale === 'ar' ? 'text-left' : 'text-start'}>
                              <SheetTitle className={locale === 'ar' ? 'text-left' : 'text-start'}>{t('admin.orders.detailsTitle')}</SheetTitle>
                              <SheetDescription className={cn("font-mono text-xs", locale === 'ar' ? 'text-left' : 'text-start')}>{order.id}</SheetDescription>
                            </SheetHeader>
                            <div className="mt-8 space-y-6">
                              <div>
                                <h3 className="font-semibold mb-2">{t('admin.orders.customerInfo')}</h3>
                                <div className="text-sm space-y-1">
                                  <p><span className="text-muted-foreground">{t('admin.orders.info.name')}</span> {order.customerName}</p>
                                  <p><span className="text-muted-foreground">{t('admin.orders.info.phone')}</span> <span dir="ltr">{order.phone}</span></p>
                                  <p><span className="text-muted-foreground">{t('admin.orders.info.city')}</span> {order.city}</p>
                                  <p><span className="text-muted-foreground">{t('admin.orders.info.address')}</span> {order.address}</p>
                                  {order.notes && <p><span className="text-muted-foreground">{t('admin.orders.info.notes')}</span> {order.notes}</p>}
                                </div>
                              </div>

                              <div>
                                <h3 className="font-semibold mb-3">{t('admin.orders.items')}</h3>
                                <OrderItemsList
                                  items={order.items}
                                  deliveryFee={order.deliveryFee}
                                  total={order.total}
                                  enableProductLinks={true}
                                />
                              </div>

                              <div className="space-y-2">
                                {order.status === 'PENDING' && (
                                  <Button
                                    className="w-full justify-start gap-2 bg-emerald-600 hover:bg-emerald-700"
                                    disabled={updateStatus.isPending}
                                    onClick={() => updateStatus.mutate({ id: order.id, status: 'CONFIRMED' })}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" /> {t('admin.orders.actions.confirm')}
                                  </Button>
                                )}
                                {order.status === 'CONFIRMED' && (
                                  <Button
                                    className="w-full justify-start gap-2"
                                    variant="outline"
                                    disabled={updateStatus.isPending}
                                    onClick={() => updateStatus.mutate({ id: order.id, status: 'DELIVERED' })}
                                  >
                                    <Truck className="h-4 w-4 mr-2" /> {t('admin.orders.actions.deliver')}
                                  </Button>
                                )}
                                {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                                  <Button
                                    className="w-full justify-start gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                    variant="ghost"
                                    disabled={updateStatus.isPending}
                                    onClick={() => updateStatus.mutate({ id: order.id, status: 'CANCELLED' })}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" /> {t('admin.orders.actions.cancel')}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>
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
