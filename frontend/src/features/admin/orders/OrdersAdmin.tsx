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
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { ApiOrder, OrderStatus } from '@/lib/types';
import { centsToMad } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function OrdersAdmin() {
  const { toast } = useToast();
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
      toast({ title: 'Order status updated' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">Manage and process customer orders.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Orders ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No orders yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}…</TableCell>
                    <TableCell className="font-medium">
                      {order.customerName}
                      <div className="text-xs text-muted-foreground">{order.phone}</div>
                    </TableCell>
                    <TableCell>{order.city}</TableCell>
                    <TableCell>{centsToMad(order.total)} MAD</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[order.status]}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="ghost" size="sm">View</Button>
                        </SheetTrigger>
                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle>Order Details</SheetTitle>
                            <SheetDescription className="font-mono text-xs">{order.id}</SheetDescription>
                          </SheetHeader>
                          <div className="mt-8 space-y-6">
                            <div>
                              <h3 className="font-semibold mb-2">Customer Info</h3>
                              <div className="text-sm space-y-1">
                                <p><span className="text-muted-foreground">Name:</span> {order.customerName}</p>
                                <p><span className="text-muted-foreground">Phone:</span> {order.phone}</p>
                                <p><span className="text-muted-foreground">City:</span> {order.city}</p>
                                <p><span className="text-muted-foreground">Address:</span> {order.address}</p>
                                {order.notes && <p><span className="text-muted-foreground">Notes:</span> {order.notes}</p>}
                              </div>
                            </div>

                            <div>
                              <h3 className="font-semibold mb-2">Items</h3>
                              <div className="border rounded-md divide-y">
                                {order.items.map((item) => (
                                  <div key={item.id} className="p-3 text-sm flex justify-between">
                                    <span>{item.quantity}× {item.name}</span>
                                    <span className="font-medium">{centsToMad(item.price * item.quantity)} MAD</span>
                                  </div>
                                ))}
                                <div className="p-3 bg-muted/20 flex justify-between text-xs text-muted-foreground">
                                  <span>Delivery</span>
                                  <span>{centsToMad(order.deliveryFee)} MAD</span>
                                </div>
                                <div className="p-3 bg-muted/20 flex justify-between font-bold">
                                  <span>Total</span>
                                  <span>{centsToMad(order.total)} MAD</span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              {order.status === 'PENDING' && (
                                <Button
                                  className="w-full justify-start gap-2 bg-emerald-600 hover:bg-emerald-700"
                                  disabled={updateStatus.isPending}
                                  onClick={() => updateStatus.mutate({ id: order.id, status: 'CONFIRMED' })}
                                >
                                  <CheckCircle className="h-4 w-4" /> Confirm Order
                                </Button>
                              )}
                              {order.status === 'CONFIRMED' && (
                                <Button
                                  className="w-full justify-start gap-2"
                                  variant="outline"
                                  disabled={updateStatus.isPending}
                                  onClick={() => updateStatus.mutate({ id: order.id, status: 'DELIVERED' })}
                                >
                                  <Truck className="h-4 w-4" /> Mark as Delivered
                                </Button>
                              )}
                              {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                                <Button
                                  className="w-full justify-start gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                  variant="ghost"
                                  disabled={updateStatus.isPending}
                                  onClick={() => updateStatus.mutate({ id: order.id, status: 'CANCELLED' })}
                                >
                                  <XCircle className="h-4 w-4" /> Cancel Order
                                </Button>
                              )}
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
