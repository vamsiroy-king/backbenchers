"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Mail, GraduationCap, MapPin, Calendar, TrendingUp, Edit2, Trash2, ShieldOff, ShieldCheck, X, Check, Loader2, Phone } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { studentService } from "@/lib/services/student.service";
import { transactionService } from "@/lib/services/transaction.service";
import { Student, Transaction } from "@/lib/types";

export default function StudentDetailPage() {
    const router = useRouter();
    const params = useParams();
    const studentId = params.id as string;

    const [student, setStudent] = useState<Student | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState("");
    const [editedEmail, setEditedEmail] = useState("");
    const [showConfirmModal, setShowConfirmModal] = useState<'suspend' | 'delete' | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Fetch real student data from Supabase
    useEffect(() => {
        async function fetchStudent() {
            if (!studentId) return;

            try {
                const result = await studentService.getById(studentId);
                if (result.success && result.data) {
                    // Fetch transactions first to calculate real stats
                    const txResult = await transactionService.getStudentTransactions(studentId);

                    // Calculate real stats from transactions
                    let realSavings = 0;
                    let realRedemptions = 0;

                    if (txResult.success && txResult.data) {
                        realRedemptions = txResult.data.length;
                        realSavings = txResult.data.reduce((sum, tx) => sum + (tx.discountAmount || 0), 0);
                        setTransactions(txResult.data);
                    }

                    // Override student stats with calculated values
                    setStudent({
                        ...result.data,
                        totalSavings: realSavings,
                        totalRedemptions: realRedemptions
                    });
                    setEditedName(result.data.name);
                    setEditedEmail(result.data.email);
                } else {
                    console.error("Student not found");
                }
            } catch (error) {
                console.error("Error fetching student:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchStudent();
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
                setStudent(result.data);
            }
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating student:", error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAction = async (action: 'suspend' | 'delete' | 'verify') => {
        if (!student) return;
        setActionLoading(true);

        try {
            console.log('Performing action:', action, 'on student:', student.id);

            if (action === 'delete') {
                const result = await studentService.delete(student.id);
                console.log('Delete result:', result);
                if (result.success) {
                    router.push("/admin/dashboard/students");
                } else {
                    alert('Failed to delete student: ' + (result.error || 'Unknown error'));
                }
            } else if (action === 'suspend') {
                const result = await studentService.updateStatus(student.id, 'suspended');
                console.log('Suspend result:', result);
                if (result.success) {
                    setStudent({ ...student, status: 'suspended' });
                    alert('Student suspended successfully!');
                } else {
                    alert('Failed to suspend student: ' + (result.error || 'Unknown error'));
                }
                setShowConfirmModal(null);
            } else if (action === 'verify') {
                const result = await studentService.updateStatus(student.id, 'verified');
                console.log('Reinstate result:', result);
                if (result.success) {
                    setStudent({ ...student, status: 'verified' });
                    alert('Student reinstated successfully!');
                } else {
                    alert('Failed to reinstate student: ' + (result.error || 'Unknown error'));
                }
            }
        } catch (error: any) {
            console.error("Error performing action:", error);
            alert('Error: ' + (error.message || 'Unknown error occurred'));
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'verified': return 'bg-green-100 text-green-700 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'suspended': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const handleDeleteProfileImage = async () => {
        if (!student) return;

        // Confirm before delete
        if (!confirm("Delete this profile image?")) return;

        try {
            setActionLoading(true);
            const result = await studentService.update(student.id, { profileImage: null });

            if (result.success && result.data) {
                setStudent(result.data);
            } else {
                alert("Failed to delete image: " + result.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Not found state
    if (!student) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
                <User className="h-16 w-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-600 mb-2">Student Not Found</h2>
                <p className="text-gray-400 text-sm mb-6">This student doesn't exist or was deleted.</p>
                <Link href="/admin/dashboard/students">
                    <Button className="rounded-xl">Back to Students</Button>
                </Link>
            </div>
        );
    }

    // Format DOB for display
    const formatDob = (dob: string) => {
        if (!dob) return 'Not set';
        return new Date(dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-white pb-32 pt-12">
            {/* Confirm Modal */}
            <AnimatePresence>
                {showConfirmModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-white rounded-3xl p-6 w-full max-w-sm"
                        >
                            <div className={`h-16 w-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${showConfirmModal === 'delete' ? 'bg-red-100' : 'bg-orange-100'}`}>
                                {showConfirmModal === 'delete' ? (
                                    <Trash2 className="h-8 w-8 text-red-500" />
                                ) : (
                                    <ShieldOff className="h-8 w-8 text-orange-500" />
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-center mb-2">
                                {showConfirmModal === 'delete' ? 'Delete Student?' : 'Suspend Student?'}
                            </h3>
                            <p className="text-gray-500 text-sm text-center mb-6">
                                {showConfirmModal === 'delete'
                                    ? `This will permanently remove ${student.name} from the platform.`
                                    : `${student.name} will not be able to use their student ID until reinstated.`
                                }
                            </p>
                            <div className="flex gap-3">
                                <Button onClick={() => setShowConfirmModal(null)} variant="outline" className="flex-1 h-12 rounded-xl" disabled={actionLoading}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => handleAction(showConfirmModal)}
                                    disabled={actionLoading}
                                    className={`flex-1 h-12 rounded-xl ${showConfirmModal === 'delete' ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'} text-white`}
                                >
                                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100">
                <div className="px-4 h-14 flex items-center gap-3">
                    <Link href="/admin/dashboard/students">
                        <button className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="font-extrabold text-lg">Student Details</h1>
                    </div>
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center"
                        >
                            <Edit2 className="h-4 w-4 text-primary" />
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={() => setIsEditing(false)} className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
                                <X className="h-4 w-4" />
                            </button>
                            <button onClick={handleSave} disabled={actionLoading} className="h-9 w-9 rounded-full bg-primary flex items-center justify-center">
                                {actionLoading ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Check className="h-4 w-4 text-white" />}
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className="px-4 pt-6 space-y-6">
                {/* Profile Card with BB-ID */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" />

                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-20 w-20 rounded-2xl bg-white/10 overflow-hidden border-2 border-white/20 flex items-center justify-center relative group">
                            {student.profileImage ? (
                                <>
                                    <img src={student.profileImage} alt={student.name} className="w-full h-full object-cover" />
                                    {isEditing && (
                                        <button
                                            onClick={handleDeleteProfileImage}
                                            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm cursor-pointer"
                                            title="Delete Profile Picture"
                                        >
                                            <Trash2 className="h-6 w-6 text-red-400" />
                                        </button>
                                    )}
                                </>
                            ) : (
                                <span className="text-3xl font-bold text-white/60">{student.name.charAt(0)}</span>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(student.status)} mb-2`}>
                                {student.status.toUpperCase()}
                            </div>
                            {isEditing ? (
                                <input
                                    value={editedName}
                                    onChange={(e) => setEditedName(e.target.value)}
                                    className="w-full bg-white/10 rounded-lg px-3 py-2 text-white text-lg font-bold outline-none"
                                />
                            ) : (
                                <h2 className="text-xl font-bold">{student.name}</h2>
                            )}
                            <p className="text-white/60 text-sm">{student.college}</p>
                        </div>
                    </div>

                    {/* BB-ID - Prominent */}
                    <div className="bg-primary/30 border border-primary/50 rounded-xl px-4 py-3 text-center">
                        <p className="text-xs text-white/60 uppercase tracking-widest mb-1">Student ID</p>
                        <p className="text-2xl font-mono font-black tracking-widest text-white">{student.bbId || 'Pending'}</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-primary/10 rounded-2xl p-4">
                        <TrendingUp className="h-5 w-5 text-primary mb-2" />
                        <p className="text-2xl font-extrabold">₹{student.totalSavings?.toLocaleString() || 0}</p>
                        <p className="text-xs text-gray-500">Total Saved</p>
                    </div>
                    <div className="bg-blue-50 rounded-2xl p-4">
                        <div className="text-blue-500 text-xl mb-2">🎟️</div>
                        <p className="text-2xl font-extrabold">{student.totalRedemptions || 0}</p>
                        <p className="text-xs text-gray-500">Redemptions</p>
                    </div>
                </div>

                {/* Details */}
                <div className="space-y-3">
                    <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider">Student Details</h3>
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-gray-400" />
                            {isEditing ? (
                                <input
                                    value={editedEmail}
                                    onChange={(e) => setEditedEmail(e.target.value)}
                                    className="flex-1 bg-white rounded-lg px-3 py-2 text-sm border border-gray-200 outline-none"
                                />
                            ) : (
                                <span className="text-sm">{student.email}</span>
                            )}
                        </div>
                        {student.phone && (
                            <div className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-gray-400" />
                                <span className="text-sm font-medium">{student.phone}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <GraduationCap className="h-5 w-5 text-gray-400" />
                            <span className="text-sm">{student.college}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-gray-400" />
                            <span className="text-sm">{student.city}, {student.state}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-gray-400" />
                            <span className="text-sm">DOB: {formatDob(student.dob)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-gray-400" />
                            <span className="text-sm">Gender: {student.gender || 'Not set'}</span>
                        </div>
                        {student.createdAt && (
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-gray-400" />
                                <span className="text-sm">Registered: {new Date(student.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Transactions */}
                {transactions.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider">Recent Transactions</h3>
                        <div className="space-y-2">
                            {transactions.slice(0, 5).map((tx) => (
                                <div key={tx.id} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-sm">{tx.merchantName || 'Merchant'}</p>
                                        <p className="text-xs text-gray-500">{tx.offerTitle || 'Offer'} • {new Date(tx.redeemedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                    </div>
                                    <span className="text-primary font-bold text-sm">₹{tx.discountAmount}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3 pt-4">
                    {student.status === 'suspended' ? (
                        <Button
                            onClick={() => handleAction('verify')}
                            disabled={actionLoading}
                            className="w-full h-14 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl"
                        >
                            {actionLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <ShieldCheck className="h-5 w-5 mr-2" />}
                            Reinstate Student
                        </Button>
                    ) : (
                        <Button
                            onClick={() => setShowConfirmModal('suspend')}
                            variant="outline"
                            className="w-full h-14 border-orange-200 text-orange-600 font-bold rounded-2xl"
                        >
                            <ShieldOff className="h-5 w-5 mr-2" /> Suspend Student
                        </Button>
                    )}
                    <Button
                        onClick={() => setShowConfirmModal('delete')}
                        variant="outline"
                        className="w-full h-14 border-red-200 text-red-500 font-bold rounded-2xl"
                    >
                        <Trash2 className="h-5 w-5 mr-2" /> Delete Student
                    </Button>
                </div>
            </main>
        </div>
    );
}
