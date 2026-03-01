"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/features/admin/auth/authContext";
import { CartProvider } from "@/features/public/cart/cartContext";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <AuthProvider>
                    <CartProvider>
                        {children}
                    </CartProvider>
                    <Toaster />
                </AuthProvider>
            </TooltipProvider>
        </QueryClientProvider>
    );
}
