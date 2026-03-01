"use client";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMyOrders } from '@/hooks/useMyOrders';
import { apiRequest } from '@/lib/queryClient';
import { ApiOrder, centsToMad } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, PackageX, ShoppingBag, Clock, CheckCircle2, Truck, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

const statusConfig = {
    PENDING: { color: 'bg-amber-50 text-amber-800 border-amber-100', icon: Clock, label: 'En attente' },
    CONFIRMED: { color: 'bg-blue-50 text-blue-800 border-blue-100', icon: CheckCircle2, label: 'Confirmée' },
    DELIVERED: { color: 'bg-emerald-50 text-emerald-800 border-emerald-100', icon: Truck, label: 'Livrée' },
    CANCELLED: { color: 'bg-red-50 text-red-800 border-red-100', icon: XCircle, label: 'Annulée' },
};

export default function MyOrders() {
    const { orderIds, trackOrder, untrackOrder } = useMyOrders();
    const queryClient = useQueryClient();

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
        onSuccess: (data, orderId) => {
            queryClient.invalidateQueries({ queryKey: ['/api/public/orders'] });
            toast({
                title: "Commande annulée",
                description: `La commande ${orderId.split('-')[0]} a été annulée avec succès.`,
            });
        },
        onError: (error) => {
            toast({
                title: "Erreur d'annulation",
                description: error.message,
                variant: "destructive"
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
                // Track all matched orders so they appear in the list
                data.forEach((order: any) => {
                    trackOrder(order.id);
                });
                toast({
                    title: "Commandes trouvées",
                    description: `${data.length} commande(s) correspondant à votre recherche.`,
                });
                setSearchQuery('');
            } else {
                toast({
                    title: "Aucune commande trouvée",
                    description: "Aucune commande ne correspond à cet identifiant, numéro ou email.",
                    variant: "destructive"
                });
            }
        } catch (error: any) {
            toast({
                title: "Échec de la recherche",
                description: error.message || "Une erreur est survenue lors de la recherche.",
                variant: "destructive"
            });
        } finally {
            setIsSearching(false);
        }
    };

    if (orderIds.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center min-h-[60vh] max-w-4xl mx-auto bg-background">
                <div className="space-y-4 w-full">
                    <div className="h-24 w-24 rounded-none bg-primary/5 flex items-center justify-center mx-auto mb-10 border border-primary/10">
                        <ShoppingBag className="h-10 w-10 text-primary/30 stroke-1" />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.4em] text-primary">Suivi Direct</span>
                    <h1 className="font-serif text-3xl md:text-5xl text-foreground tracking-tight mb-6">Suivre votre commande</h1>
                    <p className="text-muted-foreground max-w-md mx-auto mb-12 font-light leading-relaxed text-sm">
                        Saisissez votre ID de commande, numéro de téléphone ou email pour suivre l'état de votre livraison en temps réel.
                    </p>

                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto mb-16">
                        <div className="relative flex-1 group">
                            <Input
                                placeholder="ID, Téléphone ou Email"
                                value={searchQuery}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                                className="h-14 pl-6 bg-white border-primary/10 rounded-none focus-visible:ring-primary/20 transition-all font-medium"
                            />
                        </div>
                        <Button type="submit" size="lg" disabled={isSearching || searchQuery.length < 3} className="h-14 px-10 text-[11px] uppercase tracking-[0.3em] font-bold rounded-none bg-black text-white hover:bg-primary shadow-2xl shadow-primary/20 active:scale-95 transition-all">
                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Rechercher
                        </Button>
                    </form>
                </div>

                <div className="pt-12 border-t border-primary/5 w-full max-w-md text-center">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-6">Souhaitez-vous découvrir nos nouveautés ?</p>
                    <Link href="/products">
                        <span className="text-xs uppercase tracking-[0.3em] text-foreground hover:text-primary transition-colors border-b border-primary/20 pb-1">
                            Parcourir la collection
                        </span>
                    </Link>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center py-20 min-h-[50vh] items-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
            </div>
        );
    }

    if (!orders || orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center min-h-[50vh] max-w-4xl mx-auto bg-background">
                <PackageX className="h-16 w-16 text-primary/20 mb-6 stroke-1" />
                <h1 className="font-serif text-2xl mb-4">Commandes introuvables</h1>
                <p className="text-muted-foreground max-w-md mb-10 text-sm font-light">
                    Nous n'avons pas pu trouver les commandes suivies. Elles ont peut-être été archivées.
                </p>
                <Button variant="outline" className="rounded-none border-primary/10 uppercase tracking-[0.2em] text-[10px]" onClick={() => orderIds.forEach(id => untrackOrder(id))}>
                    Effacer les données de suivi
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-16 py-12 bg-background">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div className="space-y-4">
                    <span className="text-[10px] uppercase tracking-[0.4em] text-primary">Maison Caftan Latifa</span>
                    <h1 className="font-serif text-4xl md:text-5xl text-foreground tracking-tight text-balance">Mes Commandes</h1>
                    <p className="text-muted-foreground font-light text-sm">Suivi en temps réel de vos pièces d'exception.</p>
                </div>

                <form onSubmit={handleSearch} className="flex gap-4 w-full md:w-auto md:min-w-[420px]">
                    <div className="relative flex-1 group">
                        <Input
                            placeholder="ID, Téléphone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-14 bg-white border-primary/10 rounded-none focus-visible:ring-primary/20 transition-all font-medium text-[13px]"
                        />
                    </div>
                    <Button type="submit" disabled={isSearching || searchQuery.length < 3} className="h-14 px-8 text-[10px] uppercase tracking-[0.3em] font-bold rounded-none bg-black text-white hover:bg-primary shadow-2xl shadow-primary/10 active:scale-95 transition-all">
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Chercher
                    </Button>
                </form>
            </div>

            <div className="space-y-12">
                {orders.map((order) => {
                    const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.PENDING;
                    const StatusIcon = status.icon;

                    return (
                        <div key={order.id} className="bg-white border border-primary/10 shadow-2xl shadow-primary/5 transition-all">
                            <div className="bg-primary/5 border-b border-primary/10 p-8 md:p-10">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
                                    <div className="space-y-2">
                                        <h2 className="font-serif text-2xl text-foreground tracking-tight">
                                            Commande <span className="text-primary tracking-tighter ml-2">#{order.id.split('-')[0].toUpperCase()}</span>
                                        </h2>
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
                                            Passée le {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="flex items-center">
                                        <div className={`flex items-center gap-3 px-5 py-2.5 border ${status.color.split(' ').pop()} ${status.color.includes('bg-') ? status.color.split(' ')[0] : ''} rounded-none`}>
                                            <StatusIcon className="h-4 w-4" />
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{status.label}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="divide-y divide-primary/5">
                                {order.items.map((item) => (
                                    <div key={item.id} className="p-8 px-10 flex items-center justify-between group hover:bg-primary/[0.01] transition-colors">
                                        <div className="space-y-1">
                                            <p className="font-serif text-lg text-foreground group-hover:text-primary transition-colors">{item.name}</p>
                                            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">Quantité: {item.quantity}</p>
                                        </div>
                                        <p className="font-medium text-foreground tracking-tight text-lg">
                                            {centsToMad(item.price * item.quantity)} MAD
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-primary/[0.02] p-8 md:p-10 border-t border-primary/10 flex flex-col sm:flex-row justify-between items-center gap-10">
                                <div className="flex flex-col items-center sm:items-start">
                                    <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/40 mb-2">Total (Paiement à la livraison)</span>
                                    <span className="font-serif text-3xl text-primary tracking-tighter">{centsToMad(order.total)} MAD</span>
                                </div>

                                <div className="flex items-center gap-6">
                                    {order.status === 'PENDING' && (
                                        <button
                                            className="text-[10px] uppercase tracking-[0.2em] text-red-800/40 hover:text-red-800 transition-colors flex items-center gap-2"
                                            onClick={() => {
                                                if (confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
                                                    cancelMutation.mutate(order.id);
                                                }
                                            }}
                                            disabled={cancelMutation.isPending}
                                        >
                                            {cancelMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                                            Annuler
                                        </button>
                                    )}
                                    {order.status === 'CANCELLED' && (
                                        <button className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-foreground" onClick={() => untrackOrder(order.id)}>
                                            Retirer du suivi
                                        </button>
                                    )}
                                    <Link href={`https://wa.me/212600000000?text=${encodeURIComponent(`Bonjour, je souhaite avoir des informations sur ma commande #${order.id.split('-')[0].toUpperCase()}`)}`} target="_blank">
                                        <Button variant="outline" size="lg" className="h-14 px-10 rounded-none font-bold border-primary/10 text-foreground hover:bg-primary/5 transition-all text-[11px] uppercase tracking-[0.2em]">
                                            Assistance
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
