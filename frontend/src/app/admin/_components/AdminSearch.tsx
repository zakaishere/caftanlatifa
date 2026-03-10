"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

export function AdminSearch() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-500 hover:bg-neutral-50 w-72 transition-colors shadow-sm"
      >
        <div className="flex items-center gap-2 text-xs">
          <Search className="h-4 w-4 text-neutral-400" />
          <span>Jump to...</span>
        </div>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded bg-neutral-100 px-1.5 font-mono text-[10px] font-medium text-neutral-600 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search products, orders, or actions..." />
        <CommandList className="max-h-[300px]">
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="Quick Actions" className="text-neutral-500">
            <CommandItem onSelect={() => runCommand(() => router.push("/admin/products/new"))}>
              Create New Product
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/admin/settings"))}>
              Manage Store Settings
            </CommandItem>
          </CommandGroup>
          <CommandSeparator className="bg-neutral-100" />
          
          <CommandGroup heading="Recent Activity" className="text-neutral-500">
            <CommandItem onSelect={() => runCommand(() => router.push("/admin/orders/123"))}>
              <span className="font-mono text-xs mr-2 text-neutral-400">#ORD-123</span>
              <span className="font-medium text-neutral-900">Zakariae Elhamadani</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
