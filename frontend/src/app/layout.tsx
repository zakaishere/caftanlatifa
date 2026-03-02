import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Caftan Latifa | Maison de Couture",
    template: "%s | Caftan Latifa"
  },
  description: "L'héritage de l'artisanat marocain sublimé par une élégance contemporaine. Caftans et Takchitas d'exception faits main.",
  openGraph: {
    title: "Caftan Latifa | Maison de Couture",
    description: "Découvrez notre collection de Caftans et Takchitas d'exception, alliant tradition marocaine et modernité.",
    url: "https://caftanlatifa.com",
    siteName: "Caftan Latifa",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Caftan Latifa | Maison de Couture",
    description: "L'héritage de l'artisanat marocain sublimé par une élégance contemporaine.",
  },
  icons: {
    icon: "/icon.jpg",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
