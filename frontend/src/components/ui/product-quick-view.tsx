"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import { useQuery } from '@tanstack/react-query';
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
} from '@/components/ui/drawer';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    ShoppingCart, Minus, Plus, Check, Truck, ShieldCheck,
    RotateCcw, X, Image as ImageIcon, ChevronLeft, ChevronRight
} from 'lucide-react';
import { ApiProduct, ApiInitData, centsToMad, ProductSize } from '@/lib/types';
import { useCart } from '@/features/public/cart/cartContext';
import { cn } from '@/lib/utils';

// ─── Simple media query hook ──────────────────────────────────────────────────
function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
        const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
        handler(mql);
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
    const [addedToCart, setAddedToCart] = useState(false);
    const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
    const [sizeError, setSizeError] = useState(false);
    const isMobile = useIsMobile();

    const { data: initData } = useQuery<ApiInitData>({
        queryKey: ['/api/public/init'],
    });

    const handleOpenChange = (v: boolean) => {
        if (!v) { onClose(); setQuantity(1); setAddedToCart(false); setSelectedSize(null); setSizeError(false); }
    };

    const handleAddToCart = () => {
        if (!product) return;

        if (product.availableSizes && product.availableSizes.length > 0 && !selectedSize) {
            setSizeError(true);
            return;
        }

        setSizeError(false);
        addToCart(product, quantity, selectedSize);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    const handleSizeSelect = (size: ProductSize) => {
        setSelectedSize(prev => prev === size ? null : size);
        if (sizeError) setSizeError(false);
    };

    if (!product) return null;

    const images = product.images?.length ? product.images : [];
    const subtotal = (product.price * quantity) / 100;

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={handleOpenChange}>
                <DrawerContent className="max-h-[96svh] outline-none flex flex-col rounded-t-[28px] bg-[#FAF7F2] border-0">
                    <DrawerTitle className="sr-only">{product.name}</DrawerTitle>
                    {/* Drag handle */}
                    <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                        <div className="h-1 w-10 bg-[#1A1A1A]/10 rounded-full" />
                    </div>
                    {/* Scrollable content */}
                    <div className="overflow-y-auto flex-1 overscroll-contain">
                        <MobileGallery images={images} productName={product.name} />
                        <MobileDetails
                            product={product}
                            initData={initData}
                            selectedSize={selectedSize}
                            sizeError={sizeError}
                            onSizeSelect={handleSizeSelect}
                        />
                    </div>
                    {/* Sticky bottom CTA */}
                    <div className="flex-shrink-0 bg-white border-t border-[#1A1A1A]/5 px-5 pt-3 pb-safe-5 pb-5">
                        <div className="flex items-center gap-4">
                            {/* Quantity */}
                            <div className="flex items-center border border-[#1A1A1A]/10 bg-[#FAF7F2]">
                                <button
                                    className="h-11 w-11 flex items-center justify-center text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors disabled:opacity-25"
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    disabled={quantity <= 1 || !product.inStock}
                                    aria-label="Diminuer"
                                >
                                    <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-9 text-center text-sm font-medium tabular-nums">{quantity}</span>
                                <button
                                    className="h-11 w-11 flex items-center justify-center text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors disabled:opacity-25"
                                    onClick={() => setQuantity(q => q + 1)}
                                    disabled={!product.inStock}
                                    aria-label="Augmenter"
                                >
                                    <Plus className="h-3 w-3" />
                                </button>
                            </div>
                            {/* Price */}
                            <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-[0.3em] text-[#1A1A1A]/30 leading-none mb-0.5">
                                    {quantity > 1 ? `×${quantity}` : 'Prix'}
                                </span>
                                <span className="font-serif text-[#C9A227] text-base leading-none">
                                    {subtotal.toFixed(0)} MAD
                                </span>
                            </div>
                            {/* CTA */}
                            <Button
                                className={cn(
                                    "flex-1 h-11 rounded-none text-[10px] uppercase tracking-[0.3em] font-bold transition-all duration-300 gap-2",
                                    addedToCart
                                        ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                        : "bg-[#C9A227] hover:bg-[#b8911f] text-black"
                                )}
                                onClick={handleAddToCart}
                                disabled={!product.inStock}
                            >
                                {addedToCart ? (
                                    <><Check className="h-3.5 w-3.5" /> Ajouté !</>
                                ) : (
                                    <><ShoppingCart className="h-3.5 w-3.5" /> Ajouter</>
                                )}
                            </Button>
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    // ─── Desktop: Dialog ──────────────────────────────────────────────────────
    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-4xl w-full p-0 gap-0 overflow-hidden rounded-2xl shadow-2xl border border-[#1A1A1A]/5 bg-[#FAF7F2]">
                <DialogTitle className="sr-only">{product.name}</DialogTitle>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 h-9 w-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center border border-[#1A1A1A]/10 shadow-sm hover:bg-white transition-colors"
                    aria-label="Fermer"
                >
                    <X className="h-4 w-4" />
                </button>
                <div className="grid grid-cols-2 min-h-0">
                    {/* Gallery side */}
                    <DesktopGallery images={images} productName={product.name} />
                    {/* Details side */}
                    <div className="flex flex-col overflow-y-auto max-h-[82vh] bg-white">
                        <MobileDetails
                            product={product}
                            initData={initData}
                            selectedSize={selectedSize}
                            sizeError={sizeError}
                            onSizeSelect={handleSizeSelect}
                        />
                        {/* Desktop quantity + CTA */}
                        <div className="mt-auto border-t border-[#1A1A1A]/5 p-8 space-y-5 bg-white">
                            <div className="flex items-center gap-6">
                                <span className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/35 font-medium w-20 shrink-0">Quantité</span>
                                <div className="flex items-center border border-[#1A1A1A]/10 bg-[#FAF7F2]">
                                    <button className="h-10 w-10 flex items-center justify-center text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors disabled:opacity-25"
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1 || !product.inStock}><Minus className="h-3 w-3" /></button>
                                    <span className="w-10 text-center text-sm font-medium tabular-nums">{quantity}</span>
                                    <button className="h-10 w-10 flex items-center justify-center text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors disabled:opacity-25"
                                        onClick={() => setQuantity(q => q + 1)} disabled={!product.inStock}><Plus className="h-3 w-3" /></button>
                                </div>
                            </div>
                            <Button
                                size="lg"
                                className={cn(
                                    "w-full h-14 rounded-none text-[11px] uppercase tracking-[0.4em] font-bold transition-all duration-300 gap-3",
                                    addedToCart
                                        ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                        : "bg-[#C9A227] hover:bg-[#b8911f] text-black shadow-lg shadow-[#C9A227]/20"
                                )}
                                onClick={handleAddToCart}
                                disabled={!product.inStock}
                            >
                                {addedToCart ? (
                                    <><Check className="h-4 w-4" /> Ajouté au Panier</>
                                ) : (
                                    <><ShoppingCart className="h-4 w-4" /> Ajouter au Panier</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/* ────────────────────────────────────────────────────────────────────────────
   Mobile Embla Gallery — full-width, tall, touch-swipeable
   ──────────────────────────────────────────────────────────────────────────── */
function MobileGallery({ images, productName }: { images: string[]; productName: string }) {
    const [viewportRef, emblaApi] = useEmblaCarousel({ loop: images.length > 1 });
    const [selectedIndex, setSelectedIndex] = useState(0);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', onSelect);
    }, [emblaApi, onSelect]);

    if (!images.length) {
        return (
            <div className="w-full bg-[#F3EFE9] flex items-center justify-center" style={{ height: '60svh' }}>
                <ImageIcon className="h-12 w-12 text-[#C9A227]/20" />
            </div>
        );
    }

    return (
        <div className="relative w-full bg-[#F3EFE9] overflow-hidden" style={{ height: '65svh' }}>
            <div className="overflow-hidden h-full touch-pan-y" ref={viewportRef}>
                <div className="flex h-full">
                    {images.map((img, i) => (
                        <div key={i} className="relative flex-[0_0_100%] min-w-0 h-full">
                            <Image
                                src={img}
                                alt={`${productName} — ${i + 1}`}
                                fill
                                priority={i === 0}
                                loading={i === 0 ? 'eager' : 'lazy'}
                                className="object-contain"
                                sizes="100vw"
                            />
                        </div>
                    ))}
                </div>
            </div>
            {/* Counter */}
            {images.length > 1 && (
                <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    <span className="text-[10px] text-white/90 tracking-[0.15em] tabular-nums font-light">
                        {selectedIndex + 1} / {images.length}
                    </span>
                </div>
            )}
            {/* Dot indicators */}
            {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                    {images.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => emblaApi?.scrollTo(i)}
                            aria-label={`Image ${i + 1}`}
                            className={cn(
                                "rounded-full transition-all duration-300",
                                i === selectedIndex ? "w-5 h-1.5 bg-[#C9A227]" : "w-1.5 h-1.5 bg-black/20"
                            )}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/* ────────────────────────────────────────────────────────────────────────────
   Desktop Gallery — static with arrow nav + thumbnails
   ──────────────────────────────────────────────────────────────────────────── */
function DesktopGallery({ images, productName }: { images: string[]; productName: string }) {
    const [active, setActive] = useState(0);
    const prev = () => setActive(i => (i === 0 ? images.length - 1 : i - 1));
    const next = () => setActive(i => (i === images.length - 1 ? 0 : i + 1));

    if (!images.length) {
        return (
            <div className="bg-[#F3EFE9] flex items-center justify-center aspect-square">
                <ImageIcon className="h-12 w-12 text-[#C9A227]/20" />
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-[#F3EFE9]">
            <div className="relative aspect-square overflow-hidden group">
                <Image
                    key={active}
                    src={images[active]}
                    alt={`${productName} — ${active + 1}`}
                    fill
                    priority
                    className="object-contain transition-opacity duration-300"
                    sizes="50vw"
                />
                {images.length > 1 && (
                    <>
                        <button onClick={prev} aria-label="Image précédente"
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button onClick={next} aria-label="Image suivante"
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </>
                )}
            </div>
            {images.length > 1 && (
                <div className="flex gap-2 p-3 bg-[#F3EFE9]/50">
                    {images.map((img, i) => (
                        <button key={i} onClick={() => setActive(i)} aria-label={`Image ${i + 1}`}
                            className={cn("relative flex-shrink-0 w-14 h-14 border-2 transition-all overflow-hidden",
                                i === active ? "border-[#C9A227]" : "border-transparent opacity-50 hover:opacity-80")}>
                            <Image src={img} alt="" fill className="object-cover" sizes="56px" loading="lazy" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ────────────────────────────────────────────────────────────────────────────
   Shared Details Section (no CTA — handled by parent)
   ──────────────────────────────────────────────────────────────────────────── */
interface MobileDetailsProps {
    product: ApiProduct;
    initData?: ApiInitData | null;
    selectedSize: ProductSize | null;
    sizeError: boolean;
    onSizeSelect: (size: ProductSize) => void;
}

function MobileDetails({ product, initData, selectedSize, sizeError, onSizeSelect }: MobileDetailsProps) {
    const specsEntries = product.specs ? Object.entries(product.specs) : [];

    return (
        <div className="px-6 pt-6 pb-4 space-y-5 bg-[#FAF7F2] md:bg-white">
            {/* Category + stock */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] uppercase tracking-[0.35em] font-semibold text-[#C9A227] border border-[#C9A227]/25 px-3 py-1 bg-[#C9A227]/5">
                    {product.category?.name}
                </span>
                {product.inStock ? (
                    <span className="text-[9px] uppercase tracking-[0.3em] font-medium text-emerald-600 border border-emerald-200 px-3 py-1 bg-emerald-50">
                        En stock
                    </span>
                ) : (
                    <span className="text-[9px] uppercase tracking-[0.3em] font-medium text-red-500 border border-red-200 px-3 py-1 bg-red-50">
                        Épuisé
                    </span>
                )}
            </div>

            {/* Name */}
            <h2 className="font-serif text-2xl md:text-3xl text-[#1A1A1A] tracking-tight leading-tight">
                {product.name}
            </h2>

            {/* Price */}
            <div className="flex items-baseline gap-3">
                <span className="font-serif text-xl text-[#C9A227]">
                    {centsToMad(product.price)} MAD
                </span>
                {initData?.settings?.standardDeliveryFee ? (
                    <span className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/30 font-light">
                        + {centsToMad(initData.settings.standardDeliveryFee)} livraison
                    </span>
                ) : null}
            </div>

            <div className="h-px w-10 bg-[#C9A227]/30" />

            {/* ── Size Selector ─────────────────────────────────── */}
            {product.availableSizes && product.availableSizes.length > 0 ? (
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-[#1A1A1A]/35 w-20 shrink-0">
                            Taille
                        </span>
                        {sizeError && !selectedSize && (
                            <span className="text-[9px] uppercase tracking-[0.2em] text-red-500 font-bold animate-pulse">
                                Veuillez sélectionner une taille
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {product.availableSizes.map((size) => (
                            <button
                                key={size}
                                type="button"
                                onClick={() => onSizeSelect(size)}
                                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all duration-200 ${selectedSize === size
                                    ? 'bg-[#C9A227] text-black border-[#C9A227] shadow-md shadow-[#C9A227]/20'
                                    : sizeError
                                        ? 'bg-red-50 text-red-500 border-red-200 hover:border-red-300'
                                        : 'bg-white text-[#1A1A1A]/60 border-[#1A1A1A]/10 hover:border-[#C9A227]/50 hover:text-[#C9A227]'
                                    }`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-4">
                    <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-[#1A1A1A]/35 w-20 shrink-0">
                        Taille
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 border border-[#1A1A1A]/10 px-3 py-1">
                        Taille unique
                    </span>
                </div>
            )}

            {/* Description */}
            <p className="text-[13px] leading-relaxed text-[#1A1A1A]/60 font-light tracking-wide">
                {product.description}
            </p>

            {/* Specs */}
            {specsEntries.length > 0 && (
                <div className="space-y-2 pt-1">
                    <p className="text-[9px] uppercase tracking-[0.3em] text-[#1A1A1A]/30 font-medium">Caractéristiques</p>
                    <div className="space-y-2">
                        {specsEntries.map(([key, val]) => (
                            <div key={key} className="flex justify-between text-[12px] border-b border-[#1A1A1A]/5 pb-2 last:border-0">
                                <span className="text-[#1A1A1A]/40 font-light">{key}</span>
                                <span className="font-medium text-[#1A1A1A]">{val}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Selling points */}
            <div className="grid grid-cols-2 gap-3 pt-1">
                {[
                    { Icon: ShoppingCart, label: "Paiement à la livraison" },
                    { Icon: Truck, label: "Livraison au Maroc" },
                    { Icon: ShieldCheck, label: "Qualité artisanale" },
                    { Icon: RotateCcw, label: "Retour sous 7 jours" },
                ].map(({ Icon, label }) => (
                    <div key={label} className="flex items-center gap-2">
                        <div className="w-6 h-6 flex items-center justify-center border border-[#C9A227]/20 rounded-full shrink-0">
                            <Icon className="h-2.5 w-2.5 text-[#C9A227]" />
                        </div>
                        <span className="text-[9px] uppercase tracking-[0.1em] text-[#1A1A1A]/45 leading-tight">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
