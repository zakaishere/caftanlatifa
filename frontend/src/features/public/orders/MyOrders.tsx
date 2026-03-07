"use client";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMyOrders } from '@/hooks/useMyOrders';
import { apiRequest } from '@/lib/queryClient';
import { ApiOrder, centsToMad, ApiInitData } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ArrowRight, MessageSquare, Clipboard, Check, XCircle, Clock, CheckCircle2, Truck, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
    const queryClient = useQueryClient();
    const [copiedId, setCopiedId] = useState<string | null>(null);

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
            toast.success("Commande annulée", {
                description: `La commande ${orderId.split('-')[0].toUpperCase()} a été annulée.`,
            });
        },
        onError: (error: any) => {
            toast.error("Échec de l'annulation", {
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
                toast.success(`${data.length} commande(s) trouvée(s)`);
                setSearchQuery('');
            } else {
                toast.error("Aucune commande trouvée");
            }
        } catch (error: any) {
            toast.error("Erreur de recherche", { description: error.message });
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
            toast.success("Copié ✅");
            setTimeout(() => setCopiedId(null), 1500);
        });
    };

    if (orderIds.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center min-h-[70vh]">
                <div className="h-20 w-20 bg-primary/5 flex items-center justify-center mb-8 border border-primary/10">
                    <Search className="h-8 w-8 text-primary/30" strokeWidth={1} />
                </div>
                <h1 className="font-serif text-3xl mb-4 tracking-tight">Suivre une commande</h1>
                <p className="text-muted-foreground text-[11px] uppercase tracking-[0.2em] mb-12 max-w-xs font-light">
                    Entrez votre référence ou numéro de téléphone pour voir l'état de votre colis.
                </p>
                <form onSubmit={handleSearch} className="w-full max-w-sm space-y-4">
                    <Input
                        placeholder="Référence ou Téléphone"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-14 rounded-none border-primary/10 text-center"
                    />
                    <Button type="submit" disabled={isSearching} className="w-full h-14 rounded-none bg-black text-white hover:bg-primary uppercase tracking-[0.3em] font-bold text-[10px]">
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rechercher"}
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
                <span className="text-[10px] uppercase tracking-[0.4em] text-primary mb-3">Votre Historique</span>
                <h1 className="font-serif text-3xl md:text-5xl text-foreground tracking-tight mb-4">Mes Commandes</h1>
                <div className="h-[1px] w-12 bg-primary/30" />
            </div>

            {/* ── Search Bar (Compact) ───────────────────────────────── */}
            <div className="mb-10 max-w-md mx-auto">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                        placeholder="ID ou Téléphone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-12 bg-white/80 border-primary/5 rounded-none text-xs"
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

                    return (
                        <div key={order.id} className="bg-white border border-primary/10 shadow-sm overflow-hidden group">

                            {/* Header: 2 Lines Responsive Layout */}
                            <div className="p-4 md:p-6 bg-[#F9F7F4]/50 border-b border-primary/5">
                                {/* Line 1: Ref & Status */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40 font-bold">Réf.</span>
                                        <span className="font-mono font-bold text-[13px] md:text-base tracking-tight">
                                            #{truncateRef(order.id.split('-')[0].toUpperCase())}
                                        </span>
                                    </div>
                                    <Badge className={cn("rounded-none px-2 py-0.5 text-[9px] font-black tracking-[0.1em] border shadow-none", status.color)}>
                                        {status.label}
                                    </Badge>
                                </div>

                                {/* Line 2: Date & Copy Button */}
                                <div className="flex items-center justify-between">
                                    <time className="text-[11px] text-muted-foreground font-medium">
                                        {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </time>
                                    <button
                                        onClick={() => copyToClipboard(order.id)}
                                        className="h-7 w-7 flex items-center justify-center border border-primary/10 text-muted-foreground/40 hover:text-primary transition-colors active:scale-90"
                                        aria-label="Copier la référence complète"
                                    >
                                        {copiedId === order.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Clipboard className="h-3 w-3" />}
                                    </button>
                                </div>
                            </div>

                            {/* Body: Compact Items (Text-Only) */}
                            <div className="p-4 md:p-6 divide-y divide-primary/5">
                                {order.items.map((item) => (
                                    <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-serif text-[15px] text-foreground leading-snug truncate">
                                                {item.name}
                                            </h3>
                                            <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mt-1 font-medium italic">
                                                {item.quantity} × {centsToMad(item.price)} MAD
                                            </p>
                                            <p className="text-[9px] uppercase tracking-widest text-muted-foreground/40 mt-0.5 font-medium">
                                                {item.size ?? 'Taille unique'}
                                            </p>
                                        </div>
                                        <span className="font-medium text-[13px] tracking-tight text-foreground whitespace-nowrap mt-1">
                                            {centsToMad(item.price * item.quantity)} MAD
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Total Row */}
                            <div className="px-4 py-3 md:px-6 md:py-4 bg-[#FAF7F2]/20 flex justify-between items-baseline border-t border-primary/5">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-medium italic">
                                    Total à la livraison
                                </span>
                                <span className="font-serif text-lg text-[#C9A227] tracking-tight">
                                    {centsToMad(order.total)} MAD
                                </span>
                            </div>

                            {/* Actions Row: Responsive Stacking */}
                            <div className="p-4 md:p-6 pt-2 flex flex-col min-[361px]:flex-row gap-2">
                                <Link
                                    href={`https://wa.me/${settings?.whatsappNumber?.replace(/\+/g, '') || '212600000000'}?text=${encodeURIComponent(`Bonjour, suivi commande #${order.id.split('-')[0].toUpperCase()}`)}`}
                                    className="flex-1"
                                    target="_blank"
                                >
                                    <Button className="w-full h-11 rounded-none bg-black text-white hover:bg-[#C9A227] text-[10px] font-bold uppercase tracking-[0.2em] gap-2 shadow-lg shadow-black/5">
                                        <MessageSquare className="h-3.5 w-3.5" /> Assistance
                                    </Button>
                                </Link>

                                {order.status === 'PENDING' && (
                                    <Button
                                        variant="outline"
                                        className="h-11 rounded-none border-primary/10 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 hover:text-red-600 hover:border-red-100 min-[361px]:px-6"
                                        onClick={() => {
                                            if (confirm('Souhaitez-vous vraiment annuler ?')) {
                                                cancelMutation.mutate(order.id);
                                            }
                                        }}
                                        disabled={cancelMutation.isPending}
                                    >
                                        {cancelMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Annuler"}
                                    </Button>
                                )}

                                {order.status === 'CANCELLED' && (
                                    <Button
                                        variant="ghost"
                                        className="h-11 rounded-none text-[9px] uppercase tracking-widest text-muted-foreground/40"
                                        onClick={() => untrackOrder(order.id)}
                                    >
                                        Retirer de l'historique
                                    </Button>
                                )}
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
                        Vider l'historique local
                    </button>
                </div>
            )}
        </div>
    );
}
