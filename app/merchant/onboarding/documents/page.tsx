"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, X, Check, Camera, Plus, Loader2, Crop, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { merchantService } from "@/lib/services/merchant.service";

interface UploadedImage {
    id: string;
    name: string;
    preview: string;
    url?: string;
    aspectRatio?: number; // width/height - tracks original image dimensions
}

interface CropState {
    isOpen: boolean;
    type: 'logo' | 'cover' | null;
    file: File | null;
    preview: string;
    scale: number;
    offsetX: number;
    offsetY: number;
}

export default function DocumentsPage() {
    const router = useRouter();
    const [logo, setLogo] = useState<UploadedImage | null>(null);
    const [coverPhoto, setCoverPhoto] = useState<UploadedImage | null>(null);
    const [storeImages, setStoreImages] = useState<UploadedImage[]>([]);
    const [uploading, setUploading] = useState<string | null>(null);
    const [error, setError] = useState("");

    // Crop modal state
    const [cropState, setCropState] = useState<CropState>({
        isOpen: false,
        type: null,
        file: null,
        preview: "",
        scale: 1,
        offsetX: 0,
        offsetY: 0
    });

    // File input refs
    const logoInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const storeInputRef = useRef<HTMLInputElement>(null);
    const cropImageRef = useRef<HTMLImageElement>(null);

    // Load saved data from localStorage
    useEffect(() => {
        const savedDocs = localStorage.getItem('merchant_documents');
        if (savedDocs) {
            try {
                const data = JSON.parse(savedDocs);
                if (data.logo) setLogo(data.logo);
                if (data.coverPhoto) setCoverPhoto(data.coverPhoto);
                if (data.storeImages) setStoreImages(data.storeImages);
            } catch (e) {
                console.error('Error loading saved documents:', e);
            }
        }
    }, []);

    // Save to localStorage whenever images change
    useEffect(() => {
        const data = { logo, coverPhoto, storeImages };
        localStorage.setItem('merchant_documents', JSON.stringify(data));
    }, [logo, coverPhoto, storeImages]);

    // Open crop modal for logo/cover
    const openCropper = (file: File, type: 'logo' | 'cover') => {
        const preview = URL.createObjectURL(file);
        setCropState({
            isOpen: true,
            type,
            file,
            preview,
            scale: 1,
            offsetX: 0,
            offsetY: 0
        });
    };

    // Close crop modal
    const closeCropper = () => {
        if (cropState.preview) {
            URL.revokeObjectURL(cropState.preview);
        }
        setCropState({
            isOpen: false,
            type: null,
            file: null,
            preview: "",
            scale: 1,
            offsetX: 0,
            offsetY: 0
        });
    };

    // Apply crop and upload
    const applyCropAndUpload = async () => {
        if (!cropState.file || !cropState.type) return;

        await handleFileUpload(cropState.file, cropState.type, (img) => {
            if (cropState.type === 'logo') {
                setLogo(img);
            } else {
                setCoverPhoto(img);
            }
        });
        closeCropper();
    };

    // Real file upload to Supabase
    const handleFileUpload = async (
        file: File,
        type: 'logo' | 'cover' | 'store',
        callback: (img: UploadedImage) => void
    ) => {
        setUploading(type);
        setError("");

        try {
            const previewUrl = URL.createObjectURL(file);

            // Get image dimensions for aspect ratio (for store photos)
            let aspectRatio: number | undefined;
            if (type === 'store') {
                const img = new Image();
                await new Promise<void>((resolve) => {
                    img.onload = () => {
                        aspectRatio = img.width / img.height;
                        resolve();
                    };
                    img.onerror = () => resolve();
                    img.src = previewUrl;
                });
            }

            const result = await merchantService.uploadImage(type, file);

            if (result.success && result.data) {
                const imgData: UploadedImage = {
                    id: Date.now().toString(),
                    name: file.name,
                    preview: previewUrl,
                    url: result.data,
                    aspectRatio
                };
                callback(imgData);
            } else {
                setError(result.error || "Failed to upload image");
                URL.revokeObjectURL(previewUrl);
            }
        } catch (error: any) {
            setError(error.message || "Failed to upload image");
        } finally {
            setUploading(null);
        }
    };

    const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            openCropper(file, 'logo');
        }
        e.target.value = '';
    };

    const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            openCropper(file, 'cover');
        }
        e.target.value = '';
    };

    const handleStoreImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && storeImages.length < 10) {
            handleFileUpload(file, 'store', (img) => {
                setStoreImages([...storeImages, img]);
            });
        }
        e.target.value = '';
    };

    const removeStoreImage = (id: string) => {
        setStoreImages(storeImages.filter(img => img.id !== id));
    };

    const hasMinimumImages = storeImages.length >= 3;

    const handleSubmit = () => {
        if (hasMinimumImages) {
            router.push("/merchant/onboarding/store-timings");
        }
    };

    // Helper to get CSS class for image based on aspect ratio
    const getImageStyle = (img: UploadedImage, index: number) => {
        const ratio = img.aspectRatio || 1;

        // Vertical photo (portrait like 9:16)
        if (ratio < 0.8) {
            return 'row-span-2';
        }
        // Horizontal photo (landscape like 16:9)
        if (ratio > 1.2) {
            return 'col-span-2';
        }
        // Square-ish
        return '';
    };

    return (
        <div className="min-h-screen bg-black">
            {/* Hidden file inputs */}
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverSelect} />
            <input ref={storeInputRef} type="file" accept="image/*" className="hidden" onChange={handleStoreImageSelect} />

            {/* Image Cropper Modal */}
            <AnimatePresence>
                {cropState.isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[#222]">
                            <button onClick={closeCropper} className="text-white/60 text-sm font-medium">
                                Cancel
                            </button>
                            <span className="text-white font-semibold">
                                {cropState.type === 'logo' ? 'Adjust Logo' : 'Adjust Cover'}
                            </span>
                            <button
                                onClick={applyCropAndUpload}
                                disabled={uploading !== null}
                                className="text-green-400 font-semibold text-sm"
                            >
                                {uploading ? 'Uploading...' : 'Done'}
                            </button>
                        </div>

                        {/* Image Preview */}
                        <div className="flex-1 flex items-center justify-center overflow-hidden p-6">
                            <div
                                className={`relative overflow-hidden bg-[#111] border border-[#333] ${cropState.type === 'logo'
                                    ? 'w-64 h-64 rounded-2xl'
                                    : 'w-full max-w-md aspect-[16/9] rounded-2xl'
                                    }`}
                            >
                                <img
                                    ref={cropImageRef}
                                    src={cropState.preview}
                                    alt="Crop preview"
                                    className="w-full h-full object-cover"
                                    style={{
                                        transform: `scale(${cropState.scale}) translate(${cropState.offsetX}px, ${cropState.offsetY}px)`
                                    }}
                                />
                                {/* Crop overlay guides */}
                                <div className="absolute inset-0 border-2 border-green-500/30 pointer-events-none" />
                                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                                    {[...Array(9)].map((_, i) => (
                                        <div key={i} className="border border-white/10" />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="px-6 py-5 border-t border-[#222] space-y-4">
                            {/* Zoom */}
                            <div className="flex items-center gap-4">
                                <ZoomOut className="h-5 w-5 text-[#666]" />
                                <input
                                    type="range"
                                    min="0.5"
                                    max="2"
                                    step="0.1"
                                    value={cropState.scale}
                                    onChange={(e) => setCropState({ ...cropState, scale: parseFloat(e.target.value) })}
                                    className="flex-1 h-1 bg-[#333] rounded-full appearance-none cursor-pointer accent-green-500"
                                />
                                <ZoomIn className="h-5 w-5 text-[#666]" />
                            </div>
                            <p className="text-center text-xs text-[#555]">
                                Pinch or drag to adjust • Tap Done to save
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-[#222]">
                <div className="px-5 py-4 flex items-center gap-4">
                    <Link href="/merchant/onboarding/business">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="h-10 w-10 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center hover:bg-[#222] transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 text-white" />
                        </motion.button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-white">Photos & Documents</h1>
                        <p className="text-xs text-[#666]">Step 2 of 3</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="px-5 pb-4 flex gap-2">
                    <div className="h-1 flex-1 bg-green-500 rounded-full" />
                    <div className="h-1 flex-1 bg-green-500 rounded-full" />
                    <div className="h-1 flex-1 bg-[#222] rounded-full" />
                </div>
            </header>

            {/* Main Content */}
            <main className="px-5 py-6 pb-32">
                {/* Error message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm mb-6"
                    >
                        {error}
                    </motion.div>
                )}

                <div className="space-y-8">
                    {/* Branding Section */}
                    <section>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <Camera className="h-4 w-4 text-purple-400" />
                            </div>
                            <span className="text-sm font-semibold text-white">Branding</span>
                        </div>

                        {/* Logo Upload - Square */}
                        <div className="mb-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-white">Logo</span>
                                    <span className="text-[10px] text-[#555]">(Optional)</span>
                                </div>
                                {logo && (
                                    <button
                                        onClick={() => setLogo(null)}
                                        className="h-6 w-6 bg-red-500/10 rounded-full flex items-center justify-center hover:bg-red-500/20 transition-colors"
                                    >
                                        <X className="h-3 w-3 text-red-400" />
                                    </button>
                                )}
                            </div>
                            {logo ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="relative rounded-2xl overflow-hidden w-28 h-28 border border-[#333]"
                                >
                                    <img src={logo.url || logo.preview} alt="Logo" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <Check className="h-6 w-6 text-green-400" />
                                    </div>
                                </motion.div>
                            ) : uploading === 'logo' ? (
                                <div className="bg-[#111] border border-[#333] rounded-2xl flex items-center justify-center w-28 h-28">
                                    <Loader2 className="h-6 w-6 animate-spin text-green-400" />
                                </div>
                            ) : (
                                <button
                                    onClick={() => logoInputRef.current?.click()}
                                    className="w-28 h-28 border-2 border-dashed border-[#333] rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-green-500/50 hover:bg-green-500/5 transition-all"
                                >
                                    <Camera className="h-6 w-6 text-[#555]" />
                                    <span className="text-[10px] text-[#555]">Square</span>
                                </button>
                            )}
                        </div>

                        {/* Cover Photo Upload - Horizontal 16:9 */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-white">Cover Photo</span>
                                    <span className="text-[10px] text-[#555]">(Optional)</span>
                                </div>
                                {coverPhoto && (
                                    <button
                                        onClick={() => setCoverPhoto(null)}
                                        className="h-6 w-6 bg-red-500/10 rounded-full flex items-center justify-center hover:bg-red-500/20 transition-colors"
                                    >
                                        <X className="h-3 w-3 text-red-400" />
                                    </button>
                                )}
                            </div>
                            {coverPhoto ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="relative rounded-2xl overflow-hidden aspect-[16/9] border border-[#333]"
                                >
                                    <img src={coverPhoto.url || coverPhoto.preview} alt="Cover" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <Check className="h-8 w-8 text-green-400" />
                                    </div>
                                </motion.div>
                            ) : uploading === 'cover' ? (
                                <div className="bg-[#111] border border-[#333] rounded-2xl flex items-center justify-center aspect-[16/9]">
                                    <Loader2 className="h-8 w-8 animate-spin text-green-400" />
                                </div>
                            ) : (
                                <button
                                    onClick={() => coverInputRef.current?.click()}
                                    className="w-full border-2 border-dashed border-[#333] rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-green-500/50 hover:bg-green-500/5 transition-all aspect-[16/9]"
                                >
                                    <Camera className="h-8 w-8 text-[#555]" />
                                    <span className="text-xs text-[#555]">Tap to upload (16:9)</span>
                                </button>
                            )}
                        </div>
                    </section>

                    {/* Store Images Section */}
                    <section>
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Camera className="h-4 w-4 text-blue-400" />
                                </div>
                                <div>
                                    <span className="text-sm font-semibold text-white block">Store Photos</span>
                                    <span className="text-[10px] text-[#555]">
                                        Minimum 3 photos • {storeImages.length}/10 uploaded
                                    </span>
                                </div>
                            </div>
                            {!hasMinimumImages && (
                                <span className="text-[10px] text-red-400 font-medium bg-red-500/10 px-2 py-1 rounded-full">
                                    {3 - storeImages.length} more needed
                                </span>
                            )}
                        </div>

                        {/* Responsive Grid with Smart Aspect Ratios */}
                        <div className="grid grid-cols-2 gap-3 auto-rows-fr">
                            {storeImages.map((img, index) => {
                                const ratio = img.aspectRatio || 1;
                                // Determine if image is portrait, landscape, or square
                                const isPortrait = ratio < 0.8;
                                const isLandscape = ratio > 1.2;

                                return (
                                    <motion.div
                                        key={img.id}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        layout
                                        className={`relative rounded-xl overflow-hidden border border-[#333] bg-[#111] ${isLandscape ? 'col-span-2' : ''
                                            }`}
                                        style={{
                                            // Use paddingTop trick to maintain aspect ratio
                                            aspectRatio: isPortrait ? '3/4' : isLandscape ? '16/9' : '1/1'
                                        }}
                                    >
                                        <img
                                            src={img.url || img.preview}
                                            alt="Store"
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={() => removeStoreImage(img.id)}
                                            className="absolute top-2 right-2 h-7 w-7 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/80 transition-colors z-10"
                                        >
                                            <X className="h-3.5 w-3.5 text-white" />
                                        </button>
                                    </motion.div>
                                );
                            })}

                            {/* Add button */}
                            {storeImages.length < 10 && (
                                <button
                                    onClick={() => storeInputRef.current?.click()}
                                    disabled={uploading === 'store'}
                                    className="border-2 border-dashed border-[#333] rounded-xl flex flex-col items-center justify-center gap-2 hover:border-green-500/50 hover:bg-green-500/5 transition-all min-h-[140px]"
                                    style={{ aspectRatio: '1/1' }}
                                >
                                    {uploading === 'store' ? (
                                        <Loader2 className="h-6 w-6 animate-spin text-green-400" />
                                    ) : (
                                        <>
                                            <Plus className="h-6 w-6 text-[#555]" />
                                            <span className="text-[10px] text-[#555]">Add Photo</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </section>
                </div>
            </main>

            {/* Fixed Bottom Button */}
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black via-black to-transparent">
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={!hasMinimumImages || uploading !== null}
                    className="w-full h-14 bg-green-500 hover:bg-green-400 disabled:bg-[#333] disabled:text-[#666] text-black font-bold rounded-2xl text-base flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/20 disabled:shadow-none"
                >
                    {uploading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <>
                            Continue
                            <ArrowRight className="h-5 w-5" />
                        </>
                    )}
                </motion.button>

                {!hasMinimumImages && (
                    <p className="text-center text-xs text-[#555] mt-3">
                        Please add at least 3 store photos
                    </p>
                )}
            </div>
        </div>
    );
}
