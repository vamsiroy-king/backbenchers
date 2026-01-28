"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, CheckCircle, XCircle, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categoryService, Category } from "@/lib/services/category.service";
import { toast } from "sonner";
import Image from "next/image";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Partial<Category>>({});
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        const result = await categoryService.getAllAdmin();
        if (result.success && result.data) {
            setCategories(result.data);
        } else {
            toast.error("Failed to load categories");
        }
        setLoading(false);
    };

    const handleOpenEdit = (category?: Category) => {
        if (category) {
            setEditingCategory({ ...category });
        } else {
            setEditingCategory({
                name: "",
                tagline: "",
                gradient_from: "orange-100",
                gradient_to: "orange-200",
                icon: "",
                display_order: categories.length + 1,
                is_active: true
            });
        }
        setImageFile(null);
        setIsEditModalOpen(true);
    };

    const handleSave = async () => {
        if (!editingCategory.name) return toast.error("Name is required");
        setSaving(true);

        try {
            let imageUrl = editingCategory.image_url;

            // Upload Image if selected
            if (imageFile) {
                const uploadResult = await categoryService.uploadImage(imageFile);
                if (uploadResult.success && uploadResult.data) {
                    imageUrl = uploadResult.data;
                } else {
                    throw new Error("Image upload failed");
                }
            }

            const dataToSave = { ...editingCategory, image_url: imageUrl };

            if (editingCategory.id) {
                // Update
                const result = await categoryService.update(editingCategory.id, dataToSave);
                if (result.success) toast.success("Category updated");
                else throw new Error(result.error || "Failed to update category");
            } else {
                // Create
                const result = await categoryService.create(dataToSave);
                if (result.success) toast.success("Category created");
                else throw new Error(result.error || "Failed to create category");
            }

            setIsEditModalOpen(false);
            loadCategories();
        } catch (error: any) {
            toast.error(error.message || "Failed to save category");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This cannot be undone.")) return;
        const result = await categoryService.delete(id);
        if (result.success) {
            toast.success("Category deleted");
            loadCategories();
        } else {
            toast.error("Failed to delete category");
        }
    };


    const toggleStatus = async (id: string, currentStatus: boolean) => {
        const result = await categoryService.toggleStatus(id, !currentStatus);
        if (result.success) {
            toast.success(`Category ${!currentStatus ? 'activated' : 'deactivated'}`);
            loadCategories();
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-white/50" /></div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Categories</h1>
                    <p className="text-white/50">Manage app categories, images, and styling.</p>
                </div>
                <Button onClick={() => handleOpenEdit()} className="bg-green-500 hover:bg-green-600 text-black font-bold">
                    <Plus className="mr-2 h-4 w-4" /> Add Category
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categories.map((cat) => (
                    <div key={cat.id} className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden flex flex-col group">
                        {/* Preview Area */}
                        <div className={`h-48 relative flex items-center justify-center bg-gradient-to-br from-${cat.gradient_from} to-${cat.gradient_to}`}>
                            {cat.image_url ? (
                                <Image
                                    src={cat.image_url}
                                    alt={cat.name}
                                    fill
                                    className="object-cover mix-blend-overlay opacity-80"
                                />
                            ) : (
                                <ImageIcon className="h-10 w-10 text-white/20" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />

                            <div className="relative z-10 text-center p-4">
                                <span className="text-3xl mb-2 block">{cat.icon}</span>
                                <h3 className="text-xl font-bold text-white mb-1">{cat.name}</h3>
                                <p className="text-xs text-white/70">{cat.tagline}</p>
                            </div>

                            {/* Status Badge */}
                            <div className="absolute top-3 right-3 z-20">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${cat.is_active ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                    {cat.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 bg-zinc-900 flex items-center justify-between mt-auto border-t border-white/10">
                            <div className="text-xs text-white/30 font-mono">
                                Order: {cat.display_order}
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-white/10" onClick={() => handleOpenEdit(cat)}>
                                    <Pencil className="h-4 w-4 text-blue-400" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-white/10" onClick={() => toggleStatus(cat.id, cat.is_active)}>
                                    {cat.is_active ? <XCircle className="h-4 w-4 text-orange-400" /> : <CheckCircle className="h-4 w-4 text-green-400" />}
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-white/10" onClick={() => handleDelete(cat.id)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="bg-zinc-900 border border-white/10 text-white sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingCategory.id ? 'Edit Category' : 'New Category'}</DialogTitle>
                        <DialogDescription>Configure display settings and upload cover image.</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Name</Label>
                            <Input
                                value={editingCategory.name || ''}
                                onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                className="col-span-3 bg-white/5 border-white/10"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Tagline</Label>
                            <Input
                                value={editingCategory.tagline || ''}
                                onChange={(e) => setEditingCategory({ ...editingCategory, tagline: e.target.value })}
                                className="col-span-3 bg-white/5 border-white/10"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Icon (Emoji)</Label>
                            <Input
                                value={editingCategory.icon || ''}
                                onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                                className="col-span-3 bg-white/5 border-white/10"
                                placeholder="e.g. 🍕"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Order</Label>
                            <Input
                                type="number"
                                value={editingCategory.display_order || 0}
                                onChange={(e) => setEditingCategory({ ...editingCategory, display_order: parseInt(e.target.value) })}
                                className="col-span-3 bg-white/5 border-white/10"
                            />
                        </div>

                        {/* Gradient Colors */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Gradient From</Label>
                            <Input
                                value={editingCategory.gradient_from || ''}
                                onChange={(e) => setEditingCategory({ ...editingCategory, gradient_from: e.target.value })}
                                className="col-span-3 bg-white/5 border-white/10"
                                placeholder="e.g. orange-100"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Gradient To</Label>
                            <Input
                                value={editingCategory.gradient_to || ''}
                                onChange={(e) => setEditingCategory({ ...editingCategory, gradient_to: e.target.value })}
                                className="col-span-3 bg-white/5 border-white/10"
                                placeholder="e.g. orange-200"
                            />
                        </div>

                        {/* Image Upload */}
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right pt-2">Image</Label>
                            <div className="col-span-3">
                                <div className="flex items-center gap-4">
                                    {(imageFile || editingCategory.image_url) && (
                                        <div className="h-16 w-16 relative rounded-lg overflow-hidden border border-white/20">
                                            <Image
                                                src={imageFile ? URL.createObjectURL(imageFile) : editingCategory.image_url!}
                                                alt="Preview"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    )}
                                    <Input
                                        type="file"
                                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                        className="bg-white/5 border-white/10 file:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-green-500 text-black">
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
