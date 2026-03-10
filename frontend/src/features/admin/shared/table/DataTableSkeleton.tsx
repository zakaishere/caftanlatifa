import { cn } from '@/lib/utils';

interface DataTableSkeletonProps {
  columns: number;
  rows?: number;
  hasCheckbox?: boolean;
}

function SkeletonCell({ className }: { className?: string }) {
  return (
    <div className={cn('h-4 rounded bg-muted animate-pulse', className)} />
  );
}

export function DataTableSkeleton({ columns, rows = 8, hasCheckbox = true }: DataTableSkeletonProps) {
  const cols = hasCheckbox ? columns + 1 : columns;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center border-b border-border/60 px-4 py-3 gap-4">
        {hasCheckbox && <div className="w-4 h-4 rounded bg-muted animate-pulse shrink-0" />}
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonCell
            key={i}
            className={cn(
              i === 0 ? 'w-10 shrink-0' : 'flex-1',
              i === columns - 1 ? 'w-16 shrink-0 flex-none' : '',
            )}
          />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className={cn(
            'flex items-center border-b border-border/40 px-4 py-3.5 gap-4',
            rowIdx % 2 === 0 ? 'bg-background' : 'bg-muted/20',
          )}
          style={{ animationDelay: `${rowIdx * 40}ms` }}
        >
          {hasCheckbox && (
            <div className="w-4 h-4 rounded bg-muted animate-pulse shrink-0" />
          )}
          {/* Thumbnail */}
          <div className="w-10 h-10 rounded-md bg-muted animate-pulse shrink-0" />
          {/* Name */}
          <div className="flex-[2] flex flex-col gap-1.5">
            <SkeletonCell className="w-3/4 h-3.5" />
            <SkeletonCell className="w-1/3 h-2.5 opacity-50" />
          </div>
          {/* Category */}
          <div className="flex-1 hidden md:block">
            <SkeletonCell className="w-20 h-5 rounded-full" />
          </div>
          {/* Price */}
          <div className="w-20 hidden sm:block">
            <SkeletonCell className="w-full h-3.5" />
          </div>
          {/* Status */}
          <div className="w-20">
            <SkeletonCell className="w-full h-5 rounded-full" />
          </div>
          {/* Actions */}
          <div className="w-8">
            <SkeletonCell className="w-8 h-8 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
