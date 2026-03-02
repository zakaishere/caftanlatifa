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

export default function SettingsAdmin() {
  const { toast } = useToast();
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
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('19:00');
  const [daysOff, setDaysOff] = useState<string[]>(['Dimanche']);
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
      setWorkStartTime(settings.workStartTime || '09:00');
      setWorkEndTime(settings.workEndTime || '19:00');
      setDaysOff(settings.daysOff || ['Dimanche']);
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
      toast({ title: 'Settings saved successfully' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to save settings', description: err.message, variant: 'destructive' });
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
      workStartTime,
      workEndTime,
      daysOff,
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your store configuration.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
            <CardDescription>Basic store details visible to customers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="storeName">Store Name</Label>
              <Input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Brand Visual</CardTitle>
            <CardDescription>The main image displayed on the homepage hero section.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <Label>Hero Image</Label>
              <ImageUploader
                value={heroImage ? [heroImage] : []}
                onChange={(urls) => setHeroImage(urls.length > 0 ? urls[0] : null)}
                maxFiles={1}
              />
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest bg-primary/5 p-3 border border-primary/10">
                Tip: Use a high-quality vertical or editorial photo of a "Moroccan Luxury Caftan" for the best boutique feel.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Hours</CardTitle>
            <CardDescription>Configure your operating hours and days off.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="workStartTime">Opening Time</Label>
                <Input type="time" id="workStartTime" value={workStartTime} onChange={(e) => setWorkStartTime(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="workEndTime">Closing Time</Label>
                <Input type="time" id="workEndTime" value={workEndTime} onChange={(e) => setWorkEndTime(e.target.value)} />
              </div>
            </div>

            <div className="h-[1px] bg-border/40" />

            <div className="grid gap-4">
              <Label>Days Off (Fermé)</Label>
              <div className="flex flex-wrap gap-2">
                {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day) => (
                  <Button
                    key={day}
                    type="button"
                    variant={daysOff.includes(day) ? "default" : "outline"}
                    className={daysOff.includes(day) ? "bg-primary text-white" : ""}
                    onClick={() => {
                      if (daysOff.includes(day)) {
                        setDaysOff(daysOff.filter(d => d !== day));
                      } else {
                        setDaysOff([...daysOff, day]);
                      }
                    }}
                  >
                    {day}
                  </Button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Select the days your store is closed.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact & Support</CardTitle>
            <CardDescription>How customers can reach you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <Input id="whatsapp" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Support Email (Optional)</Label>
              <Input id="email" type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Business Address (Optional)</Label>
              <Input id="address" value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maps">Google Maps Embed URL (Optional)</Label>
              <Input
                id="maps"
                value={googleMapsEmbed}
                onChange={(e) => setGoogleMapsEmbed(e.target.value)}
                placeholder="https://www.google.com/maps/embed?..."
              />
              <p className="text-[10px] text-muted-foreground">
                Paste the <code>src</code> attribute from the Google Maps embed code.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Settings</CardTitle>
            <CardDescription>Configure global shipping costs and free shipping threshold.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Free Shipping</Label>
                <p className="text-sm text-muted-foreground">Enable free shipping above a certain cart total.</p>
              </div>
              <Switch checked={freeShippingEnabled} onCheckedChange={setFreeShippingEnabled} />
            </div>
            {freeShippingEnabled && (
              <div className="grid gap-2 mt-4 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="threshold">Free Shipping Threshold (MAD)</Label>
                <Input id="threshold" type="number" step="0.01" value={freeShippingThresholdMad} onChange={(e) => setFreeShippingThresholdMad(e.target.value)} />
              </div>
            )}
            <div className="grid gap-2 mt-4">
              <Label htmlFor="fee">Standard Delivery Fee (MAD)</Label>
              <Input id="fee" type="number" step="0.01" value={standardDeliveryFeeMad} onChange={(e) => setStandardDeliveryFeeMad(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pb-8">
          <Button size="lg" className="gap-2" onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
