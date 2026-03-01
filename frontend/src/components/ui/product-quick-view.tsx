"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
} from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    ShoppingCart, Minus, Plus, ChevronLeft, ChevronRight,
    Check, Truck, ShieldCheck, RotateCcw, X, Image as ImageIcon,
    Package
} from 'lucide-react';
import { ApiProduct, ApiInitData, centsToMad } from '@/lib/types';
import { useCart } from '@/features/public/cart/cartContext';

// ─── Simple media query hook ──────────────────────────────────────────────────
function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
        const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
        handler(mql); // initial
        mql.addEventListener('change', handler as any);
        return () => mql.removeEventListener('change', handler as any);
    }, [breakpoint]);
    return isMobile;
}

interface ProductQuickViewProps {
    product: ApiProduct | null;
    open: boolean;
    onClose: () => void;
}

export function ProductQuickView({ product, open, onClose }: ProductQuickViewProps) {
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState(0);
    const [addedToCart, setAddedToCart] = useState(false);
    const isMobile = useIsMobile();

    const { data: initData } = useQuery<ApiInitData>({
        queryKey: ['/api/public/init'],
    });

    if (!product) return null;

    const hasImages = product.images && product.images.length > 0;
    const images = hasImages ? product.images : [];
    const priceMad = centsToMad(product.price);
    const isFreeShipping =
        initData?.settings?.freeShippingEnabled &&
        product.price >= (initData.settings.freeShippingThreshold || 0);

    const handleAddToCart = () => {
        addToCart(product, quantity);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    const prevImage = () => {
        setActiveImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };
    const nextImage = () => {
        setActiveImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const handleOpenChange = (v: boolean) => {
        if (!v) { onClose(); setActiveImage(0); setQuantity(1); setAddedToCart(false); }
    };

    const specsEntries = product.specs ? Object.entries(product.specs) : [];

    // ─── Shared content ───────────────────────────────────────────────────────
    const imageSection = (
        <div className="relative bg-slate-50">
            <div className="relative aspect-square overflow-hidden group">
                {hasImages ? (
                    <>
                        <Image
                            key={activeImage}
                            src={images[activeImage]}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover transition-transform duration-500 hover:scale-105"
                            priority
                        />
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center border border-slate-200 shadow-lg transition-all hover:bg-white active:scale-95"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center border border-slate-200 shadow-lg transition-all hover:bg-white active:scale-95"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                                {/* Dot indicators */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                    {images.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImage(idx)}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${activeImage === idx
                                                ? 'w-8 bg-primary shadow-sm shadow-primary/20'
                                                : 'w-2 bg-slate-400/50 hover:bg-slate-400'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full text-slate-300">
                        <ImageIcon className="h-20 w-20 mb-3 opacity-50" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">No Image Available</span>
                    </div>
                )}
                {!product.inStock && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-10">
                        <Badge variant="destructive" className="text-sm font-bold uppercase tracking-wider px-4 py-1.5 shadow-md">Sold Out</Badge>
                    </div>
                )}
            </div>

            {/* Thumbnails (desktop only) */}
            {!isMobile && images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto bg-muted/20 border-t border-border/30">
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveImage(idx)}
                            className={`relative flex-shrink-0 h-14 w-14 rounded-lg overflow-hidden border-2 transition-all duration-200 ${activeImage === idx
                                ? 'border-primary ring-2 ring-primary/30 scale-95'
                                : 'border-transparent hover:border-primary/50 opacity-70 hover:opacity-100'
                                }`}
                        >
                            <Image
                                src={img}
                                alt={`view ${idx + 1}`}
                                fill
                                sizes="56px"
                                className="object-cover"
                                loading="lazy"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    const detailsSection = (
        <div className="flex-1 p-6 md:p-8 space-y-6">
            {/* Category + badges */}
            <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
                    {product.category?.name}
                </span>

                {product.inStock ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        <Check className="h-3 w-3" /> In Stock
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        <Package className="h-3 w-3" /> Out of Stock
                    </span>
                )}

                {isFreeShipping && (
                    <Badge className="bg-blue-600 hover:bg-blue-600 text-white border-none text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                        Free Delivery
                    </Badge>
                )}
            </div>

            <h2 className="text-2xl md:text-3xl font-black leading-tight text-slate-900 tracking-tight">{product.name}</h2>

            <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-black text-primary tracking-tighter">{priceMad}</span>
                <span className="text-sm text-slate-400 font-bold uppercase tracking-widest">MAD</span>
            </div>

            <Separator className="bg-slate-100" />

            <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Description</p>
                <p className="text-base text-slate-600 leading-relaxed font-medium">{product.description}</p>
            </div>

            {specsEntries.length > 0 && (
                <>
                    <Separator className="bg-slate-100" />
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Specifications</p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                            {specsEntries.map(([key, val]) => (
                                <div key={key} className="flex flex-col gap-0.5">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{key}</span>
                                    <span className="text-sm font-bold text-slate-900">{val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            <Separator className="bg-slate-100" />
            <div className="grid grid-cols-3 gap-3 text-center">
                {[
                    { icon: Truck, label: 'Fast Delivery' },
                    { icon: ShieldCheck, label: 'Secure Order' },
                    { icon: RotateCcw, label: 'Easy Returns' },
                ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <Icon className="h-5 w-5 text-primary" />
                        <span className="text-[10px] text-slate-600 font-extrabold uppercase tracking-tight leading-none">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    const actionsSection = (
        <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/50 space-y-5">
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Quantity</span>
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <button
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            className="w-12 h-12 flex items-center justify-center hover:bg-slate-50 transition-colors active:scale-95 disabled:opacity-30"
                            disabled={quantity <= 1}
                        >
                            <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-12 text-center text-base font-black">{quantity}</span>
                        <button
                            onClick={() => setQuantity((q) => q + 1)}
                            className="w-12 h-12 flex items-center justify-center hover:bg-slate-50 transition-colors active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Subtotal</span>
                    <span className="font-black text-2xl tracking-tighter text-slate-900">{centsToMad(product.price * quantity)} MAD</span>
                </div>
            </div>

            <Button
                size="lg"
                className={`w-full h-14 font-black gap-3 text-lg rounded-2xl shadow-xl transition-all duration-500 active:scale-[0.98] ${addedToCart
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200'
                    : 'shadow-primary/20 hover:shadow-primary/30'
                    }`}
                disabled={!product.inStock}
                onClick={handleAddToCart}
            >
                {addedToCart ? (
                    <>
                        <Check className="h-6 w-6 animate-in zoom-in duration-300" />
                        Added to Cart!
                    </>
                ) : (
                    <>
                        <ShoppingCart className="h-6 w-6" />
                        {product.inStock ? `Add to Cart` : 'Out of Stock'}
                    </>
                )}
            </Button>
        </div>
    );

    // ─── Mobile: Drawer (slide up from bottom) ────────────────────────────────
    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={handleOpenChange}>
                <DrawerContent className="max-h-[92vh] outline-none flex flex-col rounded-t-[2rem]">
                    <DrawerTitle className="sr-only">{product.name}</DrawerTitle>
                    {/* Swipe handle */}
                    <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                        <div className="h-1 w-10 bg-slate-200 rounded-full" />
                    </div>
                    {/* Scrollable content */}
                    <div className="overflow-y-auto flex-1 overscroll-contain">
                        {imageSection}
                        {detailsSection}
                    </div>
                    {/* Sticky CTA at bottom */}
                    {actionsSection}
                </DrawerContent>
            </Drawer>
        );
    }

    // ─── Desktop: Dialog (centered) ───────────────────────────────────────────
    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-4xl w-full p-0 gap-0 overflow-hidden rounded-2xl shadow-2xl border-border/40">
                <DialogTitle className="sr-only">{product.name}</DialogTitle>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center border border-border shadow-sm hover:bg-muted transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="grid grid-cols-2 min-h-0">
                    <div className="flex flex-col">{imageSection}</div>
                    <div className="flex flex-col overflow-y-auto max-h-[80vh]">
                        {detailsSection}
                        {actionsSection}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
