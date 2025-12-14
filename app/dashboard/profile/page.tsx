"use client";

import { Button } from "@/components/ui/button";
import { BBQRCode } from "@/components/ui/qr-code";
import { QrCode, RefreshCcw, LogOut, Settings, Lock, ShieldCheck, ChevronRight, Camera, TrendingUp, Store, Globe, Wallet, X, AlertCircle, Check, Info, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { studentService } from "@/lib/services/student.service";
import { transactionService } from "@/lib/services/transaction.service";
import { authService } from "@/lib/services/auth.service";
import { Student, Transaction } from "@/lib/types";

export default function ProfilePage() {
    const router = useRouter();
    const [isFlipped, setIsFlipped] = useState(false);
    const [hasProfileImage, setHasProfileImage] = useState(false);
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showInstructions, setShowInstructions] = useState(true); // Show instructions first
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Real data from Supabase
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState<Student | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isVerified, setIsVerified] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Fetch student profile and transactions
    useEffect(() => {
        async function fetchProfile() {
            try {
                // First check if user is authenticated
                const hasSession = await authService.hasActiveSession();
                if (!hasSession) {
                    setLoading(false);
                    return;
                }

                const profileResult = await studentService.getMyProfile();
                if (profileResult.success && profileResult.data) {
                    setStudent(profileResult.data);
                    // Show profile view if student exists (pending OR verified)
                    setIsVerified(true);
                    setHasProfileImage(!!profileResult.data.profileImage);
                    setCapturedImage(profileResult.data.profileImage || null);

                    // Fetch transaction history
                    const txResult = await transactionService.getStudentTransactions(profileResult.data.id);
                    if (txResult.success && txResult.data) {
                        setTransactions(txResult.data);
                    }

                    // Subscribe to savings updates -> Refetch transactions to keep everything in sync
                    const studentId = profileResult.data.id;
                    transactionService.subscribeToStudentSavings(studentId, () => {
                        transactionService.getStudentTransactions(studentId).then(res => {
                            if (res.success && res.data) {
                                setTransactions(res.data);
                                // Also update user profile to get latest total if needed, though we calc from tx now
                                studentService.getMyProfile().then(p => {
                                    if (p.success && p.data) setStudent(p.data);
                                });
                            }
                        });
                    });
                } else {
                    // No student record found - show guest view
                    setIsVerified(false);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                setIsVerified(false);
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, []);

    // Calculate real-time savings breakdown
    const savingsStats = transactions.reduce((acc, tx) => {
        const amount = tx.discountAmount || 0;
        acc.total += amount;

        // CORRECTION: All transactions from the scanner are "Offline" (In-Store) savings.
        // The 'paymentMethod' (Cash/Online) refers to how they paid the bill, NOT the offer type.
        // "Online" savings would be for digital services (e.g. Spotify) which are not scanned.
        acc.offline += amount;

        return acc;
    }, { total: 0, offline: 0, online: 0 });

    const totalRedemptions = transactions.length;

    const profileImage = capturedImage || (hasProfileImage ? student?.profileImage : null);

    const handleSignOut = async () => {
        await authService.logout();
        router.push("/");
    };

    // Camera functions
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: 480, height: 480 }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera error:", err);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const capturePhoto = async () => {
        if (!videoRef.current || !student) return;

        setIsCapturing(true);
        try {
            const canvas = document.createElement("canvas");
            canvas.width = 480;
            canvas.height = 480;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                // Mirror the capture to match preview
                ctx.translate(480, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(videoRef.current, 0, 0, 480, 480);
                // Reset transform
                ctx.setTransform(1, 0, 0, 1, 0, 0);

                const imageData = canvas.toDataURL("image/jpeg", 0.9);

                // Stop camera immediately
                stopCamera();
                setCapturedImage(imageData);

                // Convert base64 to File and upload to Supabase
                setIsSaving(true);
                try {
                    const response = await fetch(imageData);
                    const blob = await response.blob();
                    const file = new File([blob], 'profile-selfie.jpg', { type: 'image/jpeg' });

                    const result = await studentService.updateProfileImage(file);
                    if (result.success && result.data) {
                        // Update local state with saved URL
                        setCapturedImage(result.data);
                        setHasProfileImage(true);
                        // Update student object
                        setStudent(prev => prev ? { ...prev, profileImage: result.data || undefined } : null);
                    } else {
                        console.error('Failed to save profile image:', result.error);
                        // Keep local image even if upload fails
                        setHasProfileImage(true);
                    }
                } catch (err) {
                    console.error('Error uploading image:', err);
                    setHasProfileImage(true);
                } finally {
                    setIsSaving(false);
                }

                setShowCameraModal(false);
                setShowInstructions(true); // Reset for next time (if ever)
            }
        } finally {
            setIsCapturing(false);
        }
    };

    const openCameraModal = () => {
        if (hasProfileImage) return; // Can't change once set
        setShowInstructions(true); // Always show instructions first
        setShowCameraModal(true);
    };

    useEffect(() => {
        if (showCameraModal) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [showCameraModal]);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Guest View - Get Verified CTA (only if no student record found)
    if (!isVerified || !student) {
        return (
            <div className="min-h-screen bg-white pb-28 px-4">
                <header className="py-6">
                    <h1 className="text-2xl font-bold">Profile</h1>
                </header>

                <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 text-white shadow-2xl mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-16 w-16 rounded-2xl bg-gray-800 flex items-center justify-center">
                            <Lock className="h-8 w-8 text-gray-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Guest User</h2>
                            <p className="text-gray-400 text-sm">Not verified</p>
                        </div>
                    </div>

                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                        Verify your student status to unlock exclusive discounts and access your digital ID card.
                    </p>

                    <Link href="/signup">
                        <Button className="w-full h-12 bg-white text-black font-bold rounded-xl hover:bg-gray-100 shadow-lg">
                            <ShieldCheck className="mr-2 h-5 w-5" />
                            Get Verified Now
                        </Button>
                    </Link>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold text-lg">Why Verify?</h3>

                    {[
                        { icon: "🎓", title: "Digital Student ID", desc: "Access your ID anywhere, anytime" },
                        { icon: "💰", title: "Exclusive Discounts", desc: "Up to 50% off at 100+ brands" },
                        { icon: "📍", title: "Location Perks", desc: "Real-time offers near you" },
                        { icon: "⚡", title: "Flash Deals", desc: "Time-limited student specials" },
                    ].map((benefit, i) => (
                        <motion.div
                            key={i}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl"
                        >
                            <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">
                                {benefit.icon}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-sm">{benefit.title}</h4>
                                <p className="text-xs text-gray-500">{benefit.desc}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-300" />
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    }

    // Verified User View - Full Profile with ID Card
    return (
        <div className="min-h-screen bg-white pb-28 px-4">
            {/* Camera Modal */}
            <AnimatePresence>
                {showCameraModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black flex flex-col"
                    >
                        {/* Header */}
                        <div className="pt-12 px-4 pb-4 flex items-center justify-between">
                            <button onClick={() => { setShowCameraModal(false); stopCamera(); }}>
                                <X className="h-6 w-6 text-white" />
                            </button>
                            <span className="text-white text-sm font-semibold">Profile Selfie</span>
                            <div className="w-6" />
                        </div>

                        {/* Instructions Screen */}
                        {showInstructions ? (
                            <div className="flex-1 px-6 overflow-y-auto pb-24">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center mb-6 pt-4"
                                >
                                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Camera className="h-10 w-10 text-emerald-400" />
                                    </div>
                                    <h2 className="text-white text-xl font-bold mb-1">Selfie Guidelines</h2>
                                    <p className="text-gray-400 text-sm">Follow these rules for verification</p>
                                </motion.div>

                                <div className="space-y-3 mb-6">
                                    {[
                                        { icon: "📸", text: "Take a clear selfie of your face" },
                                        { icon: "👤", text: "Only your face should be visible" },
                                        { icon: "💡", text: "Ensure good lighting on your face" },
                                        { icon: "📐", text: "Keep face centered in the circle" },
                                        { icon: "🚫", text: "No sunglasses, masks or filters" },
                                    ].map((item, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5"
                                        >
                                            <span className="text-lg">{item.icon}</span>
                                            <span className="text-white text-sm">{item.text}</span>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 mb-6">
                                    <p className="text-red-300 text-sm text-center font-medium">
                                        ⚠️ This photo is <strong>permanent</strong> and cannot be changed.
                                        <br />
                                        <span className="text-red-400/80 text-xs">
                                            If store staff cannot verify your identity, you won't receive discounts.
                                        </span>
                                    </p>
                                </div>

                                <Button
                                    onClick={() => { setShowInstructions(false); startCamera(); }}
                                    className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl text-base"
                                >
                                    <Camera className="mr-2 h-5 w-5" />
                                    I Understand, Open Camera
                                </Button>
                            </div>
                        ) : (
                            /* Camera Capture Screen */
                            <div className="flex-1 flex flex-col items-center justify-center px-6">
                                <div className="relative mb-6">
                                    {/* Face guide circle */}
                                    <div className="relative">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-72 h-72 rounded-full object-cover transform scale-x-[-1]"
                                        />
                                        {/* Animated border */}
                                        <div className="absolute inset-0 rounded-full border-4 border-emerald-400 pointer-events-none"
                                            style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' }} />
                                        {/* Corner guides */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-52 h-52 border-2 border-white/30 border-dashed rounded-full" />
                                        </div>
                                    </div>

                                    {/* Saving indicator */}
                                    {isSaving && (
                                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                            <div className="text-center">
                                                <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-2" />
                                                <span className="text-white text-sm">Saving...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <p className="text-white/80 text-sm mb-6 text-center">
                                    Position your face inside the circle<br />
                                    <span className="text-gray-400 text-xs">Not too close, not too far</span>
                                </p>

                                <Button
                                    onClick={capturePhoto}
                                    disabled={isCapturing || isSaving}
                                    className="h-14 px-10 bg-white text-black font-bold rounded-full text-base disabled:opacity-50"
                                >
                                    {isCapturing ? (
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    ) : (
                                        <Camera className="mr-2 h-5 w-5" />
                                    )}
                                    {isCapturing ? 'Capturing...' : 'Take Photo'}
                                </Button>

                                <p className="text-orange-400 text-xs text-center mt-6 px-8">
                                    Photo cannot be changed after capture
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Info Modal */}
            <AnimatePresence>
                {showInfoModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
                        onClick={() => setShowInfoModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl p-6 w-full max-w-sm"
                        >
                            <h3 className="font-bold text-lg mb-4">Why Profile Photo?</h3>
                            <div className="space-y-4 text-sm text-gray-600">
                                <div className="flex items-start gap-3">
                                    <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                    <p>Used for offline verification at stores. Merchants verify your face matches your profile.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Lock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                    <p>Once added, the photo cannot be changed to prevent misuse of student discounts.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Camera className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                    <p>Only selfie capture is allowed - no gallery uploads.</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => setShowInfoModal(false)}
                                className="w-full h-12 bg-primary text-white font-bold rounded-xl mt-6"
                            >
                                Got it!
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="py-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold">My ID</h1>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Settings className="h-5 w-5" />
                </Button>
            </header>

            {/* Profile Photo Warning */}
            {!hasProfileImage && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-orange-100 rounded-2xl p-4 mb-4 flex items-start gap-3"
                >
                    <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-orange-800">Profile Photo Required</p>
                        <p className="text-xs text-orange-700 mt-1">
                            Add a selfie to use offline discounts. Without it, merchants cannot verify you.
                        </p>
                        <div className="flex gap-2 mt-3">
                            <Button
                                onClick={openCameraModal}
                                size="sm"
                                className="h-8 bg-orange-600 text-white text-xs font-semibold rounded-lg"
                            >
                                <Camera className="h-3 w-3 mr-1" /> Add Selfie
                            </Button>
                            <Button
                                onClick={() => setShowInfoModal(true)}
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs font-semibold rounded-lg"
                            >
                                <Info className="h-3 w-3 mr-1" /> Why?
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Premium 3D Flip ID Card */}
            <div
                className="relative w-full aspect-[1.7/1] mb-4 cursor-pointer"
                style={{ perspective: "1200px" }}
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <motion.div
                    className="w-full h-full relative"
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ type: "spring", damping: 30, stiffness: 200, mass: 0.8 }}
                    style={{ transformStyle: "preserve-3d" }}
                >
                    {/* FRONT of Card - Premium Design */}
                    <div
                        className="absolute inset-0 rounded-[24px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
                        style={{ backfaceVisibility: "hidden" }}
                    >
                        {/* Card Background - Premium Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a]" />

                        {/* Subtle Pattern Overlay */}
                        <div className="absolute inset-0 opacity-[0.03]" style={{
                            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                            backgroundSize: '20px 20px'
                        }} />

                        {/* Holographic Strip */}
                        <motion.div
                            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                            animate={{ x: [-200, 200] }}
                            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                        />

                        {/* Card Content */}
                        <div className="relative h-full p-5 flex flex-col">
                            {/* Header Row */}
                            <div className="flex items-start justify-between mb-auto">
                                {/* Brand Logo */}
                                <div className="flex items-center gap-2">
                                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-lg shadow-primary/20">
                                        <span className="font-black text-white text-sm">B</span>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-white/40 font-medium tracking-[0.2em]">BACKBENCHERS</p>
                                        <p className="text-[8px] text-white/30">Student ID Card</p>
                                    </div>
                                </div>

                                {/* Status Badges */}
                                <div className="flex flex-col items-end gap-1">
                                    <div className="bg-primary/20 backdrop-blur border border-primary/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                        <span className="text-[9px] font-semibold text-primary">VERIFIED</span>
                                    </div>
                                    {hasProfileImage && (
                                        <div className="bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 rounded-full">
                                            <span className="text-[8px] font-medium text-blue-400">📸 Photo</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Main Content - Photo & Details */}
                            <div className="flex gap-4 items-end">
                                {/* Profile Photo */}
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="h-[72px] w-[72px] rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 border border-white/10 overflow-hidden shadow-xl relative flex-shrink-0"
                                    onClick={(e) => {
                                        if (!hasProfileImage) {
                                            e.stopPropagation();
                                            openCameraModal();
                                        }
                                    }}
                                >
                                    {profileImage ? (
                                        <img src={profileImage} alt="User" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                                            <Camera className="h-5 w-5 text-gray-500" />
                                            <span className="text-[7px] text-gray-500 mt-0.5">TAP</span>
                                        </div>
                                    )}
                                </motion.div>

                                {/* User Details */}
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg font-bold text-white tracking-tight truncate">{student?.name || 'Loading...'}</h2>
                                    <p className="text-[11px] text-white/50 mb-2">{student?.college}, {student?.city}</p>

                                    {/* Info Grid */}
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                        <div>
                                            <p className="text-[8px] text-white/30 uppercase tracking-wider">DOB</p>
                                            <p className="text-[10px] text-white/70 font-medium">{student?.dob ? new Date(student.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] text-white/30 uppercase tracking-wider">Gender</p>
                                            <p className="text-[10px] text-white/70 font-medium">{student?.gender || 'Not set'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BB-ID Section - Prominent */}
                            <div className="mt-3 flex items-center justify-between">
                                <div>
                                    <p className="text-[8px] text-white/30 uppercase tracking-wider mb-0.5">Student ID</p>
                                    <div className="bg-gradient-to-r from-primary/20 to-emerald-500/20 border border-primary/30 px-3 py-1 rounded-lg inline-block backdrop-blur">
                                        <p className="text-[15px] font-mono font-black text-primary tracking-wider">{student?.bbId || 'Pending'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] text-white/30 uppercase tracking-wider">Valid Until</p>
                                    <p className="text-[11px] text-white/60 font-medium">Dec 2025</p>
                                </div>
                            </div>

                            {/* Bottom Hint */}
                            <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                                <p className="text-[8px] text-white/20 font-mono tracking-widest">TAP CARD TO SHOW QR</p>
                            </div>
                        </div>
                    </div>

                    {/* BACK of Card - Clean Minimal Design */}
                    <div
                        className="absolute inset-0 rounded-[24px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] bg-white"
                        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    >
                        {/* Top Accent Line */}
                        <div className="h-1 bg-gradient-to-r from-primary to-emerald-400" />

                        {/* Main Content - Perfectly Centered */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            {/* QR Code Container */}
                            <div className="bg-gray-50 p-3 rounded-xl">
                                <BBQRCode value={student?.bbId || 'PENDING'} size={120} withLogo={true} />
                            </div>

                            {/* Text Below QR */}
                            <p className="mt-3 font-semibold text-gray-900 text-sm">Scan to Verify</p>
                            <p className="text-[10px] text-gray-400">Show this QR to the merchant</p>
                        </div>

                        {/* Bottom Branding */}
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center items-center gap-1">
                            <div className="h-3.5 w-3.5 rounded bg-primary flex items-center justify-center">
                                <span className="text-[7px] font-bold text-white">B</span>
                            </div>
                            <span className="text-[9px] text-gray-300 font-medium">BACKBENCHERS</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Tap Hint */}
            <motion.p
                className="text-[11px] text-gray-400 text-center mb-6 flex items-center justify-center gap-2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
            >
                <span className="inline-block h-4 w-4 border border-gray-300 rounded flex items-center justify-center text-[8px]">↻</span>
                Tap the card to flip
            </motion.p>


            {/* Savings Section */}
            <div className="bg-gradient-to-r from-primary/10 to-emerald-100 rounded-3xl p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-primary" />
                        <h3 className="font-bold">Your Savings</h3>
                    </div>
                    <button
                        onClick={async () => {
                            if (student && !isRefreshing) {
                                setIsRefreshing(true);
                                try {
                                    const txResult = await transactionService.getStudentTransactions(student.id);
                                    if (txResult.success && txResult.data) {
                                        setTransactions(txResult.data);
                                    }
                                    const pResult = await studentService.getMyProfile();
                                    if (pResult.success && pResult.data) {
                                        setStudent(pResult.data);
                                    }
                                } finally {
                                    setIsRefreshing(false);
                                }
                            }
                        }}
                        disabled={isRefreshing}
                        className="h-8 w-8 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform disabled:opacity-50"
                    >
                        <RefreshCcw className={`h-4 w-4 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="text-center mb-4">
                    <p className="text-xs text-gray-500">Total Saved</p>
                    <p className="text-4xl font-extrabold text-primary">₹{savingsStats.total}</p>
                    <p className="text-xs text-gray-500 mt-1">from {totalRedemptions} redemptions</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white rounded-xl p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Store className="h-4 w-4 text-orange-500" />
                            <span className="text-xs text-gray-500">Offline</span>
                        </div>
                        <p className="font-bold text-lg">₹{savingsStats.offline}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Globe className="h-4 w-4 text-blue-500" />
                            <span className="text-xs text-gray-500">Online</span>
                        </div>
                        <p className="font-bold text-lg">₹{savingsStats.online}</p>
                    </div>
                </div>

                {/* Recent Transactions */}
                {transactions.length > 0 && (
                    <div className="bg-white rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500">Recent Activity</span>
                            <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-2">
                            {transactions.slice(0, 3).map((tx: Transaction, i: number) => (
                                <div key={tx.id} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600 truncate max-w-[150px]">{tx.merchantName}</span>
                                    <span className="text-primary font-semibold">₹{tx.discountAmount}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {transactions.length > 0 && (
                    <p className="text-xs text-gray-500 text-center mt-3">
                        Last: {transactions[0]?.merchantName}
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
                <Button
                    variant="outline"
                    className="w-full h-14 justify-start gap-4 rounded-2xl border-red-200 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={handleSignOut}
                >
                    <LogOut className="h-5 w-5" /> Sign Out
                </Button>
            </div>

            {/* App Switcher */}
            <div className="pt-6 border-t border-gray-100 mt-6">
                <p className="text-xs text-gray-400 text-center mb-3">Switch to</p>
                <div className="flex justify-center gap-3">
                    <Link href="/merchant" className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-semibold">
                        Merchant App
                    </Link>
                    <Link href="/admin/dashboard" className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-semibold">
                        Admin Panel
                    </Link>
                </div>
            </div>
        </div>
    );
}
