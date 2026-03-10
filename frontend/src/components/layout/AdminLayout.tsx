"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/admin/auth/authContext';
import dynamic from 'next/dynamic';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
  LogOut,
  Menu,
  Tags
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/provider';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AdminSearch } from '@/app/admin/_components/AdminSearch';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const currentLocale = i18n.locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  ) || i18n.defaultLocale;

  const menuItems = [
    { icon: LayoutDashboard, label: t('admin.menu.overview'), href: `/${currentLocale}/admin` },
    { icon: Tags, label: t('admin.menu.categories'), href: `/${currentLocale}/admin/categories` },
    { icon: Package, label: t('admin.menu.products'), href: `/${currentLocale}/admin/products` },
    { icon: ShoppingBag, label: t('admin.menu.orders'), href: `/${currentLocale}/admin/orders` },
    { icon: Settings, label: t('admin.menu.settings'), href: `/${currentLocale}/admin/settings` },
  ];

  const SidebarContent = () => {
    const { user, logout } = useAuth();

    return (
      <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <span className="font-bold text-lg tracking-tight flex items-center gap-2">
            <div className="h-6 w-6 bg-sidebar-primary rounded-sm flex items-center justify-center text-sidebar-primary-foreground text-xs uppercase">
              {user?.username?.[0] || 'A'}
            </div>
            {user?.username || t('common.admin')}
          </span>
        </div>

        <div className="flex-1 py-6 px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== `/${currentLocale}/admin` && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`
                flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors
                ${isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}
              `}>
                <Icon className={`h-4 w-4 ${isActive ? 'text-sidebar-primary' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-sidebar-border space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-bold">
              {t('common.language')}
            </span>
            <LanguageSwitcher className="border-sidebar-border text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground" />
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4 rtl:ml-2 ltr:mr-2 rtl:-scale-x-100" />
            {t('admin.logout')}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-background" suppressHydrationWarning>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 fixed inset-y-0 start-0 z-50 border-e border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 start-0 end-0 h-14 bg-sidebar text-sidebar-foreground z-50 flex items-center px-4 justify-between border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <span className="font-bold">{t('common.admin')}</span>
          <LanguageSwitcher className="border-sidebar-border text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground" />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent">
              <Menu className="h-5 w-5 rtl:-scale-x-100" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-e-sidebar-border bg-sidebar rtl:border-s-sidebar-border rtl:border-e-0">
            <SheetTitle className="sr-only">{t('admin.menuTitle')}</SheetTitle>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 min-h-screen flex flex-col">
        {/* Desktop Header */}
        <header className="hidden md:flex h-16 items-center justify-between px-8 border-b border-neutral-200 bg-white sticky top-0 z-40">
           <div className="flex-1 flex items-center">
             <AdminSearch />
           </div>
        </header>
        
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNavLoader />
    </div>
  );
}

// ── Lazy wrappers for client components ───────────────────────────────────────
const AdminSearchLoader = dynamic(
  () => import('@/features/admin/shared/search/AdminSearch').then((m) => ({ default: m.AdminSearch })),
  { ssr: false, loading: () => <div className="h-8 w-32 rounded-md bg-muted animate-pulse" /> }
);

const MobileBottomNavLoader = dynamic(
  () => import('@/features/admin/mobile/MobileBottomNav').then((m) => ({ default: m.MobileBottomNav })),
  { ssr: false }
);
