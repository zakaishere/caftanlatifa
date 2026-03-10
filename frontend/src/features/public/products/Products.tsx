"use client";
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ApiProduct, ApiCategory, centsToMad } from '@/lib/types';
import { ProductCard } from '@/components/ui/product-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Filter, Search, X, Loader2, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from '@/i18n/provider';

// ─── Debounce hook ────────────────────────────────────────────────────────────
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function ProductsInner() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = searchParams ? searchParams.get('category') : null;
  const searchParam = searchParams ? searchParams.get('search') : null;

  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [searchInput, setSearchInput] = useState(searchParam ?? '');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState<ApiProduct[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const LIMIT = 12;

  // Debounce search by 350ms
  const debouncedSearch = useDebouncedValue(searchInput, 350);

  // ── Reset pagination when any filter changes ────────────────────────────
  const prevFilterRef = useRef('');
  const filterKey = `${selectedCategory}|${debouncedSearch}|${inStockOnly}|${priceRange[0]}|${priceRange[1]}|${sortBy}`;

  useEffect(() => {
    if (prevFilterRef.current && prevFilterRef.current !== filterKey) {
      setPage(1);
      setAllProducts([]);
    }
    prevFilterRef.current = filterKey;
  }, [filterKey]);

  // ── Sync filters to URL ─────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (inStockOnly) params.set('inStock', 'true');
    if (sortBy !== 'newest') params.set('sort', sortBy);
    const qs = params.toString();
    router.replace(`/products${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [selectedCategory, debouncedSearch, inStockOnly, sortBy, router]);

  // ── Categories ──────────────────────────────────────────────────────────
  const { data: initData } = useQuery<{ categories: ApiCategory[] }>({
    queryKey: ['/api/public/init'],
  });
  const categories = initData?.categories ?? [];

  // ── Products (paginated) ────────────────────────────────────────────────
  const { data: pageData, isLoading, isFetching } = useQuery<{
    products: ApiProduct[];
    total: number;
    hasNextPage: boolean;
  }>({
    queryKey: ['/api/public/products', selectedCategory, debouncedSearch, inStockOnly, priceRange[0], priceRange[1], sortBy, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (inStockOnly) params.append('inStock', 'true');
      params.append('minPrice', (priceRange[0] * 100).toString());
      params.append('maxPrice', (priceRange[1] * 100).toString());
      params.append('sort', sortBy);
      params.append('page', page.toString());
      params.append('limit', LIMIT.toString());

      const res = await fetch(`/api/public/products?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  // Accumulate products across pages
  useEffect(() => {
    if (!pageData) return;
    if (page === 1) {
      setAllProducts(pageData.products);
    } else {
      setAllProducts((prev) => {
        const existingIds = new Set(prev.map(p => p.id));
        const newProducts = pageData.products.filter(p => !existingIds.has(p.id));
        return [...prev, ...newProducts];
      });
    }
  }, [pageData, page]);

  const total = pageData?.total ?? 0;
  const hasNextPage = pageData?.hasNextPage ?? false;

  const clearFilters = useCallback(() => {
    setSelectedCategory(null);
    setInStockOnly(false);
    setPriceRange([0, 5000]);
    setSearchInput('');
    setSortBy('newest');
  }, []);

  // Count active filters for badge indicator
  const activeFilterCount = [
    selectedCategory !== null,
    inStockOnly,
    priceRange[0] !== 0 || priceRange[1] !== 5000,
  ].filter(Boolean).length;

  // ── Filter Content (inside the drawer) ────────────────────────────────
  const FiltersContent = () => (
    <div className="space-y-12" suppressHydrationWarning>
      {/* Categories */}
      <div>
        <h3 className="font-serif text-lg text-foreground mb-6 tracking-tight text-start">{t('products.collections')}</h3>
        <div className="space-y-1">
          <Button
            variant="ghost"
            className={`w-full justify-start font-light transition-all rounded-none border-b border-transparent hover:border-primary/20 hover:bg-transparent ${selectedCategory === null ? 'text-primary border-primary/40 font-medium' : 'text-muted-foreground'}`}
            onClick={() => setSelectedCategory(null)}
          >
            {t('products.allPieces')}
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant="ghost"
              className={`w-full justify-start font-light transition-all rounded-none border-b border-transparent hover:border-primary/20 hover:bg-transparent group ${selectedCategory === cat.slug ? 'text-primary border-primary/40 font-medium' : 'text-muted-foreground'}`}
              onClick={() => setSelectedCategory(cat.slug)}
            >
              <span className="flex-1 text-left">{cat.name}</span>
              <span className={`text-[10px] tracking-widest opacity-40 group-hover:opacity-100 transition-opacity`}>
                ({cat._count?.products ?? 0})
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <h3 className="font-serif text-lg text-foreground mb-6 tracking-tight text-start">{t('products.availability')}</h3>
        <div className="flex items-center gap-3 py-2 text-start">
          <Checkbox
            id="stock"
            checked={inStockOnly}
            onCheckedChange={(checked) => setInStockOnly(checked as boolean)}
            className="rounded-none h-4 w-4 border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <label
            htmlFor="stock"
            className="text-sm font-light text-foreground cursor-pointer select-none uppercase tracking-widest text-start"
          >
            {t('products.inStockOnly')}
          </label>
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-serif text-lg text-foreground mb-6 tracking-tight text-start">{t('products.price')}</h3>
        <div className="px-1 text-start" dir="ltr">
          <Slider
            defaultValue={[0, 5000]}
            max={5000}
            step={100}
            value={priceRange}
            onValueChange={setPriceRange}
            className="mb-8"
          />
        </div>
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-foreground" dir="ltr">
          <span>{priceRange[0]} {t('common.currency')}</span>
          <span>{priceRange[1]} {t('common.currency')}</span>
        </div>
      </div>

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <Button
          variant="link"
          className="p-0 h-auto text-[10px] uppercase tracking-[0.3em] text-primary hover:text-primary/70 transition-colors w-full justify-start"
          onClick={clearFilters}
        >
          {t('products.resetFilters')}
        </Button>
      )}
    </div>
  );

  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-12 py-12 md:py-20" suppressHydrationWarning>

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-10 mb-16 md:mb-20">
        <div className="flex flex-col items-center text-center">
          <h1 className="font-serif text-5xl md:text-6xl text-foreground mb-6 tracking-tight">
            {selectedCategory
              ? categories.find(c => c.slug === selectedCategory)?.name
              : t('products.titlePrefix')}
          </h1>
          <div className="h-[1px] w-20 bg-primary/40 mb-6" />
          <p className="text-muted-foreground font-light uppercase tracking-[0.3em] text-[10px]">
            {isLoading && page === 1
              ? t('products.loading')
              : total > 0
                ? t('products.piecesCount', { count: total })
                : t('products.noProducts')}
          </p>
        </div>

        {/* ── Toolbar: Search + Filters Button + Sort ──────────────────── */}
        <div className="flex items-center gap-4 border-y border-primary/10 py-5">
          {/* Search */}
          <div className="relative group flex-1 max-w-xs text-start">
            <Search className="absolute start-0 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 group-focus-within:text-primary transition-colors rtl:-scale-x-100" />
            <Input
              type="search"
              placeholder={t('products.searchPlaceholder')}
              className="ps-8 h-10 bg-transparent border-none rounded-none focus-visible:ring-0 placeholder:text-muted-foreground/40 font-light"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Filters button — opens drawer on both desktop and mobile */}
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="relative h-10 rounded-none border-primary/20 px-6 font-light uppercase tracking-widest text-[10px] gap-2 hover:border-primary transition-all"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {t('products.filters')}
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -end-1.5 h-4 w-4 bg-primary text-black text-[8px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>

            {/* ── Filters Drawer ──────────────────────────────────────── */}
            <SheetContent
              side="left"
              className="w-[320px] sm:w-[380px] rounded-none border-r border-primary/10 bg-background p-0 flex flex-col text-start"
            >
              <SheetHeader className="px-8 pt-8 pb-6 border-b border-primary/10 text-start">
                <div className="flex items-center justify-between">
                  <SheetTitle className="font-serif text-2xl tracking-tight text-start">{t('products.filters')}</SheetTitle>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[10px] uppercase tracking-widest font-light text-primary hover:text-primary/70 hover:bg-transparent p-0 h-auto"
                      onClick={clearFilters}
                    >
                      {t('products.reset')}
                    </Button>
                  )}
                </div>
                {activeFilterCount > 0 && (
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 text-start">
                    {t('products.activeFilters', { count: activeFilterCount })}
                  </p>
                )}
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-8 py-8 text-start">
                {/* Sort (inside drawer as well) */}
                <div className="mb-12">
                  <h3 className="font-serif text-lg text-foreground mb-6 tracking-tight text-start">{t('products.sortBy')}</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { value: 'newest', label: t('products.sortOptions.newest') },
                      { value: 'price_asc', label: t('products.sortOptions.priceAsc') },
                      { value: 'price_desc', label: t('products.sortOptions.priceDesc') },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setSortBy(opt.value)}
                        className={`py-3 px-4 text-left text-[10px] uppercase tracking-widest transition-all border ${sortBy === opt.value
                          ? 'border-primary bg-primary/5 text-primary font-medium'
                          : 'border-primary/10 text-muted-foreground hover:border-primary/30'
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator className="bg-primary/10 mb-12" />

                <FiltersContent />
              </div>

              {/* Apply CTA */}
              <div className="px-8 py-6 border-t border-primary/10">
                <SheetClose asChild>
                  <Button className="w-full h-12 rounded-none uppercase tracking-[0.3em] text-[10px]">
                    {total > 0 ? t('products.applyFilters', { count: total }) : t('products.applyFiltersEmpty')}
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>

          {/* Sort dropdown — desktop only, mirrored inside drawer for mobile */}
          <div className="hidden md:flex items-center gap-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{t('products.sort')}</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-10 w-[200px] border-none bg-transparent rounded-none focus:ring-0 font-medium text-foreground uppercase tracking-widest text-[11px] p-0" dir="ltr">
                <SelectValue placeholder={t('products.sortOptions.newest')} />
              </SelectTrigger>
              <SelectContent className="rounded-none border-primary/10 bg-background shadow-2xl">
                <SelectItem value="newest" className="text-[11px] uppercase tracking-widest">{t('products.sortOptions.newest')}</SelectItem>
                <SelectItem value="price_asc" className="text-[11px] uppercase tracking-widest">{t('products.sortOptions.priceAsc')}</SelectItem>
                <SelectItem value="price_desc" className="text-[11px] uppercase tracking-widest">{t('products.sortOptions.priceDesc')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Product Grid (full width now) ──────────────────────────────── */}
      <div suppressHydrationWarning>
        {isLoading && page === 1 ? (
          <div className="flex justify-center py-40">
            <div className="flex flex-col items-center gap-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary opacity-40" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground animate-pulse text-center">{t('products.loading')}</span>
            </div>
          </div>
        ) : allProducts.length > 0 ? (
          <>
            {/* 2 cols mobile → 3 md → 4 lg */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-10 gap-y-10 md:gap-y-20">
              {allProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Load More */}
            {hasNextPage && (
              <div className="flex flex-col items-center gap-8 pt-20">
                <div className="h-[1px] w-40 bg-primary/10" />
                <Button
                  variant="outline"
                  className="group relative rounded-none border-primary/20 px-12 py-8 h-auto overflow-hidden transition-all duration-500 hover:border-primary"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isFetching}
                >
                  <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  <span className="relative z-10 text-[10px] uppercase tracking-[0.4em] font-medium group-hover:text-black transition-colors">
                    {isFetching ? t('products.loading') : t('products.loadMore')}
                  </span>
                </Button>
                <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60">
                  {t('products.showingCount', { current: allProducts.length, total: total })}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 text-center border border-primary/10 bg-muted/5">
            <Search className="h-10 w-10 text-primary/20 mb-8" />
            <h3 className="font-serif text-2xl text-foreground mb-4">{t('products.noResultsTitle')}</h3>
            <p className="text-muted-foreground font-light max-w-sm text-sm tracking-wide leading-relaxed px-6">
              {t('products.noResultsDesc')}
            </p>
            <Button
              variant="outline"
              onClick={clearFilters}
              className="mt-10 rounded-none border-primary/20 uppercase tracking-[0.2em] text-[10px] px-8"
            >
              {t('products.reset')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Products() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={
      <div className="py-20 text-center">
        <Search className="h-12 w-12 mx-auto text-muted-foreground/50 animate-pulse mb-4" />
        <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[11px]">{t('products.loading')}</p>
      </div>
    }>
      <ProductsInner />
    </Suspense>
  );
}
