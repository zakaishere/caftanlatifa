"use client";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMyOrders } from '@/hooks/useMyOrders';
import { apiRequest } from '@/lib/queryClient';
import { ApiOrder, centsToMad, ApiInitData } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ArrowRight, MessageSquare, Clipboard, Check, XCircle, Clock, CheckCircle2, Truck, ShoppingBag, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
    Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
    Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger,
} from "@/components/ui/drawer";
import { OrderItemsList } from '@/components/ui/order-items-list';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from '@/i18n/provider';

const statusConfig = {
    PENDING: {
        color: 'text-amber-600 bg-amber-50 border-amber-100',
        icon: Clock,
        label: 'EN ATTENTE'
    },
    CONFIRMED: {
        color: 'text-blue-600 bg-blue-50 border-blue-100',
        icon: CheckCircle2,
        label: 'CONFIRMÉE'
    },
    DELIVERED: {
        color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        icon: Truck,
        label: 'LIVRÉE'
    },
    CANCELLED: {
        color: 'text-red-600 bg-red-50 border-red-100',
        icon: XCircle,
        label: 'ANNULÉE'
    },
};

export default function MyOrders() {
    const { orderIds, trackOrder, untrackOrder } = useMyOrders();
    const { t, locale } = useTranslation();
    const queryClient = useQueryClient();
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const isMobile = useIsMobile();

    const { data: initData } = useQuery<ApiInitData>({
        queryKey: ['/api/public/init'],
    });
    const settings = initData?.settings;

    const { data: orders, isLoading } = useQuery<ApiOrder[]>({
        queryKey: ['/api/public/orders', orderIds],
        queryFn: async () => {
            if (orderIds.length === 0) return [];
            const res = await apiRequest('GET', `/api/public/orders?ids=${orderIds.join(',')}`);
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        },
        enabled: orderIds.length > 0,
    });

    const cancelMutation = useMutation({
        mutationFn: async (orderId: string) => {
            const res = await apiRequest('POST', `/api/public/orders/${orderId}/cancel`);
            return res.json();
        },
        onSuccess: (_, orderId) => {
            queryClient.invalidateQueries({ queryKey: ['/api/public/orders'] });
            toast.success(t('myOrders.cancelSuccess'), {
                description: t('myOrders.cancelSuccessDesc', { id: orderId.split('-')[0].toUpperCase() }),
            });
        },
        onError: (error: any) => {
            toast.error(t('myOrders.cancelFail'), {
                description: error.message,
            });
        }
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery || searchQuery.length < 3) return;

        setIsSearching(true);
        try {
            const res = await apiRequest('GET', `/api/public/orders/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();

            if (data && data.length > 0) {
                data.forEach((order: any) => trackOrder(order.id));
                toast.success(`${data.length} ${t('myOrders.ordersFound')}`);
                setSearchQuery('');
            } else {
                toast.error(t('myOrders.noOrdersFound'));
            }
        } catch (error: any) {
            toast.error(t('myOrders.searchError'), { description: error.message });
        } finally {
            setIsSearching(false);
        }
    };

    const truncateRef = (id: string) => {
        if (id.length <= 15) return id;
        return `${id.slice(0, 8)}...${id.slice(-4)}`;
    };

    const copyToClipboard = (id: string) => {
        navigator.clipboard.writeText(id).then(() => {
            setCopiedId(id);
            toast.success(t('myOrders.copySuccess'));
            setTimeout(() => setCopiedId(null), 1500);
        });
    };

    if (orderIds.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center min-h-[70vh]">
                <div className="h-20 w-20 bg-primary/5 flex items-center justify-center mb-8 border border-primary/10">
                    <Search className="h-8 w-8 text-primary/30" strokeWidth={1} />
                </div>
                <h1 className="font-serif text-3xl mb-4 tracking-tight">{t('myOrders.trackOrder')}</h1>
                <p className="text-muted-foreground text-[11px] uppercase tracking-[0.2em] mb-12 max-w-xs font-light">
                    {t('myOrders.trackOrderDesc')}
                </p>
                <form onSubmit={handleSearch} className="w-full max-w-sm space-y-4">
                    <Input
                        placeholder={t('myOrders.placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-14 rounded-none border-primary/10 text-center"
                    />
                    <Button type="submit" disabled={isSearching} className="w-full h-14 rounded-none bg-black text-white hover:bg-primary uppercase tracking-[0.3em] font-bold text-[10px]">
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : t('myOrders.search')}
                    </Button>
                </form>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-16 pb-32 bg-[#FAF7F2]/30 min-h-screen">
            {/* ── Page Header ────────────────────────────────────────── */}
            <div className="flex flex-col items-center text-center mb-10 md:mb-20">
                <span className="text-[10px] uppercase tracking-[0.4em] text-primary mb-3">{t('myOrders.subtitle')}</span>
                <h1 className="font-serif text-3xl md:text-5xl text-foreground tracking-tight mb-4">{t('myOrders.title')}</h1>
                <div className="h-[1px] w-12 bg-primary/30" />
            </div>

            {/* ── Search Bar (Compact) ───────────────────────────────── */}
            <div className="mb-10 max-w-md mx-auto">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                        placeholder={t('myOrders.placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-12 bg-white/80 border-primary/5 rounded-none text-xs text-start"
                    />
                    <Button type="submit" variant="outline" className="h-12 w-12 p-0 rounded-none border-primary/10">
                        <Search className="h-4 w-4" />
                    </Button>
                </form>
            </div>

            {/* ── Orders List ────────────────────────────────────────── */}
            <div className="space-y-6">
                {orders?.map((order) => {
                    const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.PENDING;
                    const itemsText = order.items.length === 1 ? `1 ${t('checkout.item')}` : `${order.items.length} ${t('checkout.items')}`;

                    return (
                        <div key={order.id} className="bg-white border border-primary/10 shadow-sm overflow-hidden group text-start">

                            {/* Header: 2 Lines Responsive Layout */}
                            <div className="p-4 md:p-6 bg-[#F9F7F4]/50 border-b border-primary/5 flex items-center justify-between">
                                <div className="space-y-1 text-start">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40 font-bold">{t('myOrders.ref')}</span>
                                        <span className="font-mono font-bold text-[13px] md:text-base tracking-tight" dir="ltr">
                                            #{truncateRef(order.id.split('-')[0].toUpperCase())}
                                        </span>
                                        <button
                                            onClick={() => copyToClipboard(order.id)}
                                            className="rtl:mr-1 ltr:ml-1 h-5 w-5 flex items-center justify-center border border-primary/10 rounded-sm text-muted-foreground/40 hover:text-primary transition-colors active:scale-90"
                                            aria-label={t('myOrders.copyAria')}
                                        >
                                            {copiedId === order.id ? <Check className="h-2.5 w-2.5 text-emerald-500" /> : <Clipboard className="h-2.5 w-2.5" />}
                                        </button>
                                    </div>
                                    <time className="block text-[11px] text-muted-foreground font-medium" dir="ltr">
                                        {new Date(order.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </time>
                                </div>
                                <div className="text-end">
                                    <Badge className={cn("rounded-none px-2 py-0.5 text-[9px] font-black tracking-[0.1em] border shadow-none mb-1", status.color)}>
                                        {t(`myOrders.statuses.${order.status}`)}
                                    </Badge>
                                    <div className="font-serif text-[15px] font-medium tracking-tight mt-1" dir="ltr">
                                        {centsToMad(order.total)} {t('common.currency')}
                                    </div>
                                </div>
                            </div>

                            {/* Body: Summary Text + Action Toggle */}
                            <div className="p-4 md:p-6 flex items-center justify-between">
                                <p className="text-[11px] uppercase tracking-widest text-muted-foreground/60 font-medium">
                                    {itemsText}
                                </p>

                                {/* Order Details Content inside the Drawer/Sheet */}
                                {(() => {
                                    const detailsContent = (
                                        <div className="space-y-6 mt-4">
                                            {/* Status Box */}
                                            <div className="bg-[#FAF7F2] p-4 border border-primary/5 rounded-sm text-left">
                                                <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-2 font-bold">{t('myOrders.currentStatus')}</h4>
                                                <div className={cn("flex items-center gap-2 font-black text-sm uppercase tracking-[0.1em]", status.color.replace('bg-', 'text-').replace('border-', 'fill-'))}>
                                                    <status.icon className="h-5 w-5 rtl:scale-x-[-1]" /> {t(`myOrders.statuses.${order.status}`)}
                                                </div>
                                            </div>

                                            {/* Reusable Item List */}
                                            <div className="text-left">
                                                <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-3 font-bold">{t('myOrders.articles')} ({order.items.length})</h4>
                                                <OrderItemsList
                                                    items={order.items}
                                                    deliveryFee={order.deliveryFee}
                                                    total={order.total}
                                                    enableProductLinks={false}
                                                />
                                            </div>

                                            {/* Action Buttons Inside Drawer */}
                                            <div className="pt-4 space-y-3">
                                                <Link
                                                    href={`https://wa.me/${settings?.whatsappNumber?.replace(/\+/g, '') || '212600000000'}?text=${encodeURIComponent(`Bonjour, suivi commande #${order.id.split('-')[0].toUpperCase()}`)}`}
                                                    target="_blank"
                                                    className="w-full block"
                                                >
                                                    <Button className="w-full h-12 rounded-none bg-black text-white hover:bg-[#C9A227] text-[10px] font-bold uppercase tracking-[0.2em] gap-2 shadow-lg shadow-black/5 transition-all active:scale-[0.98]">
                                                        <MessageSquare className="h-4 w-4" /> {t('myOrders.needHelp')}
                                                    </Button>
                                                </Link>

                                                {order.status === 'PENDING' && (
                                                    <Button
                                                        variant="outline"
                                                        className="w-full h-12 rounded-none border-primary/10 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 hover:text-red-600 hover:border-red-200 transition-all"
                                                        onClick={() => {
                                                            if (confirm(t('myOrders.cancelConfirm'))) {
                                                                cancelMutation.mutate(order.id);
                                                            }
                                                        }}
                                                        disabled={cancelMutation.isPending}
                                                    >
                                                        {cancelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('myOrders.cancelOrder')}
                                                    </Button>
                                                )}

                                                {order.status === 'CANCELLED' && (
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full h-12 rounded-none text-[9px] uppercase tracking-widest text-muted-foreground/40 hover:text-foreground transition-colors"
                                                        onClick={() => untrackOrder(order.id)}
                                                    >
                                                        {t('myOrders.removeHistory')}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );

                                    const TriggerButton = (
                                        <Button variant="ghost" className="h-8 px-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-primary/5 hover:text-[#C9A227] transition-colors rounded-none">
                                            {t('myOrders.viewDetails')} <ArrowRight className="h-3 w-3 rtl:rotate-180 rtl:mr-2 ltr:ml-2" />
                                        </Button>
                                    );

                                    if (isMobile) {
                                        return (
                                            <Drawer>
                                                <DrawerTrigger asChild>{TriggerButton}</DrawerTrigger>
                                                <DrawerContent className="bg-[#FAF7F2] max-h-[90vh]">
                                                    <div dir={locale === 'ar' ? 'ltr' : undefined} className={cn("w-full h-full pb-8", locale === 'ar' ? 'text-left' : 'text-start')}>
                                                        <DrawerHeader className={cn("pb-4 border-b border-primary/5", locale === 'ar' ? 'text-left' : 'text-start')}>
                                                            <DrawerTitle className={cn("font-serif text-2xl tracking-tight text-foreground flex items-center gap-2", locale === 'ar' ? 'text-left' : 'text-start')}>
                                                                {t('myOrders.orderDetails')}
                                                            </DrawerTitle>
                                                            <DrawerDescription className={cn("font-mono text-xs text-muted-foreground/80", locale === 'ar' ? 'text-left' : 'text-start')}>
                                                                ID: {order.id.toUpperCase()}
                                                            </DrawerDescription>
                                                        </DrawerHeader>
                                                        <div className="overflow-y-auto px-4">
                                                            {detailsContent}
                                                        </div>
                                                    </div>
                                                </DrawerContent>
                                            </Drawer>
                                        );
                                    }

                                    return (
                                        <Sheet>
                                            <SheetTrigger asChild>{TriggerButton}</SheetTrigger>
                                            <SheetContent className={cn("w-full sm:max-w-md overflow-y-auto bg-white/95 backdrop-blur-xl border-l-primary/10", locale === 'ar' ? 'text-left' : 'text-start')} side={locale === 'ar' ? 'left' : 'right'}>
                                                <div dir={locale === 'ar' ? 'ltr' : undefined} className={cn("h-full", locale === 'ar' ? 'text-left' : 'text-start')}>
                                                    <SheetHeader className={cn("pb-6 border-b border-primary/5", locale === 'ar' ? 'text-left' : 'text-start')}>
                                                        <SheetTitle className={cn("font-serif text-2xl tracking-tight text-foreground flex items-center gap-2", locale === 'ar' ? 'text-left' : 'text-start')}>
                                                            {t('myOrders.orderDetails')}
                                                        </SheetTitle>
                                                        <SheetDescription className={cn("font-mono text-xs text-muted-foreground/80", locale === 'ar' ? 'text-left' : 'text-start')}>
                                                            ID: {order.id.toUpperCase()}
                                                        </SheetDescription>
                                                    </SheetHeader>
                                                    {detailsContent}
                                                </div>
                                            </SheetContent>
                                        </Sheet>
                                    );
                                })()}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Clear history */}
            {orders && orders.length > 0 && (
                <div className="mt-20 text-center">
                    <button
                        onClick={() => orderIds.forEach(id => untrackOrder(id))}
                        className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground/20 hover:text-primary transition-all underline underline-offset-4"
                    >
                        {t('myOrders.clearHistory')}
                    </button>
                </div>
            )}
        </div>
    );
}
