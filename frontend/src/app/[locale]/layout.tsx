import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import { I18nProvider } from "@/i18n/provider";
import { getDictionary } from "@/i18n/getDictionary";
import type { Locale } from "@/i18n/config";
import "../globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = (resolvedParams?.locale || 'fr') as Locale;
  const dictionary = await getDictionary(locale);
  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = dictionary;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  return {
    title: {
      default: t('metadata.defaultTitle'),
      template: `%s | Caftan Latifa`
    },
    description: t('metadata.description'),
    openGraph: {
      title: t('metadata.defaultTitle'),
      description: t('metadata.ogDescription'),
      url: "https://caftanlatifa.com",
      siteName: "Caftan Latifa",
      locale: locale === 'ar' ? 'ar_MA' : 'fr_FR',
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t('metadata.defaultTitle'),
      description: t('metadata.twitterDescription'),
    },
    icons: {
      icon: "/icon.jpg",
    }
  };
}

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const resolvedParams = await params;
  // Safe default fallback
  const locale = (resolvedParams?.locale || 'fr') as Locale;
  const isRtl = locale === 'ar';
  
  const dictionary = await getDictionary(locale);

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <I18nProvider dictionary={dictionary} locale={locale}>
          <Providers>
            {children}
          </Providers>
        </I18nProvider>
      </body>
    </html>
  );
}
