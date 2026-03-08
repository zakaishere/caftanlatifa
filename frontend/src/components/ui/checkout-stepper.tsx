"use client";

import { Check, ShoppingCart, CreditCard, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/i18n/provider";
import { cn } from "@/lib/utils";
 
interface CheckoutStepperProps {
    currentStep: "cart" | "checkout" | "success";
}
 
export function CheckoutStepper({ currentStep }: CheckoutStepperProps) {
    const { t } = useTranslation();
    const steps = [
        { id: "cart", label: t('checkout.steps.cart') },
        { id: "checkout", label: t('checkout.steps.shipping') },
        { id: "success", label: t('checkout.steps.done') },
    ];

    const getStepStatus = (stepId: string) => {
        const stepOrder = ["cart", "checkout", "success"];
        const currentIndex = stepOrder.indexOf(currentStep);
        const stepIndex = stepOrder.indexOf(stepId);

        if (stepIndex < currentIndex) return "completed";
        if (stepIndex === currentIndex) return "current";
        return "upcoming";
    };

    return (
        <div className="w-full max-w-sm mx-auto mb-8 px-4">
            <div className="relative flex items-center justify-between">
                {/* Connecting Lines Backend */}
                <div className="absolute left-0 top-[18px] w-full h-[2px] bg-slate-100 -z-10" />

                {/* Connecting Lines Active */}
                <div
                    className="absolute left-0 top-[18px] h-[2px] bg-primary transition-all duration-1000 ease-in-out -z-10"
                    style={{
                        width:
                            currentStep === "cart"
                                ? "0%"
                                : currentStep === "checkout"
                                    ? "50%"
                                    : "100%",
                    }}
                />

                {/* Steps */}
                {steps.map((step) => {
                    const status = getStepStatus(step.id);

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-2 relative">
                            <div
                                className={cn(
                                    "w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all duration-700 ease-out bg-white",
                                    status === "completed"
                                        ? "border-primary text-primary shadow-lg shadow-primary/5"
                                        : status === "current"
                                            ? "border-primary text-primary shadow-xl shadow-primary/10"
                                            : "border-slate-100 text-slate-300"
                                )}
                            >
                                {status === "completed" ? (
                                    <Check className="w-4 h-4" strokeWidth={3} />
                                ) : (
                                    <div className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        status === "current" ? "bg-primary animate-pulse" : "bg-slate-200"
                                    )} />
                                )}
                            </div>
                            <span
                                className={cn(
                                    "text-[9px] font-black uppercase tracking-[0.15em] transition-colors duration-500",
                                    status === "current"
                                        ? "text-primary"
                                        : status === "completed"
                                            ? "text-slate-900"
                                            : "text-slate-300"
                                )}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
