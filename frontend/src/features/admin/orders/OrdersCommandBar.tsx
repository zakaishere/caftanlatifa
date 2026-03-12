'use client';

import React from 'react';
import { Search, Calendar, Filter, X, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import type { OrderTableState, OrderTableActions, DateRangePreset } from './hooks/useOrderTableState';
import { useTranslation } from '@/i18n/provider';

interface OrdersCommandBarProps {
  state: OrderTableState;
  actions: OrderTableActions;
}

const DATE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: 'custom', label: 'Custom Range' },
];

export function OrdersCommandBar({ state, actions }: OrdersCommandBarProps) {
  const { t } = useTranslation();

  return (
    <div className="sticky top-0 z-20 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 pb-4 pt-1">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search by ID, name, email or phone..."
            className="pl-10 h-10 bg-muted/30 border-border/40 focus:bg-background transition-all"
            value={state.globalFilter}
            onChange={(e) => actions.setGlobalFilter(e.target.value)}
          />
          {state.globalFilter && (
            <button
              onClick={() => actions.setGlobalFilter('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider hidden lg:inline-block">Status</span>
            <Select
              value={state.statusFilter}
              onValueChange={(val) => actions.setStatusFilter(val as any)}
            >
              <SelectTrigger className="w-[140px] h-10 border-border/40 bg-muted/20">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider hidden lg:inline-block">Date</span>
            <Select
              value={state.datePreset}
              onValueChange={(val) => actions.setDatePreset(val as DateRangePreset)}
            >
              <SelectTrigger className="w-[150px] h-10 border-border/40 bg-muted/20">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Date Range" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {DATE_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          {(state.globalFilter || state.statusFilter !== 'ALL' || state.datePreset !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => actions.resetFilters()}
              className="h-10 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3"
            >
              RESET
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
