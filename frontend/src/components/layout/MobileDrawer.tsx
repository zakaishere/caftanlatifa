"use client";

import {
    useEffect,
    useRef,
    useCallback,
    useState,
    memo,
    useMemo,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { X } from "lucide-react";

// ─── prefers-reduced-motion ───────────────────────────────────────────────────
// Read once at module level — no hook needed, value never changes mid-session.
const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ─── Animation Variants ───────────────────────────────────────────────────────
// GPU rule: animate ONLY transform (translateX) and opacity.
// translate3d string forces hardware compositing on every browser.
// Removed backdrop-filter from overlay — it causes per-frame compositing cost.

const PANEL_VARIANTS: Variants = prefersReducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
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
                duration: 0.26,
                ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
            },
        },
    };

const OVERLAY_VARIANTS: Variants = prefersReducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: {
            opacity: 0,
            transition: { duration: 0.15, ease: "easeIn" as const },
        },
        visible: {
            opacity: 1,
            transition: { duration: 0.18, ease: "easeOut" as const },
        },
    };

// ─── Constants ────────────────────────────────────────────────────────────────

const CLOSE_ANIMATION_MS = prefersReducedMotion ? 0 : 230;

const NAV_LINKS = [
    { href: "/", label: "Accueil" },
    { href: "/products", label: "Collections" },
    { href: "/cart", label: "Mon Panier" },
    { href: "/contact", label: "Contact" },
    { href: "/orders", label: "Mes Commandes" },
];

// ─── Scroll lock helper ───────────────────────────────────────────────────────
// Uses overflow:hidden + padding compensation — avoids position:fixed which
// triggers a full layout+paint on body (expensive on mobile).
function lockScroll() {
    const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
}
function unlockScroll() {
    document.body.style.paddingRight = "";
    document.body.style.overflow = "";
    document.body.style.touchAction = "";
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface MobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    pathname: string;
    storeName?: string;
}

// ─── Inner panel — memoized so parent re-renders don't repaint it ─────────────
const DrawerPanel = memo(function DrawerPanel({
    storeName,
    pathname,
    onClose,
    onNavClick,
    panelRef,
}: {
    storeName: string;
    pathname: string;
    onClose: () => void;
    onNavClick: (href: string) => void;
    panelRef: React.RefObject<HTMLDivElement | null>;
}) {
    return (
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
                height: "100dvh",
                zIndex: 9999,
                width: "min(300px, 85vw)",
                // Explicitly declare will-change so browser promotes the layer
                // BEFORE the animation starts (no promotion jank on first frame).
                willChange: "transform",
                outline: "none",
                // CSS containment: tell the browser this subtree is isolated.
                // Prevents layout/style recalcs from propagating out.
                contain: "layout style paint",
            }}
            className="flex flex-col bg-background border-r border-border/40 shadow-lg overscroll-contain overflow-y-auto"
        >
            {/* Header */}
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

            {/* Decorative divider */}
            <div className="mx-6 mb-6 flex items-center gap-3 flex-shrink-0">
                <div className="h-px flex-1 bg-primary/20" />
                <div className="h-1 w-1 rounded-full bg-primary/40" />
                <div className="h-px flex-1 bg-primary/20" />
            </div>

            {/* Navigation */}
            <nav className="flex flex-col flex-1 px-4 gap-1" role="navigation">
                {NAV_LINKS.map(({ href, label }) => {
                    const active = pathname === href;
                    return (
                        <button
                            key={href}
                            onClick={() => onNavClick(href)}
                            className={[
                                "text-left w-full px-4 py-3.5 rounded-sm",
                                "text-[15px] font-light transition-colors duration-150",
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

            {/* Footer */}
            <div
                className="px-6 pt-6 mt-auto flex-shrink-0 border-t border-border/30"
                style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
            >
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60 font-light">
                    L'élégance du Caftan Marocain
                </p>
            </div>
        </motion.div>
    );
});

// ─── Main component ───────────────────────────────────────────────────────────

export function MobileDrawer({
    isOpen,
    onClose,
    pathname,
    storeName = "Caftan Latifa",
}: MobileDrawerProps) {
    const router = useRouter();
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    // Portal target — set once on client, never triggers re-render again.
    const [portalTarget, setPortalTarget] = useState<Element | null>(null);
    useEffect(() => {
        setPortalTarget(document.body);
    }, []);

    // Scroll lock — overflow:hidden approach (no position:fixed reflow).
    useEffect(() => {
        if (isOpen) {
            lockScroll();
            return unlockScroll;
        }
    }, [isOpen]);

    // ESC key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown, { passive: true });
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Auto-focus panel when open
    useEffect(() => {
        if (isOpen) panelRef.current?.focus();
    }, [isOpen]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        };
    }, []);

    // Delayed navigation — stable reference so DrawerPanel never re-renders on parent changes
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

    // Stable onClose ref passed to memo'd panel — prevents re-render if parent re-renders
    const stableOnClose = useCallback(onClose, [onClose]);

    if (!portalTarget) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay — opacity only, NO backdrop-filter (biggest perf win) */}
                    <motion.div
                        key="mobile-drawer-overlay"
                        variants={OVERLAY_VARIANTS}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        aria-hidden="true"
                        onClick={stableOnClose}
                        style={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 9998,
                            // Solid semi-transparent color: zero compositing cost vs blur
                            backgroundColor: "rgba(11, 11, 11, 0.65)",
                            willChange: "opacity",
                        }}
                    />

                    {/* Panel — rendered as memoized child to prevent re-paints */}
                    <DrawerPanel
                        storeName={storeName}
                        pathname={pathname}
                        onClose={stableOnClose}
                        onNavClick={handleNavClick}
                        panelRef={panelRef}
                    />
                </>
            )}
        </AnimatePresence>,
        portalTarget
    );
}
