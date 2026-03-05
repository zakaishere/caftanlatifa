"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { X } from "lucide-react";

// ─── Animation Variants ───────────────────────────────────────────────────────

const PANEL_VARIANTS: Variants = {
    hidden: {
        x: "-100%",
        transition: {
            duration: 0.22,
            ease: [0.72, 0, 0.28, 1] as [number, number, number, number],
        },
    },
    visible: {
        x: "0%",
        transition: {
            duration: 0.28,
            ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
        },
    },
};

const OVERLAY_VARIANTS: Variants = {
    hidden: {
        opacity: 0,
        transition: { duration: 0.18, ease: "easeIn" as const },
    },
    visible: {
        opacity: 1,
        transition: { duration: 0.2, ease: "easeOut" as const },
    },
};

// ─── Constants ────────────────────────────────────────────────────────────────

/** How long (ms) to wait for the close animation before navigating. */
const CLOSE_ANIMATION_MS = 230;

const NAV_LINKS = [
    { href: "/", label: "Accueil" },
    { href: "/products", label: "Collections" },
    { href: "/cart", label: "Mon Panier" },
    { href: "/contact", label: "Contact" },
    { href: "/orders", label: "Mes Commandes" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface MobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    pathname: string;
    storeName?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MobileDrawer({
    isOpen,
    onClose,
    pathname,
    storeName = "Caftan Latifa",
}: MobileDrawerProps) {
    const router = useRouter();
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    // ── Portal: only mount on client (document.body is unavailable on SSR) ──────
    const [portalTarget, setPortalTarget] = useState<Element | null>(null);
    useEffect(() => {
        setPortalTarget(document.body);
    }, []);

    // ── Body scroll lock ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        const scrollY = window.scrollY;
        document.body.style.overflow = "hidden";
        document.body.style.position = "fixed";
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = "100%";
        return () => {
            document.body.style.overflow = "";
            document.body.style.position = "";
            document.body.style.top = "";
            document.body.style.width = "";
            window.scrollTo(0, scrollY);
        };
    }, [isOpen]);

    // ── ESC key ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // ── Auto-focus panel when open ──────────────────────────────────────────────
    useEffect(() => {
        if (isOpen && panelRef.current) {
            panelRef.current.focus();
        }
    }, [isOpen]);

    // ── Cleanup timer on unmount ──────────────────────────────────────────────
    useEffect(() => {
        return () => {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        };
    }, []);

    // ── Delayed navigation ──────────────────────────────────────────────────────
    const handleNavClick = useCallback(
        (href: string) => {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
            onClose();
            closeTimerRef.current = setTimeout(() => {
                router.push(href);
            }, CLOSE_ANIMATION_MS);
        },
        [onClose, router]
    );

    const isActive = (href: string) => pathname === href;

    // Don't render until client is ready (avoids SSR mismatch)
    if (!portalTarget) return null;

    // ── Render into document.body — escapes ALL stacking contexts ──────────────
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* ── Overlay ─────────────────────────────────────────────── */}
                    <motion.div
                        key="mobile-drawer-overlay"
                        variants={OVERLAY_VARIANTS}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        aria-hidden="true"
                        onClick={onClose}
                        style={{
                            position: "fixed",
                            inset: 0,
                            // 9998 beats every z-index in the layout (header z-40, bottom nav z-50)
                            zIndex: 9998,
                            backgroundColor: "rgba(0,0,0,0.6)",
                            backdropFilter: "blur(2px)",
                            WebkitBackdropFilter: "blur(2px)",
                            willChange: "opacity",
                        }}
                    />

                    {/* ── Panel ───────────────────────────────────────────────── */}
                    <motion.div
                        key="mobile-drawer-panel"
                        ref={panelRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Menu de navigation"
                        tabIndex={-1}
                        variants={PANEL_VARIANTS}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            // Use 100dvh so it works correctly on iOS Safari address-bar collapse
                            height: "100dvh",
                            zIndex: 9999,
                            width: "min(300px, 85vw)",
                            willChange: "transform",
                            outline: "none",
                        }}
                        className="flex flex-col bg-background border-r border-border/40 shadow-2xl overscroll-contain overflow-y-auto"
                    >
                        {/* ── Header ──────────────────────────────────────────────── */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
                            <div className="flex flex-col gap-0.5">
                                <span className="font-serif text-xl tracking-tighter text-primary leading-none">
                                    {storeName}
                                </span>
                                <span className="text-[9px] uppercase tracking-[0.35em] text-muted-foreground font-light">
                                    Maison de Couture
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                aria-label="Fermer le menu"
                                className="h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* ── Decorative divider ───────────────────────────────────── */}
                        <div className="mx-6 mb-6 flex items-center gap-3 flex-shrink-0">
                            <div className="h-px flex-1 bg-primary/20" />
                            <div className="h-1 w-1 rounded-full bg-primary/40" />
                            <div className="h-px flex-1 bg-primary/20" />
                        </div>

                        {/* ── Navigation ──────────────────────────────────────────── */}
                        <nav className="flex flex-col flex-1 px-4 gap-1" role="navigation">
                            {NAV_LINKS.map(({ href, label }) => {
                                const active = isActive(href);
                                return (
                                    <button
                                        key={href}
                                        onClick={() => handleNavClick(href)}
                                        className={[
                                            "text-left w-full px-4 py-3.5 rounded-sm",
                                            "text-[15px] font-light transition-all duration-200",
                                            "border-l-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                            active
                                                ? "text-primary bg-primary/5 border-primary font-medium"
                                                : "text-foreground border-transparent hover:border-primary/30 hover:bg-muted/30 hover:text-primary/90",
                                        ].join(" ")}
                                        aria-current={active ? "page" : undefined}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </nav>

                        {/* ── Footer ──────────────────────────────────────────────── */}
                        <div
                            className="px-6 pt-6 mt-auto flex-shrink-0 border-t border-border/30"
                            style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
                        >
                            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60 font-light">
                                L'élégance du Caftan Marocain
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        portalTarget
    );
}
