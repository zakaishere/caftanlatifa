"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/features/public/cart/cartContext';
import { useQuery } from '@tanstack/react-query';
import { ApiInitData } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2, Truck, Wallet, ArrowLeft, Loader2, Store,
  MessageCircle, ChevronDown, ChevronUp, ShoppingBag, CreditCard, Clipboard, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { CheckoutStepper } from '@/components/ui/checkout-stepper';
import { apiRequest } from '@/lib/queryClient';
import { centsToMad } from '@/lib/types';
import { useMyOrders } from '@/hooks/useMyOrders';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/provider';

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

const getBaseFormSchema = (t: (key: string) => string) => z.object({
  fullName: z.string().min(2, t('checkout.validation.fullName')),
  email: z.string().email(t('checkout.validation.email')).optional().or(z.literal('')),
  phone: z.string().min(10, t('checkout.validation.phone')),
  deliveryMethod: z.enum(['DELIVERY', 'PICKUP']),
  city: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

const getFormSchema = (t: (key: string) => string) => getBaseFormSchema(t).superRefine((data, ctx) => {
  if (data.deliveryMethod === 'DELIVERY') {
    if (!data.city || data.city.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('checkout.validation.city'), path: ['city'] });
    }
    if (!data.address || data.address.length < 5) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('checkout.validation.address'), path: ['address'] });
    }
  }
});

type FormValues = z.infer<ReturnType<typeof getBaseFormSchema>>;

export default function Checkout() {
  const { t } = useTranslation();
  const { items, cartTotal, clearCart } = useCart();
  const { trackOrder } = useMyOrders();
  const { data } = useQuery<ApiInitData>({ queryKey: ['/api/public/init'] });
  const settings = data?.settings;
  const isMobile = useIsMobile();

  const shippingTotal = (settings?.freeShippingEnabled && cartTotal >= (settings?.freeShippingThreshold || 0))
    ? 0
    : (settings?.standardDeliveryFee || 0);

  const [isSuccess, setIsSuccess] = useState(false);
  const [hasClickedWhatsApp, setHasClickedWhatsApp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [finalOrderData, setFinalOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSummaryMobile, setShowSummaryMobile] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(getFormSchema(t)),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      deliveryMethod: 'DELIVERY',
      city: '',
      address: '',
      notes: '',
    },
  });

  const isDelivery = form.watch('deliveryMethod') === 'DELIVERY';
  const displayShipping = isDelivery ? shippingTotal : 0;
  const grandTotal = cartTotal + displayShipping;

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const res = await apiRequest('POST', '/api/public/orders', {
        ...values,
        customerName: values.fullName,
        items: items.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.selectedSize ?? null,
        }))
      });
      const data = await res.json();

      setFinalOrderData({
        orderId: data.orderId,
        fullName: values.fullName,
        phone: values.phone,
        deliveryMethod: values.deliveryMethod,
        city: values.city,
        items: [...items],
        cartTotal,
        displayShipping,
        grandTotal: cartTotal + displayShipping
      });

      trackOrder(data.orderId);
      setIsSuccess(true);
      clearCart();
    } catch (error) {
      console.error('Failed to create order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (items.length === 0 && !isSuccess) {
      router.push('/cart');
    }
    if (isSuccess) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [items.length, isSuccess, router]);

  const copyToClipboard = (text: string) => {
    if (!text) return;

    const onSuccess = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success(t('checkout.copySuccess'), {
        description: text,
        duration: 2500,
      });
    };

    const onError = () => {
      toast.error(t('checkout.copyFail'), {
        description: t('checkout.copyFailDesc'),
        duration: 3000,
      });
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(onSuccess).catch(() => {
        // Try fallback before giving up
        fallbackCopyText(text, onSuccess, onError);
      });
    } else {
      fallbackCopyText(text, onSuccess, onError);
    }
  };

  const fallbackCopyText = (text: string, onSuccess: () => void, onError: () => void) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      successful ? onSuccess() : onError();
    } catch {
      onError();
    }
  };

  if (items.length === 0 && !isSuccess) return null;

  const generateWhatsAppMessage = () => {
    const storeNumber = settings?.whatsappNumber?.replace(/[^0-9]/g, '') || '';
    if (!storeNumber || !finalOrderData) return '#';

    let message = `*${t('checkout.whatsapp.newOrder')}: ${finalOrderData.orderId}*\n\n`;
    message += `*${t('checkout.whatsapp.customer')}:* ${finalOrderData.fullName}\n`;
    message += `*${t('checkout.whatsapp.phone')}:* ${finalOrderData.phone}\n`;
    message += `*${t('checkout.whatsapp.delivery')}:* ${finalOrderData.deliveryMethod === 'DELIVERY' ? t('checkout.whatsapp.deliveryTo') + ' ' + finalOrderData.city : t('checkout.whatsapp.pickup')}\n\n`;
    message += `*${t('checkout.whatsapp.items')}:*\n`;
    finalOrderData.items.forEach((item: any) => {
      message += `- ${item.quantity}x ${item.name} (${centsToMad(item.price * item.quantity)} ${t('common.currency')})\n`;
    });
    message += `\n*${t('checkout.whatsapp.payments')}:*\n`;
    message += `${t('checkout.subtotal')}: ${centsToMad(finalOrderData.cartTotal)} ${t('common.currency')}\n`;
    if (finalOrderData.deliveryMethod === 'DELIVERY') {
      message += `${t('checkout.shipping')}: ${finalOrderData.displayShipping === 0 ? t('checkout.free') : `${centsToMad(finalOrderData.displayShipping)} ${t('common.currency')}`}\n`;
    }
    message += `*${t('checkout.grandTotal')}: ${centsToMad(finalOrderData.grandTotal)} ${t('common.currency')}*\n`;

    return `https://wa.me/${storeNumber}?text=${encodeURIComponent(message)}`;
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto mt-6 px-4 pb-12 text-center animate-in fade-in duration-500">
        <CheckoutStepper currentStep="success" />

        <div className="bg-emerald-50 text-emerald-500 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-100/50">
          <CheckCircle2 className="h-10 w-10 animate-in zoom-in duration-500" />
        </div>
        <h1 className="text-2xl md:text-3xl font-black mb-2 text-slate-900 tracking-tight">{t('checkout.successTitle')}</h1>
        <p className="text-slate-500 mb-8 text-sm md:text-base font-medium leading-relaxed px-4">
          {t('checkout.successDesc1')} <br className="hidden sm:block" />
          <span className="text-primary font-bold">{t('checkout.successDesc2')}</span>
        </p>

        <Card className="mb-8 text-start border-slate-200 overflow-hidden shadow-xl shadow-slate-200/40 rounded-[1.5rem] bg-white text-start">
          <div className="bg-[#F9F6F0] px-6 py-5 border-b border-[#C9A227]/10 text-start">
            <p className="text-[9px] font-bold text-[#1A1A1A]/40 uppercase tracking-[0.3em] mb-3 leading-none">{t('checkout.orderRef')}</p>
            {/* Stable reference row — never changes size */}
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-lg text-[#1A1A1A] tracking-wider truncate flex-1 min-w-0">
                {finalOrderData?.orderId}
              </span>
              {/* Fixed-size icon button — only the icon inside animates */}
              <button
                onClick={() => copyToClipboard(finalOrderData?.orderId)}
                aria-label={t('checkout.copyAria')}
                title={t('checkout.copyAria')}
                className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-none border border-[#C9A227]/20 text-[#1A1A1A]/30 hover:text-[#C9A227] hover:border-[#C9A227]/50 hover:bg-[#C9A227]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]/30 transition-colors active:scale-95 duration-150"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500 transition-all duration-300" />
                ) : (
                  <Clipboard className="h-3.5 w-3.5 transition-all duration-300" />
                )}
              </button>
            </div>
          </div>
          <CardContent className="space-y-6 p-6 md:p-8 text-start">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">{t('checkout.paymentMethod')}</span>
              <Badge variant="outline" className="text-slate-900 bg-slate-50 border-slate-200 font-black uppercase tracking-widest text-[9px] px-2 py-0.5 rounded-full">
                {t('checkout.cod')}
              </Badge>
            </div>

            <div className="bg-primary/5 rounded-2xl p-5 md:p-6 border border-primary/10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-slate-700">{t('checkout.finalAmount')}</span>
                <span className="text-2xl font-black text-primary tracking-tighter" dir="ltr">{centsToMad(finalOrderData?.grandTotal || 0)} {t('common.currency')}</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-start">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{t('checkout.actionRequired')}</p>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {t('checkout.pendingMsg')}
                </p>
                <a
                  href={generateWhatsAppMessage()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full pt-1"
                  onClick={() => setHasClickedWhatsApp(true)}
                >
                  <Button className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white gap-2 h-14 text-base font-black rounded-xl shadow-lg shadow-[#25D366]/20 transition-all active:scale-95">
                    <MessageCircle className="h-5 w-5 rtl:-scale-x-100" />
                    {t('checkout.confirmWhatsapp')}
                  </Button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasClickedWhatsApp && (
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-500 max-w-sm mx-auto">
            <Button variant="outline" className="h-10 w-full text-xs font-bold rounded-lg border-slate-200" onClick={() => router.push('/')}>
              {t('checkout.backHome')}
            </Button>
            <Button variant="ghost" className="h-10 w-full text-[10px] font-black uppercase tracking-widest text-slate-400" onClick={() => router.push('/orders')}>
              {t('checkout.viewHistory')}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-4 px-4 pb-20 md:pb-8">
      <CheckoutStepper currentStep="checkout" />

      {/* ── Mobile Order Summary Toggle ── */}
      {isMobile && (
        <div className="mb-6">
          <button
            onClick={() => setShowSummaryMobile(!showSummaryMobile)}
            className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm active:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3 font-bold text-slate-700 text-sm">
              <div className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                <ShoppingBag className="h-3.5 w-3.5 text-primary" />
              </div>
              <span>{showSummaryMobile ? t('checkout.hideSummary') : t('checkout.reviewSummary')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 text-sm" dir="ltr">{centsToMad(grandTotal)} {t('common.currency')}</span>
              {showSummaryMobile ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </div>
          </button>

          {showSummaryMobile && (
            <div className="mt-3 p-5 bg-white border border-slate-200 rounded-2xl space-y-4 animate-in slide-in-from-top-1 shadow-lg shadow-slate-200/40">
              {items.map((item: any) => (
                <div key={item.id} className="flex gap-3">
                  <div className="h-14 w-14 rounded-lg bg-slate-50 overflow-hidden flex-shrink-0 border border-slate-100 relative">
                    {item.images?.[0] ? (
                      <Image
                        src={item.images[0]}
                        alt={item.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-300">
                        <ShoppingBag className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center text-start">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{item.name}</h4>
                      <span className="font-black text-slate-900 text-xs whitespace-nowrap mx-2" dir="ltr">{centsToMad(item.price * item.quantity)}</span>
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{item.quantity}x <span dir="ltr">{centsToMad(item.price)}</span></p>
                    {item.selectedSize && <p className="text-[9px] uppercase tracking-widest text-slate-400 mt-0.5">{t('cart.size')}: {item.selectedSize}</p>}
                  </div>
                </div>
              ))}
              <Separator className="bg-slate-100/50" />
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">{t('checkout.subtotal')}</span>
                  <span className="font-black text-slate-900" dir="ltr">{centsToMad(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">{t('checkout.shipping')}</span>
                  <span className="font-black text-slate-900" dir="ltr">{displayShipping === 0 ? t('checkout.free') : `${centsToMad(displayShipping)}`}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <Button variant="ghost" className="mb-4 rtl:pr-0 ltr:pl-0 h-8 py-0 hover:bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900" onClick={() => router.push('/cart')}>
        <ArrowLeft className="rtl:ml-1.5 ltr:mr-1.5 h-3 w-3 rtl:-scale-x-100" /> {t('checkout.bag')}
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 animate-in fade-in duration-500">
        {/* Left: Form */}
        <div className="lg:col-span-7 space-y-8 text-start">
          <div className="mb-2">
            <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-widest px-2 py-0.5 mb-2">{t('checkout.secureCheckout')}</Badge>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{t('checkout.shippingDetails')}</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">{t('checkout.shippingDesc')}</p>
          </div>

          <Form {...form}>
            <form id="checkout-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Delivery Method */}
              <Card className="border-slate-200 shadow shadow-slate-200/40 rounded-2xl overflow-hidden bg-white text-start">
                <CardHeader className="bg-slate-50 py-4 px-6 border-b border-slate-100 text-start">
                  <CardTitle className="text-[9px] font-black tracking-[0.2em] flex items-center gap-2 text-slate-400 uppercase">
                    <Truck className="h-3.5 w-3.5 text-primary/60 rtl:-scale-x-100" /> {t('checkout.deliveryMethod')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 md:p-6 lg:p-8">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {[
                      { id: 'DELIVERY', label: t('checkout.methodDelivery'), desc: t('checkout.methodDeliveryDesc'), icon: Truck },
                      { id: 'PICKUP', label: t('checkout.methodPickup'), desc: t('checkout.methodPickupDesc'), icon: Store },
                    ].map((method) => {
                      const selected = form.watch('deliveryMethod') === method.id;
                      return (
                        <div
                          key={method.id}
                          onClick={() => form.setValue('deliveryMethod', method.id as any)}
                          className={cn(
                            "flex-1 border-2 rounded-xl p-4 cursor-pointer flex items-center gap-3 transition-all duration-300",
                            selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                          )}
                        >
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                            selected ? 'bg-primary text-white' : 'bg-white text-slate-400 border border-slate-100'
                          )}>
                              <method.icon className={cn("h-5 w-5", method.icon === Truck ? "rtl:-scale-x-100" : "")} />
                          </div>
                          <div>
                            <h4 className={cn("text-[13px] font-black uppercase tracking-tight", selected ? 'text-slate-900' : 'text-slate-500')}>{method.label}</h4>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{method.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card className="border-slate-200 shadow shadow-slate-200/40 rounded-2xl overflow-hidden bg-white text-start">
                <CardHeader className="bg-slate-50 py-4 px-6 border-b border-slate-100 text-start">
                  <CardTitle className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">{t('checkout.information')}</CardTitle>
                </CardHeader>
                <CardContent className="p-5 md:p-6 lg:p-8 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{t('checkout.fullName')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('checkout.fullNamePlaceholder')} className="h-11 bg-slate-50 border-slate-100 rounded-lg focus-visible:ring-primary/20 text-sm font-medium" {...field} />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{t('checkout.phone')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('checkout.phonePlaceholder')} className="h-11 bg-slate-50 border-slate-100 rounded-lg focus-visible:ring-primary/20 text-sm font-medium" {...field} />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {isDelivery && (
                    <div className="space-y-5 pt-1 animate-in fade-in slide-in-from-top-1 duration-300">
                      <Separator className="bg-slate-50" />
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{t('checkout.city')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('checkout.cityPlaceholder')} className="h-11 bg-slate-50 border-slate-100 rounded-lg focus-visible:ring-primary/20 text-sm font-medium" {...field} />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400 font-black">{t('checkout.address')}</FormLabel>
                            <FormControl>
                              <Textarea placeholder={t('checkout.addressPlaceholder')} className="min-h-[80px] bg-slate-50 border-slate-100 rounded-lg focus-visible:ring-primary/20 text-sm font-medium" {...field} />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <Separator className="bg-slate-50" />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{t('checkout.notes')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('checkout.notesPlaceholder')} className="h-11 bg-slate-50 border-slate-100 rounded-lg focus-visible:ring-primary/20 text-sm font-medium" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-5 text-start">
          <Card className="sticky top-24 shadow-lg shadow-slate-200/40 border-slate-200 rounded-[1.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-slate-50 px-6 py-4 border-b border-slate-100 text-start">
              <CardTitle className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">{t('checkout.summary')}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="max-h-[300px] overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                {items.map((item: any) => (
                  <div key={item.id} className="flex gap-3 group">
                    <div className="h-14 w-14 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100 bg-slate-50 transition-transform group-hover:scale-105 duration-300 relative">
                      {item.images?.[0] ? (
                        <Image
                          src={item.images[0]}
                          alt={item.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-300">
                          <ShoppingBag className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-slate-900 text-xs line-clamp-1 leading-snug">{item.name}</h4>
                        <span className="text-xs font-black text-slate-900 tracking-tight whitespace-nowrap" dir="ltr">{centsToMad(item.price * item.quantity)}</span>
                      </div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{item.quantity}x <span dir="ltr">{centsToMad(item.price)}</span></p>
                      {item.selectedSize && <p className="text-[9px] uppercase tracking-widest text-slate-400 mt-0.5">{t('cart.size')}: {item.selectedSize}</p>}
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="bg-slate-50" />

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">{t('checkout.subtotal')}</span>
                  <span className="font-black text-slate-900 tracking-tight" dir="ltr">{centsToMad(cartTotal)} {t('common.currency')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">{t('checkout.shipping')}</span>
                  <span className="font-black text-emerald-600 uppercase text-[9px] tracking-widest" dir="ltr">{displayShipping === 0 ? t('checkout.free') : `${centsToMad(displayShipping)} ${t('common.currency')}`}</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
                <div className="text-start">
                  <p className="font-black text-[9px] uppercase tracking-widest text-slate-900 leading-none mb-1">{t('checkout.cod')}</p>
                  <p className="text-[9px] text-slate-400 font-medium">{t('checkout.safePayment')}</p>
                </div>
              </div>

              <Separator className="bg-slate-50" />

              <div className="flex justify-between items-center bg-slate-900 p-5 rounded-2xl shadow-xl shadow-slate-900/10">
                <span className="font-black text-[9px] uppercase tracking-widest text-slate-400">{t('checkout.grandTotal')}</span>
                <span className="font-black text-2xl text-white tracking-tighter" dir="ltr">{centsToMad(grandTotal)} {t('common.currency')}</span>
              </div>

              {/* Desktop/Tablet Button (Hidden on phones) */}
              <Button
                size="lg"
                className="w-full text-base font-black h-14 shadow-xl shadow-primary/20 rounded-xl mt-2 hidden md:flex active:scale-95 transition-all"
                type="submit"
                form="checkout-form"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('checkout.confirmOrder')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Mobile Sticky Button ── */}
      {!isSuccess && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-100 z-[100] flex items-center gap-4 md:hidden">
          <div className="flex-1 text-start">
            <p className="text-[9px] text-slate-400 font-black uppercase leading-none mb-1 tracking-widest">{t('checkout.totalToPay')}</p>
            <p className="text-xl font-black text-primary leading-none tracking-tighter" dir="ltr">{centsToMad(grandTotal)} {t('common.currency')}</p>
          </div>
          <Button
            size="lg"
            className="flex-[2] h-12 text-sm font-black tracking-widest uppercase shadow-lg shadow-primary/20 rounded-xl"
            type="submit"
            form="checkout-form"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('checkout.orderNow')}
          </Button>
        </div>
      )}
    </div>
  );
}
