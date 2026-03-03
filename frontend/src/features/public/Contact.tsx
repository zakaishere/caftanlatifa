"use client";
import { MapPin, Phone, Mail, Clock, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import type { ApiInitData } from '@/lib/types';
import { SmartBusinessHoursWidget } from './SmartBusinessHoursWidget';
import { extractGoogleMapsUrl } from '@/lib/businessHours';

export default function Contact() {
  const { data } = useQuery<ApiInitData>({
    queryKey: ['/api/public/init'],
    staleTime: 5 * 60 * 1000, // 5 minutes instead of Infinity to catch admin updates
  });
  const settings = data?.settings;

  return (
    <div className="max-w-7xl mx-auto py-16 px-4 md:px-12 lg:px-20 bg-background">
      <div className="text-center mb-24 md:mb-32">
        <span className="text-[10px] uppercase tracking-[0.4em] text-primary mb-6 block">Service Client</span>
        <h1 className="font-serif text-4xl md:text-6xl text-foreground tracking-tight mb-8">Contactez-nous</h1>
        <div className="h-[1px] w-20 bg-primary/30 mx-auto mb-10"></div>
        <p className="text-muted-foreground text-base md:text-lg font-light max-w-2xl mx-auto leading-relaxed">
          Questions sur nos créations ou votre commande ? Notre équipe dédiée est à votre disposition
          pour vous offrir une expérience d'exception à la hauteur de la Maison Caftan Latifa.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
        {/* Contact Info Cards */}
        <div className="lg:col-span-5 space-y-12">
          <div className="bg-white border border-primary/10 p-10 md:p-12 shadow-2xl shadow-primary/5 transition-all">
            <div className="flex items-center gap-6 mb-8">
              <div className="h-14 w-14 rounded-none bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                <Phone className="h-6 w-6 stroke-1" />
              </div>
              <h2 className="font-serif text-2xl text-foreground tracking-tight">Contact Direct</h2>
            </div>
            <div className="space-y-8">
              <p className="text-2xl font-medium text-foreground tracking-tight">{settings?.whatsappNumber ?? '+212 600 000 000'}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a
                  href={`tel:${settings?.whatsappNumber ?? '+212600000000'}`}
                >
                  <Button variant="outline" size="lg" className="w-full gap-3 h-14 rounded-none font-medium border-primary/10 hover:bg-primary/5 transition-all text-[11px] uppercase tracking-[0.2em]">
                    <Phone className="h-4 w-4" /> Appeler
                  </Button>
                </a>
                <a
                  href={`https://wa.me/${(settings?.whatsappNumber ?? '212600000000').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Bonjour, j\'ai besoin d\'assistance.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg" className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white gap-3 h-14 rounded-none font-medium transition-all shadow-xl shadow-[#25D366]/20 text-[11px] uppercase tracking-[0.2em]">
                    <MessageSquare className="h-4 w-4" /> WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white border border-primary/10 p-10 md:p-12 shadow-2xl shadow-primary/5">
            <div className="flex items-center gap-6 mb-8">
              <div className="h-14 w-14 rounded-none bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                <Mail className="h-6 w-6 stroke-1" />
              </div>
              <h2 className="font-serif text-2xl text-foreground tracking-tight">Email Support</h2>
            </div>
            <div className="space-y-8">
              <p className="text-xl font-medium text-foreground tracking-tight">{settings?.supportEmail ?? 'contact@caftanlatifa.ma'}</p>
              <a href={`mailto:${settings?.supportEmail ?? 'contact@caftanlatifa.ma'}`} className="block">
                <Button variant="outline" size="lg" className="w-full gap-3 h-14 rounded-none font-medium border-primary/10 hover:bg-primary/5 transition-all text-[11px] uppercase tracking-[0.2em]">
                  <Mail className="h-4 w-4" /> Nous écrire
                </Button>
              </a>
            </div>
          </div>

          <SmartBusinessHoursWidget
            config={settings?.businessHours}
            isLoading={!data && !settings}
          />

          <div className="bg-white border border-primary/10 p-10 md:p-12 shadow-2xl shadow-primary/5">
            <div className="flex items-center gap-6 mb-8">
              <div className="h-14 w-14 rounded-none bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                <MapPin className="h-6 w-6 stroke-1" />
              </div>
              <h2 className="font-serif text-2xl text-foreground tracking-tight">Siège Social</h2>
            </div>
            <div className="space-y-2">
              <p className="text-xl font-medium text-foreground tracking-tight">{settings?.businessAddress ?? '123 Boulevard Zerktouni'}</p>
              {settings?.businessAddress ? null : <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Casablanca, 20000, Maroc</p>}
            </div>
          </div>
        </div>

        {/* Contact Form & Map */}
        <div className="lg:col-span-7 space-y-16">
          <div className="bg-white border border-primary/10 shadow-2xl shadow-primary/5 p-10 md:p-16">
            <div className="space-y-4 mb-12">
              <h2 className="font-serif text-3xl text-foreground tracking-tight">Envoyez-nous un message</h2>
              <div className="h-[1px] w-12 bg-primary/40"></div>
            </div>

            <form className="space-y-10" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground/60 ml-1">Nom Complet</label>
                  <Input placeholder="Votre nom" className="h-14 bg-background border-primary/10 rounded-none focus-visible:ring-primary/20 transition-all font-medium text-[13px]" />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground/60 ml-1">Email</label>
                  <Input type="email" placeholder="votre@email.com" className="h-14 bg-background border-primary/10 rounded-none focus-visible:ring-primary/20 transition-all font-medium text-[13px]" />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground/60 ml-1">Sujet</label>
                <Input placeholder="De quoi s'agit-il ?" className="h-14 bg-background border-primary/10 rounded-none focus-visible:ring-primary/20 transition-all font-medium text-[13px]" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground/60 ml-1">Message</label>
                <Textarea placeholder="Décrivez votre demande en détail..." className="min-h-[220px] bg-background border-primary/10 rounded-none focus-visible:ring-primary/20 transition-all font-light py-5 px-6 leading-relaxed" />
              </div>
              <Button size="lg" className="w-full md:w-auto px-16 h-16 text-[11px] uppercase tracking-[0.4em] font-bold rounded-none bg-black text-white hover:bg-primary shadow-2xl shadow-primary/20 transition-all active:scale-95 group">
                <Send className="h-4 w-4 mr-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> Envoyer
              </Button>
            </form>
          </div>

          {/* Map Section */}
          <div className="border border-primary/10 shadow-2xl shadow-primary/5 overflow-hidden">
            <div className="bg-primary/5 p-6 px-10 border-b border-primary/10">
              <span className="text-[10px] uppercase tracking-[0.4em] text-primary font-medium">Notre Showroom</span>
            </div>
            <div className="relative h-[500px] bg-muted group">
              <iframe
                src={extractGoogleMapsUrl(settings?.googleMapsEmbed ?? "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d719.3483166805976!2d-5.362805966594682!3d35.56245974318981!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd0b42461ad1469f%3A0x25ec5089911ba6df!2sFaculty%20of%20Sciences%20Tetouan!5e1!3m2!1sen!2sma!4v1771780802081!5m2!1sen!2sma")}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale contrast-125"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
