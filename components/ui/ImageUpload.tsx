import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ImageUploadProps {
    value?: string | null;
    onChange: (url: string) => void;
    bucketName?: string;
    folderPath?: string;
    className?: string;
    label?: string;
    aspectRatio?: 'video' | 'square' | 'wide';
}

export function ImageUpload({
    value,
    onChange,
    bucketName = 'campaigns',
    folderPath = 'banners',
    className,
    label = "Upload Image",
    aspectRatio = 'video'
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            setError("File size must be less than 5MB");
            return;
        }

        if (!file.type.startsWith('image/')) {
            setError("Only image files are allowed");
            return;
        }

        try {
            setIsUploading(true);
            setError(null);

            const fileExt = file.name.split('.').pop();
            const fileName = `${folderPath}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(fileName);

            onChange(publicUrl);
        } catch (err: any) {
            console.error('Upload failed:', err);
            setError(err.message || "Failed to upload image");
        } finally {
            setIsUploading(false);
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
    };

    const aspectRatioClasses = {
        video: 'aspect-video',
        square: 'aspect-square',
        wide: 'aspect-[21/9]'
    };

    return (
        <div className={cn("space-y-2", className)}>
            {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}

            <div
                onClick={() => !value && inputRef.current?.click()}
                className={cn(
                    "relative group border-2 border-dashed rounded-xl transition-all overflow-hidden cursor-pointer",
                    error ? "border-red-500 bg-red-50" : "border-gray-200 dark:border-gray-800 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-white/[0.02]",
                    aspectRatioClasses[aspectRatio],
                    "flex flex-col items-center justify-center text-center p-4",
                    value ? "border-solid border-gray-100" : ""
                )}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                    disabled={isUploading}
                />

                {isUploading ? (
                    <div className="flex flex-col items-center gap-2 text-primary">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="text-sm font-medium">Uploading...</span>
                    </div>
                ) : value ? (
                    <>
                        <div className="absolute inset-0">
                            <Image
                                src={value}
                                alt="Upload"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    inputRef.current?.click();
                                }}
                                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
                                title="Replace Image"
                                type="button"
                            >
                                <Upload className="h-4 w-4" />
                            </button>
                            <button
                                onClick={handleRemove}
                                className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full backdrop-blur-md transition-colors"
                                title="Remove Image"
                                type="button"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-3 text-gray-400 group-hover:text-primary transition-colors">
                        <div className="p-3 bg-gray-100 dark:bg-gray-900 rounded-full group-hover:bg-primary/10 transition-colors">
                            <Upload className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Click to upload
                            </p>
                            <p className="text-xs text-gray-500">
                                SVG, PNG, JPG or GIF (max. 5MB)
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
        </div>
    );
}
