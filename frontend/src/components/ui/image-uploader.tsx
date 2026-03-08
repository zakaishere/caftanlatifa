"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

import { useTranslation } from '@/i18n/provider';

interface ImageUploaderProps {
    value: string[];
    onChange: (urls: string[]) => void;
    maxFiles?: number;
}

export function ImageUploader({ value = [], onChange, maxFiles = 5 }: ImageUploaderProps) {
    const { t } = useTranslation();
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (value.length + files.length > maxFiles) {
            toast({
                title: t('imageUploader.errors.tooMany'),
                description: t('imageUploader.errors.tooManyDesc', { max: maxFiles }),
                variant: "destructive"
            });
            return;
        }

        setIsUploading(true);
        const newUrls: string[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                if (!file.type.startsWith('image/')) {
                    throw new Error(t('imageUploader.errors.invalidType'));
                }
                if (file.size > 5 * 1024 * 1024) {
                    throw new Error(t('imageUploader.errors.tooLarge'));
                }

                const formData = new FormData();
                formData.append('image', file);

                // We use fetch directly here instead of apiRequest with JSON to send FormData
                const res = await fetch('/api/admin/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.error?.message || t('imageUploader.errors.genericFailed'));
                }

                const data = await res.json();
                if (data.url) {
                    newUrls.push(data.url);
                }
            }

            if (newUrls.length > 0) {
                onChange([...value, ...newUrls]);
                toast({
                    title: t('imageUploader.success.title'),
                    description: t('imageUploader.success.desc', { count: newUrls.length }),
                });
            }
        } catch (error: any) {
            console.error('Upload Error:', error);
            toast({
                title: t('imageUploader.errors.uploadFailed'),
                description: error.message || t('imageUploader.errors.uploadFailedDesc'),
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Reset input
            }
        }
    };

    const handleRemove = (indexToRemove: number) => {
        onChange(value.filter((_, index) => index !== indexToRemove));
    };

    const moveToPrimary = (indexToMove: number) => {
        if (indexToMove === 0) return;
        const newUrls = [...value];
        const item = newUrls.splice(indexToMove, 1)[0];
        newUrls.unshift(item);
        onChange(newUrls);
    };

    return (
        <div className="space-y-4">
            <div
                className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer text-center"
                onClick={handleUploadClick}
            >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <UploadCloud className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium mb-1">{t('imageUploader.title')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    {t('imageUploader.dropzone', { max: maxFiles })}
                </p>
                <Button type="button" variant="outline" disabled={isUploading || value.length >= maxFiles}>
                    {isUploading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('imageUploader.uploading')}</>
                    ) : (
                        t('imageUploader.browse')
                    )}
                </Button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileChange}
            />

            {value.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium">{t('imageUploader.uploadedCount', { count: value.length, max: maxFiles })}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {value.map((url, index) => (
                            <div key={index} className="relative group rounded-md border bg-muted overflow-hidden aspect-square">
                                <img
                                    src={url}
                                    alt={`Product view ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col p-2">
                                    <div className="flex justify-end gap-1">
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleRemove(index); }}
                                            className="bg-destructive text-destructive-foreground p-1.5 rounded hover:bg-destructive/90 transition-colors"
                                            title={t('imageUploader.remove')}
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                    {index !== 0 && (
                                        <div className="mt-auto">
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); moveToPrimary(index); }}
                                                className="w-full bg-secondary text-secondary-foreground py-1.5 px-2 text-xs font-medium rounded opacity-90 hover:opacity-100"
                                            >
                                                {t('imageUploader.makePrimary')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {index === 0 && (
                                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                                        {t('imageUploader.primary')}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
