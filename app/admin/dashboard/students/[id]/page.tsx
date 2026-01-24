"use client";

import { Button } from "@/components/ui/button";
import {
    ArrowLeft, User, Mail, GraduationCap, MapPin, Calendar,
    TrendingUp, Edit2, Trash2, ShieldOff, ShieldCheck, X, Check,
    Loader2, Phone, Store, Globe, Ticket, Wallet
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { studentService } from "@/lib/services/student.service";
import { transactionService } from "@/lib/services/transaction.service";
import { onlineBrandService } from "@/lib/services/online-brand.service";
import { Student, Transaction } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentDetailPage() {
    const router = useRouter();
    const params = useParams();
    const studentId = params.id as string;

    // Data State
    const [student, setStudent] = useState<Student | null>(null);
    const [offlineTransactions, setOfflineTransactions] = useState<Transaction[]>([]);
    const [onlineRedemptions, setOnlineRedemptions] = useState<any[]>([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'offline' | 'online'>('offline');
    const [isEditing, setIsEditing] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState<'suspend' | 'delete' | 'verify' | null>(null);

    // Edit Form State
    const [editedName, setEditedName] = useState("");
    const [editedEmail, setEditedEmail] = useState("");

    useEffect(() => {
        async function fetchData() {
            if (!studentId) return;
            try {
                // Fetch basic student info first to fail fast
                const studentRes = await studentService.getById(studentId);

                if (!studentRes.success || !studentRes.data) {
                    setLoading(false);
                    return;
                }

                // Parallel fetch for history
                const [offlineRes, onlineRes] = await Promise.all([
                    transactionService.getStudentTransactions(studentId),
                    onlineBrandService.getStudentRedemptions(studentId)
                ]);

                // Calculate Real Stats
                const realOfflineTx = offlineRes.success ? offlineRes.data || [] : [];
                const realOnlineTx = onlineRes || [];

                const offlineSavings = realOfflineTx.reduce((sum, tx) => sum + (tx.discountAmount || 0), 0);
                const onlineCount = realOnlineTx.length;

                // TODO: Online savings aren't strictly monetary per reveal, 
                // but we can estimate or just show count.
                // For now, Total Savings = Offline Savings.

                setStudent({
                    ...studentRes.data,
                    totalSavings: offlineSavings,
                    totalRedemptions: realOfflineTx.length + onlineCount
                });
                setEditedName(studentRes.data.name);
                setEditedEmail(studentRes.data.email);

                setOfflineTransactions(realOfflineTx);
                setOnlineRedemptions(realOnlineTx);

            } catch (error) {
                console.error("Error fetching student details:", error);
                toast.error("Failed to load student details");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [studentId]);

    const handleSave = async () => {
        if (!student) return;
        setActionLoading(true);
        try {
            const result = await studentService.update(student.id, {
                name: editedName,
                email: editedEmail
            });
            if (result.success && result.data) {
                setStudent(prev => prev ? ({ ...prev, name: result.data!.name, email: result.data!.email }) : null);
                toast.success("Profile updated");
                setIsEditing(false);
            } else {
                toast.error("Update failed");
            }
        } catch (error) {
            toast.error("Error saving profile");
        } finally {
            setActionLoading(false);
        }
    };

    const handleAction = async () => {
        if (!student || !showConfirmModal) return;
        setActionLoading(true);

        try {
            let success = false;
            let message = "";

            if (showConfirmModal === 'delete') {
                const response = await fetch('/api/admin/delete-student', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        studentId: student.id,
                        userId: (student as any).userId || null,
                        collegeEmail: student.email
                    })
                });
                const result = await response.json();
                success = result.success;
                message = success ? "Student permanently deleted" : (result.error || "Delete failed");

                if (success) {
                    toast.success(message);
                    router.push("/admin/dashboard/students");
                    return;
                }
            } else {
                // Suspend / Verify
                const newStatus = showConfirmModal === 'suspend' ? 'suspended' : 'verified';
                const response = await fetch('/api/admin/student', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ studentId: student.id, status: newStatus })
                });
                const result = await response.json();
                success = result.success;
                message = success ? `Student ${newStatus} successfully` : (result.error || "Action failed");

                if (success) {
                    setStudent(prev => prev ? ({ ...prev, status: newStatus as any }) : null);
                }
            }

            if (success) {
                toast.success(message);
                setShowConfirmModal(null);
            } else {
                toast.error(message);
            }
        } catch (error) {
            console.error("Action error:", error);
            toast.error("An unexpected error occurred");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteProfileImage = async () => {
        if (!student || !confirm("Remove profile image?")) return;
        try {
            const result = await studentService.update(student.id, { profileImage: null });
            if (result.success) {
                setStudent(prev => prev ? ({ ...prev, profileImage: null }) : null);
                toast.success("Image removed");
            }
        } catch (error) {
            toast.error("Failed to remove image");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!student) {
        return (
            <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="h-20 w-20 bg-gray-900 rounded-full flex items-center justify-center mb-4 border border-gray-800">
                    <User className="h-10 w-10 text-gray-500" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Student Not Found</h2>
                <p className="text-gray-400 mb-6">This student profile may have been deleted.</p>
                <Link href="/admin/dashboard/students">
                    <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                        Back to Students
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
                <div className="px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/dashboard/students">
                            <button className="h-10 w-10 rounded-xl bg-gray-900 flex items-center justify-center hover:bg-gray-800 transition-colors border border-gray-800">
                                <ArrowLeft className="h-5 w-5 text-gray-400" />
                            </button>
                        </Link>
                        <h1 className="font-bold text-lg text-white">Student Profile</h1>
                    </div>

                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors text-primary border border-primary/20"
                        >
                            <Edit2 className="h-4 w-4" />
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="h-10 w-10 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={actionLoading}
                                className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-black"
                            >
                                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* ID Card */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 p-8">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
                        {/* Avatar */}
                        <div className="relative group">
                            <div className="h-32 w-32 rounded-3xl bg-gray-800 overflow-hidden border-4 border-gray-800 shadow-2xl">
                                {student.profileImage ? (
                                    <img src={student.profileImage} alt={student.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                        <span className="text-4xl font-bold text-gray-600">{student.name.charAt(0)}</span>
                                    </div>
                                )}
                            </div>
                            {isEditing && student.profileImage && (
                                <button
                                    onClick={handleDeleteProfileImage}
                                    className="absolute -bottom-2 -right-2 h-10 w-10 bg-red-500 rounded-xl flex items-center justify-center text-white shadow-lg hover:bg-red-600 transition-colors"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={cn(
                                        "px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                                        student.status === 'verified' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                            student.status === 'suspended' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                    )}>
                                        {student.status}
                                    </span>
                                    <span className="text-gray-500 text-xs flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Joined {new Date(student.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                {isEditing ? (
                                    <input
                                        value={editedName}
                                        onChange={(e) => setEditedName(e.target.value)}
                                        className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-2xl font-bold text-white w-full max-w-md outline-none focus:border-primary/50"
                                    />
                                ) : (
                                    <h2 className="text-3xl font-bold text-white">{student.name}</h2>
                                )}
                                <p className="text-gray-400 mt-1 flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4" />
                                    {student.college}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                                {isEditing ? (
                                    <input
                                        value={editedEmail}
                                        onChange={(e) => setEditedEmail(e.target.value)}
                                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white outline-none"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" /> {student.email}
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" /> {student.city}, {student.state}
                                </div>
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" /> {student.gender} • {new Date(student.dob).toLocaleDateString()}
                                </div>
                            </div>
                        </div>

                        {/* BB-ID Badge */}
                        <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-2xl p-6 text-center min-w-[200px]">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Backbenchers ID</p>
                            <p className="text-3xl font-mono font-bold text-white tracking-wider">
                                {student.bbId || "PENDING"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                                <Wallet className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-medium text-gray-400">Total Savings</span>
                        </div>
                        <p className="text-3xl font-bold text-white">₹{student.totalSavings.toLocaleString()}</p>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                                <Store className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-medium text-gray-400">In-Store Visits</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{offlineTransactions.length}</p>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                <Globe className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-medium text-gray-400">Online Reveals</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{onlineRedemptions.length}</p>
                    </div>
                </div>

                {/* Activity History Tabs */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-gray-800">
                        <button
                            onClick={() => setActiveTab('offline')}
                            className={cn(
                                "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                                activeTab === 'offline'
                                    ? "border-orange-500 text-orange-500"
                                    : "border-transparent text-gray-400 hover:text-white"
                            )}
                        >
                            In-Store History
                        </button>
                        <button
                            onClick={() => setActiveTab('online')}
                            className={cn(
                                "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                                activeTab === 'online'
                                    ? "border-blue-500 text-blue-500"
                                    : "border-transparent text-gray-400 hover:text-white"
                            )}
                        >
                            Online History
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {activeTab === 'offline' ? (
                            <motion.div
                                key="offline"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden"
                            >
                                {offlineTransactions.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-800/50 text-gray-400 font-medium">
                                                <tr>
                                                    <th className="px-6 py-4">Date</th>
                                                    <th className="px-6 py-4">Merchant</th>
                                                    <th className="px-6 py-4">Offer</th>
                                                    <th className="px-6 py-4 text-right">Saved</th>
                                                    <th className="px-6 py-4 text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-800">
                                                {offlineTransactions.map((tx) => (
                                                    <tr key={tx.id} className="hover:bg-gray-800/30 transition-colors">
                                                        <td className="px-6 py-4 text-gray-400">
                                                            {new Date(tx.redeemedAt).toLocaleDateString()}
                                                            <div className="text-xs opacity-50">{new Date(tx.redeemedAt).toLocaleTimeString()}</div>
                                                        </td>
                                                        <td className="px-6 py-4 font-medium text-white">{tx.merchantName}</td>
                                                        <td className="px-6 py-4 text-gray-300">{tx.offerTitle}</td>
                                                        <td className="px-6 py-4 text-right font-mono text-green-400">₹{tx.discountAmount}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs font-bold">
                                                                COMPLETED
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="p-12 text-center text-gray-500">
                                        <Store className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        <p>No in-store transactions yet</p>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="online"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden"
                            >
                                {onlineRedemptions.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-800/50 text-gray-400 font-medium">
                                                <tr>
                                                    <th className="px-6 py-4">Date</th>
                                                    <th className="px-6 py-4">Brand</th>
                                                    <th className="px-6 py-4">Reason</th>
                                                    <th className="px-6 py-4 text-center">Code</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-800">
                                                {onlineRedemptions.map((redemption) => (
                                                    <tr key={redemption.id} className="hover:bg-gray-800/30 transition-colors">
                                                        <td className="px-6 py-4 text-gray-400">
                                                            {new Date(redemption.revealedAt).toLocaleDateString()}
                                                            <div className="text-xs opacity-50">{new Date(redemption.revealedAt).toLocaleTimeString()}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                {redemption.brandLogo && (
                                                                    <img src={redemption.brandLogo} alt="" className="h-6 w-6 rounded-full" />
                                                                )}
                                                                <span className="font-medium text-white">{redemption.brandName || "Unknown Brand"}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-300">{redemption.offerTitle}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded font-mono text-xs border border-blue-500/20">
                                                                {redemption.offerCode}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="p-12 text-center text-gray-500">
                                        <Globe className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        <p>No online coupon reveals yet</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Dangerous Actions */}
                <div className="pt-8 border-t border-gray-800">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Account Actions</h3>
                    <div className="flex flex-col md:flex-row gap-4">
                        {student.status === 'suspended' ? (
                            <Button
                                onClick={() => setShowConfirmModal('verify')}
                                className="h-12 bg-green-500 hover:bg-green-600 text-black font-bold"
                            >
                                <ShieldCheck className="h-4 w-4 mr-2" /> Reinstate Account
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setShowConfirmModal('suspend')}
                                variant="outline"
                                className="h-12 border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
                            >
                                <ShieldOff className="h-4 w-4 mr-2" /> Suspend Account
                            </Button>
                        )}

                        <Button
                            onClick={() => setShowConfirmModal('delete')}
                            variant="outline"
                            className="h-12 border-red-500/50 text-red-500 hover:bg-red-500/10"
                        >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete Permanently
                        </Button>
                    </div>
                </div>

                {/* Confirmation Modal */}
                <AnimatePresence>
                    {showConfirmModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-gray-900 border border-gray-800 rounded-3xl p-6 w-full max-w-sm"
                            >
                                <h3 className="text-xl font-bold text-white mb-2">
                                    {showConfirmModal === 'delete' ? 'Delete Student?' :
                                        showConfirmModal === 'suspend' ? 'Suspend Student?' :
                                            'Reinstate Student?'}
                                </h3>
                                <p className="text-gray-400 mb-6">
                                    {showConfirmModal === 'delete'
                                        ? "This action cannot be undone. All data will be lost."
                                        : "Are you sure you want to perform this action?"}
                                </p>
                                <div className="flex gap-3">
                                    <Button onClick={() => setShowConfirmModal(null)} variant="ghost" className="flex-1 text-gray-400">
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleAction}
                                        disabled={actionLoading}
                                        className={cn("flex-1",
                                            showConfirmModal === 'delete' ? "bg-red-500 hover:bg-red-600" :
                                                showConfirmModal === 'suspend' ? "bg-orange-500 hover:bg-orange-600" :
                                                    "bg-green-500 hover:bg-green-600"
                                        )}
                                    >
                                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
