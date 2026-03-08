"use client";

import * as React from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/i18n/provider";
import { cn } from "@/lib/utils";
 
interface ProductGalleryProps {
    images: string[];
    productName: string;
}
 
export function ProductGallery({ images, productName }: ProductGalleryProps) {
    const { t, locale } = useTranslation();
    const [mainViewportRef, emblaMainApi] = useEmblaCarousel({ 
        loop: true,
        direction: locale === 'ar' ? 'rtl' : 'ltr'
    });
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const [lightboxOpen, setLightboxOpen] = React.useState(false);

    const onSelect = React.useCallback(() => {
        if (!emblaMainApi) return;
        setSelectedIndex(emblaMainApi.selectedScrollSnap());
    }, [emblaMainApi]);

    React.useEffect(() => {
        if (!emblaMainApi) return;
        onSelect();
        emblaMainApi.on("select", onSelect);
        emblaMainApi.on("reInit", onSelect);
    }, [emblaMainApi, onSelect]);

    const scrollTo = React.useCallback(
        (index: number) => emblaMainApi && emblaMainApi.scrollTo(index),
        [emblaMainApi]
    );

    // Keyboard navigation for desktop
    React.useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (!emblaMainApi) return;
            if (e.key === "ArrowLeft") emblaMainApi.scrollPrev();
            if (e.key === "ArrowRight") emblaMainApi.scrollNext();
            if (e.key === "Escape") setLightboxOpen(false);
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [emblaMainApi]);

    return (
        <>
            {/* ── Main Carousel ─────────────────────────────────────────────── */}
            <div className="relative group w-full bg-[#F3EFE9] overflow-hidden" style={{ height: "72svh" }}>
                <div className="overflow-hidden h-full" ref={mainViewportRef}>
                    <div className="flex h-full touch-pan-y">
                        {images.map((img, index) => (
                            <div
                                key={index}
                                className="relative flex-[0_0_100%] min-w-0 h-full cursor-zoom-in"
                                onClick={() => setLightboxOpen(true)}
                                role="button"
                                aria-label={t('product.gallery.viewFullscreen', { index: index + 1 })}
                            >
                                <Image
                                    src={img}
                                    alt={`${productName} — image ${index + 1}`}
                                    fill
                                    priority={index === 0}
                                    loading={index === 0 ? "eager" : "lazy"}
                                    className="object-contain"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Dot Indicators (mobile) ─────────────────────────────── */}
                {images.length > 1 && (
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 md:hidden">
                        {images.map((_, i) => (
                            <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); scrollTo(i); }}
                                aria-label={t('product.gallery.goToImage', { index: i + 1 })}
                                className={cn(
                                    "rounded-full transition-all duration-300",
                                    i === selectedIndex
                                        ? "w-5 h-1.5 bg-[#C9A227]"
                                        : "w-1.5 h-1.5 bg-black/20"
                                )}
                            />
                        ))}
                    </div>
                )}

                {/* Counter pill */}
                {images.length > 1 && (
                    <div className="absolute top-5 right-5 md:hidden bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                        <span className="text-[10px] text-white/90 tracking-[0.15em] tabular-nums font-light">
                            {selectedIndex + 1} / {images.length}
                        </span>
                    </div>
                )}

                {/* Desktop Arrows (appear on hover) */}
                {images.length > 1 && (
                    <>
                        <button
                            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-white/90 hover:bg-white text-black shadow-sm transition-all opacity-0 group-hover:opacity-100 rounded-none"
                            onClick={() => emblaMainApi?.scrollPrev()}
                            aria-label={t('product.imagePrev')}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-white/90 hover:bg-white text-black shadow-sm transition-all opacity-0 group-hover:opacity-100 rounded-none"
                            onClick={() => emblaMainApi?.scrollNext()}
                            aria-label={t('product.imageNext')}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </>
                )}
            </div>

            {/* ── Desktop Thumbnails ─────────────────────────────────────── */}
            {images.length > 1 && (
                <div className="hidden md:grid grid-cols-4 lg:grid-cols-5 gap-2 mt-3">
                    {images.map((img, index) => (
                        <button
                            key={index}
                            className={cn(
                                "relative aspect-square overflow-hidden border-2 transition-all",
                                selectedIndex === index
                                    ? "border-[#C9A227]"
                                    : "border-transparent opacity-50 hover:opacity-80"
                            )}
                            onClick={() => scrollTo(index)}
                            aria-label={t('product.gallery.goToImage', { index: index + 1 })}
                        >
                            <Image
                                src={img}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="100px"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* ── Fullscreen Lightbox ────────────────────────────────────── */}
            {lightboxOpen && (
                <LightboxModal
                    images={images}
                    initialIndex={selectedIndex}
                    productName={productName}
                    onClose={() => setLightboxOpen(false)}
                    onIndexChange={setSelectedIndex}
                />
            )}
        </>
    );
}

/* ────────────────────────────────────────────────────────────────────────────
   Fullscreen Lightbox Modal
   ──────────────────────────────────────────────────────────────────────────── */
function LightboxModal({
    images,
    initialIndex,
    productName,
    onClose,
    onIndexChange,
}: {
    images: string[];
    initialIndex: number;
    productName: string;
    onClose: () => void;
    onIndexChange: (i: number) => void;
}) {
    const { t, locale } = useTranslation();
    const [viewportRef, emblaApi] = useEmblaCarousel({ 
        loop: true, 
        startIndex: initialIndex,
        direction: locale === 'ar' ? 'rtl' : 'ltr'
    });
    const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

    const onSelect = React.useCallback(() => {
        if (!emblaApi) return;
        const idx = emblaApi.selectedScrollSnap();
        setCurrentIndex(idx);
        onIndexChange(idx);
    }, [emblaApi, onIndexChange]);

    React.useEffect(() => {
        if (!emblaApi) return;
        emblaApi.on("select", onSelect);
    }, [emblaApi, onSelect]);

    // Trap keyboard focus & close on Escape
    React.useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") emblaApi?.scrollPrev();
            if (e.key === "ArrowRight") emblaApi?.scrollNext();
        };
        window.addEventListener("keydown", handleKey);
        // Prevent body scroll
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", handleKey);
            document.body.style.overflow = "";
        };
    }, [emblaApi, onClose]);

    return (
        <div
            className="fixed inset-0 z-[100] bg-black flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label={t('product.gallery.title', { name: productName })}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-safe py-4 text-white/60 shrink-0">
                <span className="text-[11px] uppercase tracking-[0.25em] font-light tabular-nums">
                    {currentIndex + 1} / {images.length}
                </span>
                <button
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                    aria-label={t('product.close')}
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Carousel */}
            <div className="flex-1 overflow-hidden" ref={viewportRef}>
                <div className="flex h-full touch-pan-y">
                    {images.map((img, i) => (
                        <div key={i} className="relative flex-[0_0_100%] min-w-0 h-full flex items-center justify-center p-4">
                            <div className="relative w-full h-full">
                                <Image
                                    src={img}
                                    alt={`${productName} — ${i + 1}`}
                                    fill
                                    className="object-contain"
                                    sizes="100vw"
                                    priority
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Dot indicators */}
            {images.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 py-5 shrink-0">
                    {images.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => emblaApi?.scrollTo(i)}
                            aria-label={t('product.gallery.goToImage', { index: i + 1 })}
                            className={cn(
                                "rounded-full transition-all duration-300",
                                i === currentIndex
                                    ? "w-5 h-1.5 bg-[#C9A227]"
                                    : "w-1.5 h-1.5 bg-white/25"
                            )}
                        />
                    ))}
                </div>
            )}

            {/* Desktop arrows */}
            {images.length > 1 && (
                <>
                    <button
                        className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 w-14 h-14 items-center justify-center text-white/40 hover:text-white transition-colors"
                        onClick={() => emblaApi?.scrollPrev()}
                        aria-label={t('product.imagePrev')}
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </button>
                    <button
                        className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 w-14 h-14 items-center justify-center text-white/40 hover:text-white transition-colors"
                        onClick={() => emblaApi?.scrollNext()}
                        aria-label={t('product.imageNext')}
                    >
                        <ChevronRight className="w-8 h-8" />
                    </button>
                </>
            )}
        </div>
    );
}
