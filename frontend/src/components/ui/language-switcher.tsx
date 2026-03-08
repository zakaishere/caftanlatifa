"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { i18n } from "@/i18n/config";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();

  if (!pathname) return null;

  // Extract the current locale from the path
  const currentLocale = i18n.locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  ) || i18n.defaultLocale;

  const toggleLocale = () => {
    const nextLocale = currentLocale === "fr" ? "ar" : "fr";
    
    // Replace the locale in the pathname
    const newPathname = pathname.replace(`/${currentLocale}`, `/${nextLocale}`);
    
    // Fallback if replacing didn't work (e.g., at root `/` which middleware handles, 
    // but the client-side pathname might just be `/` initially depending on setup)
    const finalPathname = newPathname === pathname ? `/${nextLocale}${pathname}` : newPathname;
    
    router.push(finalPathname);
    router.refresh(); // Force a refresh to ensure layout dir changes
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      className={cn(
        "text-[10px] md:text-xs font-medium tracking-widest uppercase transition-colors h-auto py-1 px-2 border rounded-sm",
        className || "text-white/80 border-white/10 hover:bg-white/10 hover:text-primary"
      )}
    >
      {currentLocale === "fr" ? "العربية" : "FR"}
    </Button>
  );
}
