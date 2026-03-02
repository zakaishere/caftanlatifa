"use client";

import * as React from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";

interface ProductGalleryProps {
    images: string[];
    productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
    const [mainViewportRef, emblaMainApi] = useEmblaCarousel({ loop: true });
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

    return (
        <div className="flex flex-col gap-4">
            {/* ── Main Carousel ─────────────────────────────────────────────── */}
            <div className="relative group w-full bg-[#F3EFE9] overflow-hidden aspect-square md:aspect-square h-[75vh] sm:h-[85vh] md:h-auto">
                <div className="overflow-hidden h-full" ref={mainViewportRef}>
                    <div className="flex h-full">
                        {images.map((img, index) => (
                            <div
                                key={index}
                                className="relative flex-[0_0_100%] min-w-0 h-full cursor-zoom-in"
                                onClick={() => setLightboxOpen(true)}
                            >
                                <Image
                                    src={img}
                                    alt={`${productName} - View ${index + 1}`}
                                    fill
                                    priority={index === 0}
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mobile: Image Counter (Lux detail) */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 md:hidden">
                    <div className="bg-black/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                        <span className="text-[10px] text-white/90 tracking-[0.2em] font-light">
                            {selectedIndex + 1} / {images.length}
                        </span>
                    </div>
                </div>

                {/* Desktop Arrows */}
                <button
                    className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-white/80 hover:bg-white text-black transition-all opacity-0 group-hover:opacity-100"
                    onClick={() => emblaMainApi?.scrollPrev()}
                    aria-label="Previous image"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                    className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-white/80 hover:bg-white text-black transition-all opacity-0 group-hover:opacity-100"
                    onClick={() => emblaMainApi?.scrollNext()}
                    aria-label="Next image"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>

                {/* Mobile: Expand Indicator */}
                <div className="absolute bottom-6 right-6 md:hidden">
                    <div className="bg-black/10 backdrop-blur-md p-2 rounded-full text-white/80 border border-white/10">
                        <Maximize2 className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* ── Desktop Thumbnails ─────────── */}
            <div className="hidden md:grid grid-cols-4 lg:grid-cols-5 gap-3">
                {images.map((img, index) => (
                    <button
                        key={index}
                        className={cn(
                            "relative aspect-square overflow-hidden border-2 transition-all",
                            selectedIndex === index ? "border-[#C9A227]" : "border-transparent opacity-60 hover:opacity-100"
                        )}
                        onClick={() => scrollTo(index)}
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

            {/* ── Fullscreen Lightbox Modal ───────────────────────────────── */}
            <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
                <DialogContent className="max-w-[100vw] w-full h-[100dvh] p-0 border-none bg-black rounded-none flex flex-col justify-center items-center gap-0">
                    <div className="absolute top-0 inset-x-0 h-16 flex items-center justify-between px-6 z-50">
                        <span className="text-white/60 text-[12px] uppercase tracking-[0.2em] font-light">
                            {selectedIndex + 1} / {images.length}
                        </span>
                        <DialogClose className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors focus:outline-none">
                            <X className="w-6 h-6" />
                        </DialogClose>
                    </div>

                    <LightboxCarousel
                        images={images}
                        initialIndex={selectedIndex}
                        onIndexChange={setSelectedIndex}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}

function LightboxCarousel({
    images,
    initialIndex,
    onIndexChange
}: {
    images: string[];
    initialIndex: number;
    onIndexChange: (index: number) => void;
}) {
    const [viewportRef, emblaApi] = useEmblaCarousel({
        loop: true,
        startIndex: initialIndex
    });

    const onSelect = React.useCallback(() => {
        if (!emblaApi) return;
        onIndexChange(emblaApi.selectedScrollSnap());
    }, [emblaApi, onIndexChange]);

    React.useEffect(() => {
        if (!emblaApi) return;
        emblaApi.on("select", onSelect);
    }, [emblaApi, onSelect]);

    return (
        <div className="relative w-full h-full overflow-hidden">
            <div className="h-full overflow-hidden" ref={viewportRef}>
                <div className="flex h-full items-center">
                    {images.map((img, index) => (
                        <div key={index} className="relative flex-[0_0_100%] min-w-0 h-full flex items-center justify-center p-4">
                            <div className="relative w-full h-full max-h-[85vh]">
                                <Image
                                    src={img}
                                    alt=""
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

            {/* Lightbox Navigation (Desktop) */}
            <button
                className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 w-14 h-14 items-center justify-center text-white/40 hover:text-white transition-colors"
                onClick={() => emblaApi?.scrollPrev()}
            >
                <ChevronLeft className="w-8 h-8" />
            </button>
            <button
                className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 w-14 h-14 items-center justify-center text-white/40 hover:text-white transition-colors"
                onClick={() => emblaApi?.scrollNext()}
            >
                <ChevronRight className="w-8 h-8" />
            </button>
        </div>
    );
}
