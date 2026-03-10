'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface PaginationControlsProps {
  page: number; // 0-indexed
  pageSize: number;
  pageCount: number;
  total: number;
  selectedCount?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

const PAGE_SIZES = [10, 25, 50, 100];
const MAX_PAGE_CHIPS = 5;

function getPageChips(page: number, pageCount: number): (number | '...')[] {
  if (pageCount <= MAX_PAGE_CHIPS) {
    return Array.from({ length: pageCount }, (_, i) => i);
  }
  const chips: (number | '...')[] = [];
  const half = Math.floor(MAX_PAGE_CHIPS / 2);

  let start = Math.max(0, page - half);
  let end = Math.min(pageCount - 1, start + MAX_PAGE_CHIPS - 1);
  if (end - start < MAX_PAGE_CHIPS - 1) {
    start = Math.max(0, end - MAX_PAGE_CHIPS + 1);
  }

  if (start > 0) {
    chips.push(0);
    if (start > 1) chips.push('...');
  }
  for (let i = start; i <= end; i++) chips.push(i);
  if (end < pageCount - 1) {
    if (end < pageCount - 2) chips.push('...');
    chips.push(pageCount - 1);
  }
  return chips;
}

export function PaginationControls({
  page,
  pageSize,
  pageCount,
  total,
  selectedCount = 0,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZES,
}: PaginationControlsProps) {
  const start = total === 0 ? 0 : page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, total);
  const chips = getPageChips(page, pageCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border/50 bg-muted/20">
      {/* Left: selection + total info */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground order-2 sm:order-1">
        {selectedCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
            {selectedCount} selected
          </span>
        )}
        <span>
          {total === 0
            ? 'No records'
            : `${start}–${end} of ${total.toLocaleString()} records`}
        </span>
      </div>

      {/* Center: page navigation */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={page === 0}
          onClick={() => onPageChange(0)}
          title="First page"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          title="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        <div className="flex items-center gap-0.5 mx-1">
          {chips.map((chip, i) =>
            chip === '...' ? (
              <span key={`ellipsis-${i}`} className="w-7 text-center text-xs text-muted-foreground">
                …
              </span>
            ) : (
              <button
                key={chip}
                onClick={() => onPageChange(chip as number)}
                className={cn(
                  'h-7 w-7 rounded text-xs font-medium transition-colors',
                  chip === page
                    ? 'bg-foreground text-background hover:bg-foreground/90'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {(chip as number) + 1}
              </button>
            )
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={page >= pageCount - 1}
          onClick={() => onPageChange(page + 1)}
          title="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={page >= pageCount - 1}
          onClick={() => onPageChange(pageCount - 1)}
          title="Last page"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Right: page size selector */}
      <div className="flex items-center gap-2 order-3 text-xs text-muted-foreground">
        <span className="hidden sm:inline">Rows</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => {
            onPageSizeChange(Number(v));
            onPageChange(0); // reset to first page on size change
          }}
        >
          <SelectTrigger className="h-7 w-[70px] text-xs border-border/60 bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)} className="text-xs">
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="hidden sm:inline">per page</span>
      </div>
    </div>
  );
}
