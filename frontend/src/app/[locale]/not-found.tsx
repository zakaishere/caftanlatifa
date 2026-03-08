"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useTranslation } from '@/i18n/provider';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="space-y-6 max-w-md">
        <h1 className="font-serif text-8xl md:text-9xl text-primary/20">404</h1>
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-serif text-foreground">{t('errors.404.title')}</h2>
          <p className="text-muted-foreground font-light italic">
            {t('errors.404.description')}
          </p>
        </div>
        <div className="pt-8">
          <Link href="/">
            <Button className="rounded-none px-8 py-6 uppercase tracking-[0.2em] text-[11px] gap-2">
              <Home className="h-4 w-4 rtl:-scale-x-100" />
              {t('errors.404.backHome')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
