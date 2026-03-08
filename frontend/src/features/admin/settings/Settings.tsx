"use client";
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Loader2, ImageIcon } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ApiSettings, centsToMad } from '@/lib/types';
import { ImageUploader } from '@/components/ui/image-uploader';
import { BusinessHoursEditor } from './BusinessHoursEditor';
import { BusinessHoursConfig } from '@/lib/types';
import { useTranslation } from '@/i18n/provider';

export default function SettingsAdmin() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<ApiSettings>({
    queryKey: ['/api/admin/settings'],
  });

  const [storeName, setStoreName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(true);
  const [freeShippingThresholdMad, setFreeShippingThresholdMad] = useState('');
  const [standardDeliveryFeeMad, setStandardDeliveryFeeMad] = useState('');
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [businessHours, setBusinessHours] = useState<BusinessHoursConfig | null>(null);
  const [googleMapsEmbed, setGoogleMapsEmbed] = useState('');

  // Sync state when data loads
  useEffect(() => {
    if (settings) {
      setStoreName(settings.storeName || '');
      setWhatsappNumber(settings.whatsappNumber || '');
      setSupportEmail(settings.supportEmail || '');
      setBusinessAddress(settings.businessAddress || '');
      setFreeShippingEnabled(settings.freeShippingEnabled ?? true);
      setFreeShippingThresholdMad(centsToMad(settings.freeShippingThreshold || 0));
      setStandardDeliveryFeeMad(centsToMad(settings.standardDeliveryFee || 0));
      setHeroImage(settings.heroImage || null);
      if (settings.businessHours) {
        setBusinessHours(settings.businessHours);
      }
      setGoogleMapsEmbed(settings.googleMapsEmbed || '');
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: async (payload: Partial<ApiSettings>) => {
      const res = await apiRequest('PATCH', '/api/admin/settings', payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      // Since public configs depend on settings, invalidate them too
      queryClient.invalidateQueries({ queryKey: ['/api/public/init'] });
      toast({ title: t('admin.settings.toast.success') });
    },
    onError: (err: Error) => {
      toast({ title: t('admin.settings.toast.error'), description: err.message, variant: 'destructive' });
    }
  });

  const handleSave = () => {
    mutation.mutate({
      storeName,
      whatsappNumber,
      supportEmail: supportEmail || null,
      businessAddress: businessAddress || null,
      freeShippingEnabled,
      freeShippingThreshold: Math.round(parseFloat(freeShippingThresholdMad || '0') * 100),
      standardDeliveryFee: Math.round(parseFloat(standardDeliveryFeeMad || '0') * 100),
      heroImage,
      businessHours,
      googleMapsEmbed: googleMapsEmbed || null,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-start">
      <div className="text-start">
        <h1 className="text-3xl font-bold tracking-tight">{t('admin.settings.title')}</h1>
        <p className="text-muted-foreground">{t('admin.settings.subtitle')}</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="text-start">
            <CardTitle>{t('admin.settings.generalInfo')}</CardTitle>
            <CardDescription>{t('admin.settings.generalInfoDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="storeName" className="text-start">{t('admin.settings.storeName')}</Label>
              <Input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-start">
            <CardTitle>{t('admin.settings.brandVisual')}</CardTitle>
            <CardDescription>{t('admin.settings.brandVisualDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <Label className="text-start">{t('admin.settings.heroImage')}</Label>
              <ImageUploader
                value={heroImage ? [heroImage] : []}
                onChange={(urls) => setHeroImage(urls.length > 0 ? urls[0] : null)}
                maxFiles={1}
              />
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest bg-primary/5 p-3 border border-primary/10">
                {t('admin.settings.heroImageTip')}
              </p>
            </div>
          </CardContent>
        </Card>

        <BusinessHoursEditor
          value={businessHours}
          onChange={setBusinessHours}
        />

        <Card>
          <CardHeader className="text-start">
            <CardTitle>{t('admin.settings.contactSupport')}</CardTitle>
            <CardDescription>{t('admin.settings.contactSupportDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="whatsapp" className="text-start">{t('admin.settings.whatsappNumber')}</Label>
              <Input id="whatsapp" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} dir="ltr" className="text-start" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-start">{t('admin.settings.supportEmail')}</Label>
              <Input id="email" type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} dir="ltr" className="text-start" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address" className="text-start">{t('admin.settings.businessAddress')}</Label>
              <Input id="address" value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maps" className="text-start">{t('admin.settings.googleMapsEmbed')}</Label>
              <Input
                id="maps"
                value={googleMapsEmbed}
                onChange={(e) => setGoogleMapsEmbed(e.target.value)}
                placeholder="https://www.google.com/maps/embed?..."
                dir="ltr"
                className="text-start"
              />
              <p className="text-[10px] text-muted-foreground">
                {t('admin.settings.googleMapsHint')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-start">
            <CardTitle>{t('admin.settings.deliverySettings')}</CardTitle>
            <CardDescription>{t('admin.settings.deliverySettingsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 text-start">
                <Label>{t('admin.settings.freeShipping')}</Label>
                <p className="text-sm text-muted-foreground">{t('admin.settings.freeShippingDesc')}</p>
              </div>
              <Switch checked={freeShippingEnabled} onCheckedChange={setFreeShippingEnabled} />
            </div>
            {freeShippingEnabled && (
              <div className="grid gap-2 mt-4 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="threshold" className="text-start">{t('admin.settings.freeShippingThreshold')}</Label>
                <Input id="threshold" type="number" step="0.01" value={freeShippingThresholdMad} onChange={(e) => setFreeShippingThresholdMad(e.target.value)} dir="ltr" className="text-start" />
              </div>
            )}
            <div className="grid gap-2 mt-4">
              <Label htmlFor="fee" className="text-start">{t('admin.settings.standardDeliveryFee')}</Label>
              <Input id="fee" type="number" step="0.01" value={standardDeliveryFeeMad} onChange={(e) => setStandardDeliveryFeeMad(e.target.value)} dir="ltr" className="text-start" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pb-8">
          <Button size="lg" className="gap-2" onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {mutation.isPending ? t('admin.settings.saving') : t('admin.settings.saveChanges')}
          </Button>
        </div>
      </div>
    </div>
  );
}
