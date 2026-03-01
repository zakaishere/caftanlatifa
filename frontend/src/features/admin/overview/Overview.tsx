"use client";
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal, ShoppingBag, Loader2 } from 'lucide-react';
import type { ApiStats, OrderStatus } from '@/lib/types';
import { centsToMad } from '@/lib/types';
import Link from 'next/link';

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function AdminOverview() {
  const { data: stats, isLoading } = useQuery<ApiStats>({
    queryKey: ['/api/admin/stats'],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your store's performance.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats?.kpis.map((stat, i) => (
          <Card key={i} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              {stat.trend === 'up' ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              ) : stat.trend === 'down' ? (
                <ArrowDownRight className="h-4 w-4 text-rose-500" />
              ) : (
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${stat.trend === 'up' ? 'text-emerald-500' :
                  stat.trend === 'down' ? 'text-rose-500' : 'text-muted-foreground'
                }`}>
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Chart */}
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Weekly Revenue</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stats?.chartData ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value} MAD`}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {(stats?.recentOrders ?? []).map((order) => (
                <div key={order.id} className="flex items-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                  </div>
                  <div className="ml-4 space-y-1 flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none truncate">{order.customerName}</p>
                    <p className="text-xs text-muted-foreground">{order.city}</p>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-1">
                    <span className="font-medium text-sm">+{centsToMad(order.total)} MAD</span>
                    <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[order.status]}`}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {(stats?.recentOrders?.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No orders yet</p>
              )}
            </div>
            <Link href="/admin/orders">
              <Button variant="outline" className="w-full mt-6">
                View All Orders
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
