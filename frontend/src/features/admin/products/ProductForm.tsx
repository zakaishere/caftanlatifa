"use client";

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ImageUploader } from '@/components/ui/image-uploader';
import { apiRequest } from '@/lib/queryClient';
import { ApiProduct, ApiCategory, centsToMad, PRODUCT_SIZES, ProductSize } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from '@/i18n/provider';

const generateId = () => Math.random().toString(36).substring(2, 9);

interface ProductFormProps {
    onSuccess?: () => void;
    initialData?: ApiProduct | null;
}

export function ProductForm({ onSuccess, initialData }: ProductFormProps) {
    const { toast } = useToast();
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [name, setName] = useState(initialData?.name || '');
    const [priceMad, setPriceMad] = useState(initialData ? centsToMad(initialData.price) : '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
    const [images, setImages] = useState<string[]>(initialData?.images || []);
    const [inStock, setInStock] = useState(initialData ? initialData.inStock : true);
    const [availableSizes, setAvailableSizes] = useState<ProductSize[]>(
        initialData?.availableSizes ?? []
    );
    const [specialities, setSpecialities] = useState<{ id: string, name: string, value: string }[]>(
        initialData?.specs
            ? Object.entries(initialData.specs).map(([name, value]) => ({ id: generateId(), name, value: String(value) }))
            : []
    );

    // Fetch categories for the select dropdown
    const { data: categories = [], isLoading: isLoadingCategories } = useQuery<ApiCategory[]>({
        queryKey: ['/api/admin/categories'],
        queryFn: async () => {
            const res = await apiRequest('GET', '/api/admin/categories');
            return res.json();
        }
    });

    const isEdit = !!initialData;
    const createMutation = useMutation({
        mutationFn: async (payload: any) => {
            const method = isEdit ? 'PATCH' : 'POST';
            const url = isEdit ? `/api/admin/products/${initialData.id}` : '/api/admin/products';
            const res = await apiRequest(method, url, payload);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
            toast({ title: isEdit ? t('admin.productForm.toast.updated') : t('admin.productForm.toast.created') });
            onSuccess?.();
        },
        onError: (err: Error) => {
            toast({ title: isEdit ? t('admin.productForm.toast.errorUpdating') : t('admin.productForm.toast.errorCreating'), description: err.message, variant: 'destructive' });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !priceMad || !description || !categoryId || images.length === 0) {
            toast({ title: t('admin.productForm.validationError'), description: t('admin.productForm.validationErrorDesc'), variant: 'destructive' });
            return;
        }

        const priceCents = Math.round(parseFloat(priceMad) * 100);

        // Convert specialities array to Record<string, string>
        const specs: Record<string, string> = {};
        specialities.forEach(s => {
            if (s.name.trim() && s.value.trim()) {
                specs[s.name.trim()] = s.value.trim();
            }
        });

        const payload = {
            name,
            price: priceCents,
            description,
            categoryId,
            images,
            inStock,
            specs,
            availableSizes,
        };

        createMutation.mutate(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 text-start">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">{t('admin.productForm.name')}</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder={t('admin.productForm.namePlaceholder')}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="price">{t('admin.productForm.price')}</Label>
                    <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={priceMad}
                        onChange={e => setPriceMad(e.target.value)}
                        placeholder="0.00"
                        required
                        dir="ltr"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="category">{t('admin.productForm.category')}</Label>
                    <Select value={categoryId} onValueChange={setCategoryId} required>
                        <SelectTrigger className="text-start">
                            <SelectValue placeholder={isLoadingCategories ? t('admin.productForm.loadingCategory') : t('admin.productForm.categoryPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent className="text-start">
                            {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id} className="text-start">{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* ─── Available Sizes ─────────────────────────────────────── */}
            <div className="space-y-3">
                <Label className="text-base font-bold">{t('admin.productForm.availableSizes')}</Label>
                <p className="text-xs text-muted-foreground">{t('admin.productForm.availableSizesHint')}</p>
                <div className="flex flex-wrap gap-2">
                    {PRODUCT_SIZES.map((size) => {
                        const selected = availableSizes.includes(size);
                        return (
                            <button
                                key={size}
                                type="button"
                                onClick={() =>
                                    setAvailableSizes(prev =>
                                        selected ? prev.filter(s => s !== size) : [...prev, size]
                                    )
                                }
                                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest border rounded-none transition-all ${selected
                                        ? 'bg-primary text-white border-primary shadow-sm'
                                        : 'bg-background border-border text-muted-foreground hover:border-primary hover:text-primary'
                                    }`}
                            >
                                {size}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">{t('admin.productForm.description')}</Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder={t('admin.productForm.descriptionPlaceholder')}
                    required
                />
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-base font-bold">{t('admin.productForm.specialities')}</Label>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSpecialities([...specialities, { id: generateId(), name: '', value: '' }])}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" /> {t('admin.productForm.addSpeciality')}
                    </Button>
                </div>

                {specialities.length > 0 ? (
                    <div className="space-y-3">
                        {specialities.map((spec, index) => (
                            <div key={spec.id} className="flex flex-col sm:flex-row items-end gap-3 group">
                                <div className="flex-1 space-y-2 w-full">
                                    <Label className="text-xs text-muted-foreground">{t('admin.productForm.specName')}</Label>
                                    <Input
                                        placeholder={t('admin.productForm.specNamePlaceholder')}
                                        value={spec.name}
                                        onChange={(e) => {
                                            const newSpecs = [...specialities];
                                            newSpecs[index].name = e.target.value;
                                            setSpecialities(newSpecs);
                                        }}
                                    />
                                </div>
                                <div className="flex-1 space-y-2 w-full">
                                    <Label className="text-xs text-muted-foreground">{t('admin.productForm.specValue')}</Label>
                                    <Input
                                        placeholder={t('admin.productForm.specValuePlaceholder')}
                                        value={spec.value}
                                        onChange={(e) => {
                                            const newSpecs = [...specialities];
                                            newSpecs[index].value = e.target.value;
                                            setSpecialities(newSpecs);
                                        }}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive"
                                    onClick={() => setSpecialities(specialities.filter(s => s.id !== spec.id))}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground italic border border-dashed rounded-lg p-4 text-center">
                        {t('admin.productForm.noSpecialities')}
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Label>{t('admin.productForm.images')}</Label>
                <ImageUploader
                    value={images}
                    onChange={setImages}
                    maxFiles={5}
                />
            </div>

            <div className="flex items-center space-x-2 pb-4 space-x-reverse">
                <Switch
                    id="in-stock"
                    checked={inStock}
                    onCheckedChange={setInStock}
                />
                <Label htmlFor="in-stock" className="rtl:mr-2">{t('admin.productForm.inStock')}</Label>
            </div>

            <div className="flex justify-end pt-4 border-t">
                <Button
                    type="submit"
                    disabled={createMutation.isPending || images.length === 0}
                >
                    {createMutation.isPending && <Loader2 className="rtl:ml-2 ltr:mr-2 h-4 w-4 animate-spin" />}
                    {isEdit ? t('admin.productForm.updateProduct') : t('admin.productForm.createProduct')}
                </Button>
            </div>
        </form>
    );
}
