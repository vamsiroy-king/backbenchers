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

        // For simplicity, we'll upload the original file
        // A full implementation would use canvas to crop
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
            const result = await merchantService.uploadImage(type, file);

            if (result.success && result.data) {
                const img: UploadedImage = {
                    id: Date.now().toString(),
                    name: file.name,
                    preview: previewUrl,
                    url: result.data
                };
                callback(img);
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
            router.push("/merchant/onboarding/passcode");
        }
    };

    // Calculate smart grid layout for store photos
    const getStorePhotoLayout = () => {
        const count = storeImages.length;
        if (count === 0) return "grid-cols-1";
        if (count === 1) return "grid-cols-1";
        if (count === 2) return "grid-cols-2";
        if (count <= 4) return "grid-cols-2";
        return "grid-cols-3";
    };

    return (
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center py-4">
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
                        className="fixed inset-0 z-[100] bg-black/90 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-black/50">
                            <button onClick={closeCropper} className="text-white text-sm">
                                Cancel
                            </button>
                            <span className="text-white font-semibold">
                                {cropState.type === 'logo' ? 'Adjust Logo' : 'Adjust Cover'}
                            </span>
                            <button
                                onClick={applyCropAndUpload}
                                disabled={uploading !== null}
                                className="text-primary font-semibold text-sm"
                            >
                                {uploading ? 'Uploading...' : 'Done'}
                            </button>
                        </div>

                        {/* Image Preview */}
                        <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
                            <div
                                className={`relative overflow-hidden bg-gray-900 ${cropState.type === 'logo'
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
                                <div className="absolute inset-0 border-2 border-white/30 pointer-events-none" />
                                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                                    {[...Array(9)].map((_, i) => (
                                        <div key={i} className="border border-white/10" />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="bg-black/50 px-6 py-4 space-y-4">
                            {/* Zoom */}
                            <div className="flex items-center gap-4">
                                <ZoomOut className="h-5 w-5 text-gray-400" />
                                <input
                                    type="range"
                                    min="0.5"
                                    max="2"
                                    step="0.1"
                                    value={cropState.scale}
                                    onChange={(e) => setCropState({ ...cropState, scale: parseFloat(e.target.value) })}
                                    className="flex-1 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer"
                                />
                                <ZoomIn className="h-5 w-5 text-gray-400" />
                            </div>
                            <p className="text-center text-xs text-gray-400">
                                Pinch or drag to adjust • Tap Done to save
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Phone Frame */}
            <div className="w-full max-w-[430px] h-[932px] bg-black rounded-[55px] shadow-[0_0_0_3px_#3a3a3a,0_25px_60px_rgba(0,0,0,0.5)] relative overflow-hidden">
                <div className="absolute inset-[12px] bg-white rounded-[45px] overflow-hidden">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 h-7 w-28 bg-black rounded-full z-[9999]" />

                    <div className="h-full w-full overflow-y-auto pt-12 pb-8 px-6 scrollbar-hide">
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-6">
                            <Link href="/merchant/onboarding/location">
                                <button className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                            </Link>
                            <div>
                                <h1 className="text-xl font-extrabold">Photos & Documents</h1>
                                <p className="text-xs text-gray-500">Step 3 of 3</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="flex gap-2 mb-8">
                            <div className="h-1.5 flex-1 bg-primary rounded-full" />
                            <div className="h-1.5 flex-1 bg-primary rounded-full" />
                            <div className="h-1.5 flex-1 bg-primary rounded-full" />
                        </div>

                        {/* Error message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-50 text-red-500 p-3 rounded-xl text-sm mb-4"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div className="space-y-6">
                            {/* Branding Section */}
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Branding</p>

                                {/* Logo Upload - Square */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold">Logo</span>
                                            <span className="text-[10px] text-gray-400">(Optional)</span>
                                        </div>
                                        {logo && (
                                            <button
                                                onClick={() => setLogo(null)}
                                                className="h-6 w-6 bg-red-100 rounded-full flex items-center justify-center"
                                            >
                                                <X className="h-3 w-3 text-red-500" />
                                            </button>
                                        )}
                                    </div>
                                    {logo ? (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="relative rounded-2xl overflow-hidden w-28 h-28"
                                        >
                                            <img src={logo.preview} alt="Logo" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                <Check className="h-6 w-6 text-white" />
                                            </div>
                                        </motion.div>
                                    ) : uploading === 'logo' ? (
                                        <div className="bg-gray-100 rounded-2xl flex items-center justify-center w-28 h-28">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => logoInputRef.current?.click()}
                                            className="w-28 h-28 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-colors"
                                        >
                                            <Camera className="h-6 w-6 text-gray-400" />
                                            <span className="text-[10px] text-gray-500">Square</span>
                                        </button>
                                    )}
                                </div>

                                {/* Cover Photo Upload - Horizontal 16:9 */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold">Cover Photo</span>
                                            <span className="text-[10px] text-gray-400">(Optional)</span>
                                        </div>
                                        {coverPhoto && (
                                            <button
                                                onClick={() => setCoverPhoto(null)}
                                                className="h-6 w-6 bg-red-100 rounded-full flex items-center justify-center"
                                            >
                                                <X className="h-3 w-3 text-red-500" />
                                            </button>
                                        )}
                                    </div>
                                    {coverPhoto ? (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="relative rounded-2xl overflow-hidden aspect-[16/9]"
                                        >
                                            <img src={coverPhoto.preview} alt="Cover" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                <Check className="h-8 w-8 text-white" />
                                            </div>
                                        </motion.div>
                                    ) : uploading === 'cover' ? (
                                        <div className="bg-gray-100 rounded-2xl flex items-center justify-center aspect-[16/9]">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => coverInputRef.current?.click()}
                                            className="w-full border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors aspect-[16/9]"
                                        >
                                            <Camera className="h-8 w-8 text-gray-400" />
                                            <span className="text-xs text-gray-500">Tap to upload (16:9)</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Store Images Section */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Store Photos</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                            Minimum 3 photos required • {storeImages.length}/10 uploaded
                                        </p>
                                    </div>
                                    {!hasMinimumImages && (
                                        <span className="text-[10px] text-red-500 font-medium">
                                            {3 - storeImages.length} more needed
                                        </span>
                                    )}
                                </div>

                                {/* Smart Grid Layout */}
                                <div className={`grid ${getStorePhotoLayout()} gap-2`}>
                                    {storeImages.map((img, index) => (
                                        <motion.div
                                            key={img.id}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            layout
                                            className={`relative rounded-xl overflow-hidden ${storeImages.length === 1 ? 'aspect-video' :
                                                storeImages.length === 3 && index === 0 ? 'col-span-2 aspect-video' :
                                                    'aspect-square'
                                                }`}
                                        >
                                            <img src={img.preview} alt="Store" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => removeStoreImage(img.id)}
                                                className="absolute top-2 right-2 h-6 w-6 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center"
                                            >
                                                <X className="h-3 w-3 text-white" />
                                            </button>
                                        </motion.div>
                                    ))}

                                    {/* Add button */}
                                    {storeImages.length < 10 && (
                                        <button
                                            onClick={() => storeInputRef.current?.click()}
                                            disabled={uploading === 'store'}
                                            className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-colors aspect-square"
                                        >
                                            {uploading === 'store' ? (
                                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                            ) : (
                                                <>
                                                    <Plus className="h-6 w-6 text-gray-400" />
                                                    <span className="text-[10px] text-gray-500">Add Photo</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Continue Button */}
                        <motion.div className="mt-8">
                            <Button
                                onClick={handleSubmit}
                                disabled={!hasMinimumImages || uploading !== null}
                                className="w-full h-14 bg-primary text-white font-bold rounded-2xl text-base disabled:opacity-50"
                            >
                                {uploading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        Continue
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>

                            {!hasMinimumImages && (
                                <p className="text-center text-xs text-gray-400 mt-3">
                                    Please add at least 3 store photos
                                </p>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
