import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Image as ImageIcon } from 'lucide-react';
import { ApiOrderItem, centsToMad } from '@/lib/types';

interface OrderItemsListProps {
    items: ApiOrderItem[];
    deliveryFee: number;
    total: number;
    /** If true, names become links to the product page (useful for Admin) */
    enableProductLinks?: boolean;
}

export function OrderItemsList({ items, deliveryFee, total, enableProductLinks = false }: OrderItemsListProps) {
    return (
        <div className="border border-primary/5 rounded-md divide-y divide-primary/5 bg-[#FAF7F2]/30">
            {items.map((item) => (
                <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-[#F3EFE9]/30 transition-colors">
                    {/* Thumbnail 48px */}
                    <div className="relative w-12 h-12 rounded-sm overflow-hidden bg-white flex-shrink-0 border border-primary/5">
                        {item.image ? (
                            <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-[#C9A227]/20">
                                <ImageIcon className="h-5 w-5" />
                            </div>
                        )}
                    </div>

                    {/* Middle: Name + Meta */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        {enableProductLinks && item.productId ? (
                            <Link
                                href={`/product/${item.productId}`}
                                target="_blank"
                                className="font-serif text-[14px] text-foreground leading-tight line-clamp-2 hover:text-[#C9A227] hover:underline underline-offset-4 decoration-[#C9A227]/30 transition-colors"
                            >
                                {item.name}
                            </Link>
                        ) : (
                            <span className="font-serif text-[14px] text-foreground leading-tight line-clamp-2">
                                {item.name}
                            </span>
                        )}
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">
                                Taille: <span className="text-foreground font-bold">{item.size ?? 'Unique'}</span>
                            </span>
                            <span className="text-[8px] text-muted-foreground/30">•</span>
                            <span className="text-[10px] uppercase tracking-widest text-[#C9A227] font-semibold">
                                Qté: {item.quantity}
                            </span>
                        </div>
                    </div>

                    {/* Right: Line Total */}
                    <div className="text-right whitespace-nowrap pl-2">
                        <span className="font-serif text-[14px] tracking-tight text-foreground">
                            {centsToMad(item.price * item.quantity)} <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 ml-0.5">MAD</span>
                        </span>
                    </div>
                </div>
            ))}
            <div className="p-4 bg-muted/20 flex justify-between text-xs text-muted-foreground">
                <span className="text-[11px] uppercase tracking-widest font-medium">Frais de livraison</span>
                <span className="font-serif text-[14px] tracking-tight text-foreground">
                    {centsToMad(deliveryFee)} <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 ml-0.5">MAD</span>
                </span>
            </div>
            <div className="p-4 bg-[#FAF7F2] flex justify-between items-baseline border-t border-primary/10">
                <span className="text-[11px] uppercase tracking-widest font-black text-foreground">Total</span>
                <span className="font-serif text-lg tracking-tight text-[#C9A227]">{centsToMad(total)} MAD</span>
            </div>
        </div>
    );
}
