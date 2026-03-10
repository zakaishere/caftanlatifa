'use client';

import { Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BulkAction } from './types';

interface DataTableToolbarProps<TData> {
  selectedRows: TData[];
  onClearSelection: () => void;
  bulkActions: BulkAction<TData>[];
}

export function DataTableToolbar<TData>({
  selectedRows,
  onClearSelection,
  bulkActions,
}: DataTableToolbarProps<TData>) {
  const count = selectedRows.length;
  if (count === 0) return null;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-2.5',
        'bg-primary/[0.03] border-b border-primary/20 rounded-t-md',
        'animate-in slide-in-from-top-1 duration-150',
      )}
    >
      <div className="flex items-center gap-2.5">
        <button
          onClick={onClearSelection}
          className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <span className="text-sm font-medium text-foreground">
          {count} {count === 1 ? 'item' : 'items'} selected
        </span>
      </div>

      <div className="flex items-center gap-2">
        {bulkActions.map((action, i) => (
          <Button
            key={i}
            variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => action.onClick(selectedRows)}
            className={cn(
              'h-7 text-xs gap-1.5 font-medium',
              action.variant !== 'destructive' && 'border-border hover:bg-muted',
            )}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
