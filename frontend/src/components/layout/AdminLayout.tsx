"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/admin/auth/authContext';
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
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AdminSearch } from '@/app/admin/_components/AdminSearch';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', href: '/admin' },
    { icon: Tags, label: 'Categories', href: '/admin/categories' },
    { icon: Package, label: 'Products', href: '/admin/products' },
    { icon: ShoppingBag, label: 'Orders', href: '/admin/orders' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
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
            {user?.username || 'Atlas Admin'}
          </span>
        </div>

        <div className="flex-1 py-6 px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
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

        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-background" suppressHydrationWarning>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 fixed inset-y-0 left-0 z-50">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar text-sidebar-foreground z-50 flex items-center px-4 justify-between border-b border-sidebar-border">
        <span className="font-bold">Atlas Admin</span>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-r-sidebar-border bg-sidebar">
            <SheetTitle className="sr-only">Menu d'administration</SheetTitle>
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
    </div>
  );
}
