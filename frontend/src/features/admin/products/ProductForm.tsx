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
import { ApiProduct, ApiCategory, centsToMad } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';

const generateId = () => Math.random().toString(36).substring(2, 9);

interface ProductFormProps {
    onSuccess?: () => void;
    initialData?: ApiProduct | null;
}

export function ProductForm({ onSuccess, initialData }: ProductFormProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [name, setName] = useState(initialData?.name || '');
    const [priceMad, setPriceMad] = useState(initialData ? centsToMad(initialData.price) : '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
    const [images, setImages] = useState<string[]>(initialData?.images || []);
    const [inStock, setInStock] = useState(initialData ? initialData.inStock : true);
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
            toast({ title: `Product ${isEdit ? 'updated' : 'created'} successfully` });
            onSuccess?.();
        },
        onError: (err: Error) => {
            toast({ title: `Error ${isEdit ? 'updating' : 'creating'} product`, description: err.message, variant: 'destructive' });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !priceMad || !description || !categoryId || images.length === 0) {
            toast({ title: 'Validation Error', description: 'Please fill all required fields, including at least 1 image.', variant: 'destructive' });
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
            specs
        };

        createMutation.mutate(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. T-Shirt"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="price">Price (MAD) *</Label>
                    <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={priceMad}
                        onChange={e => setPriceMad(e.target.value)}
                        placeholder="0.00"
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={categoryId} onValueChange={setCategoryId} required>
                        <SelectTrigger>
                            <SelectValue placeholder={isLoadingCategories ? "Loading..." : "Select a category"} />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Detailed description of the product..."
                    required
                />
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-base font-bold">Specialities (Specifications)</Label>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSpecialities([...specialities, { id: generateId(), name: '', value: '' }])}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" /> Add Speciality
                    </Button>
                </div>

                {specialities.length > 0 ? (
                    <div className="space-y-3">
                        {specialities.map((spec, index) => (
                            <div key={spec.id} className="flex items-end gap-3 group">
                                <div className="flex-1 space-y-2">
                                    <Label className="text-xs text-muted-foreground">Name</Label>
                                    <Input
                                        placeholder="e.g. Material"
                                        value={spec.name}
                                        onChange={(e) => {
                                            const newSpecs = [...specialities];
                                            newSpecs[index].name = e.target.value;
                                            setSpecialities(newSpecs);
                                        }}
                                    />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <Label className="text-xs text-muted-foreground">Value</Label>
                                    <Input
                                        placeholder="e.g. Leather"
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
                        No specialities added. Click "Add Speciality" to add details like Material, Color, or Size.
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Label>Product Images *</Label>
                <ImageUploader
                    value={images}
                    onChange={setImages}
                    maxFiles={5}
                />
            </div>

            <div className="flex items-center space-x-2 pb-4">
                <Switch
                    id="in-stock"
                    checked={inStock}
                    onCheckedChange={setInStock}
                />
                <Label htmlFor="in-stock">In Stock (Available for purchase)</Label>
            </div>

            <div className="flex justify-end pt-4 border-t">
                <Button
                    type="submit"
                    disabled={createMutation.isPending || images.length === 0}
                >
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEdit ? 'Update Product' : 'Create Product'}
                </Button>
            </div>
        </form>
    );
}
