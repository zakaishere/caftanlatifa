import { Package, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DataTableEmptyProps {
  isFiltered?: boolean;
  onClearFilters?: () => void;
  noun?: string;
  createLabel?: string;
  onCreateClick?: () => void;
}

export function DataTableEmpty({
  isFiltered,
  onClearFilters,
  noun = 'records',
  createLabel,
  onCreateClick,
}: DataTableEmptyProps) {
  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
          <SearchX className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">No results found</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Try adjusting your search or filters
          </p>
        </div>
        {onClearFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters} className="mt-1 h-8 text-xs">
            Clear filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
        <Package className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">No {noun} yet</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Get started by creating your first {noun.replace(/s$/, '')}.
        </p>
      </div>
      {createLabel && onCreateClick && (
        <Button size="sm" onClick={onCreateClick} className="mt-1 h-8 text-xs gap-1.5">
          {createLabel}
        </Button>
      )}
    </div>
  );
}
