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
import { supabase } from "@/lib/supabase";
import { Student, Transaction } from "@/lib/types";
import FaceCamera from "@/components/FaceCamera";

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

    // Face detection state
    const [faceCount, setFaceCount] = useState<number>(0);
    const [faceDetectionSupported, setFaceDetectionSupported] = useState<boolean>(true);
    const [isDetecting, setIsDetecting] = useState(false);
    const faceDetectorRef = useRef<any>(null);
    const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

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

                    // Subscribe to savings updates -> Auto-refresh with spinning animation!
                    const studentId = profileResult.data.id;
                    const channel = transactionService.subscribeToStudentSavings(studentId, () => {
                        // 🔄 Start spinning animation automatically!
                        setIsRefreshing(true);

                        transactionService.getStudentTransactions(studentId).then(res => {
                            if (res.success && res.data) {
                                setTransactions(res.data);
                                // Also update user profile to get latest total if needed
                                studentService.getMyProfile().then(p => {
                                    if (p.success && p.data) setStudent(p.data);
                                });
                            }
                            // Stop spinning after data loaded (with slight delay for visual feedback)
                            setTimeout(() => setIsRefreshing(false), 800);
                        });
                    });

                    // CLEANUP: Remove channel when component unmounts or id changes
                    return () => {
                        if (channel) supabase.removeChannel(channel);
                    };
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
                // Start face detection once video is playing
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    // Small delay to ensure video is fully ready
                    setTimeout(() => {
                        startFaceDetection();
                    }, 500);
                };
            }
        } catch (err) {
            console.error("Camera error:", err);
        }
    };

    const stopCamera = () => {
        // Stop face detection
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
        }
        setIsDetecting(false);
        setFaceCount(0);

        // Stop camera stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    // Initialize face detector on mount
    useEffect(() => {
        if (typeof window !== 'undefined' && 'FaceDetector' in window) {
            try {
                faceDetectorRef.current = new (window as any).FaceDetector({
                    fastMode: true,
                    maxDetectedFaces: 5
                });
                setFaceDetectionSupported(true);
            } catch (err) {
                console.log('FaceDetector not available:', err);
                setFaceDetectionSupported(false);
            }
        } else {
            setFaceDetectionSupported(false);
        }

        return () => {
            if (detectionIntervalRef.current) {
                clearInterval(detectionIntervalRef.current);
            }
        };
    }, []);

    // Start face detection loop when camera is active
    const startFaceDetection = async () => {
        if (!faceDetectorRef.current || !videoRef.current) {
            console.log('Face detection not available or video not ready');
            return;
        }

        setIsDetecting(true);

        // Detection loop - runs every 200ms (5 times per second)
        detectionIntervalRef.current = setInterval(async () => {
            if (!videoRef.current || videoRef.current.readyState !== 4) return;

            try {
                const faces = await faceDetectorRef.current.detect(videoRef.current);
                setFaceCount(faces.length);
            } catch (err) {
                // Silently ignore detection errors during frame processing
            }
        }, 200);
    };

    // Helper to get face status
    const getFaceStatus = () => {
        if (!faceDetectionSupported) {
            return { color: 'emerald', message: 'Position your face in the circle', canCapture: true };
        }
        if (faceCount === 0) {
            return { color: 'orange', message: 'No face detected - look at camera', canCapture: false };
        }
        if (faceCount === 1) {
            return { color: 'emerald', message: '✓ Face detected - ready to capture', canCapture: true };
        }
        return { color: 'red', message: `${faceCount} faces detected - only 1 allowed`, canCapture: false };
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
            <div className="min-h-screen bg-black flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <motion.div
                        animate={{
                            scale: [1, 1.05, 1],
                            boxShadow: [
                                "0 0 0 0 rgba(34, 197, 94, 0)",
                                "0 0 0 12px rgba(34, 197, 94, 0.1)",
                                "0 0 0 0 rgba(34, 197, 94, 0)"
                            ]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="h-14 w-14 rounded-2xl bg-green-500 flex items-center justify-center"
                    >
                        <span className="text-black font-bold text-2xl">B</span>
                    </motion.div>
                    <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
                                className="h-1.5 w-1.5 rounded-full bg-green-500"
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
        );
    }

    // Guest View - Get Verified CTA (only if no student record found)
    if (!isVerified || !student) {
        return (
            <div className="min-h-screen bg-black pb-28 px-4">
                <header className="py-6">
                    <h1 className="text-2xl font-bold text-white">Profile</h1>
                </header>

                <div className="bg-gradient-to-br from-[#121212] to-[#0a0a0b] rounded-3xl p-6 text-white shadow-2xl mb-8 border border-white/[0.06]">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-16 w-16 rounded-2xl bg-white/[0.05] flex items-center justify-center">
                            <Lock className="h-8 w-8 text-white/30" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Guest User</h2>
                            <p className="text-white/50 text-sm">Not verified</p>
                        </div>
                    </div>

                    <p className="text-white/50 text-sm mb-6 leading-relaxed">
                        Verify your student status to unlock exclusive discounts and access your digital ID card.
                    </p>

                    <Link href="/signup">
                        <Button className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all">
                            <ShieldCheck className="mr-2 h-5 w-5" />
                            Get Verified Now
                        </Button>
                    </Link>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold text-lg text-white">Why Verify?</h3>

                    {[
                        { icon: "🎓", title: "Digital Student ID", desc: "Access your ID anywhere, anytime" },
                        { icon: "💰", title: "Exclusive Discounts", desc: "Up to 50% off at 100+ brands" },
                        { icon: "📍", title: "Location Perks", desc: "Real-time offers near you" },
                        { icon: "⚡", title: "Flash Deals", desc: "Time-limited student specials" },
                    ].map((benefit, i) => (
                        <motion.div
                            key={i}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-4 p-4 bg-white/[0.04] rounded-2xl border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
                        >
                            <div className="h-12 w-12 bg-white/[0.06] rounded-xl flex items-center justify-center text-2xl">
                                {benefit.icon}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-sm text-white">{benefit.title}</h4>
                                <p className="text-xs text-white/50">{benefit.desc}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-white/20" />
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    }

    // Verified User View - Full Profile with ID Card
    return (
        <div className="min-h-screen bg-black pb-24 px-5">
            {/* Camera Modal - Using Premium FaceCamera Component */}
            <AnimatePresence>
                {showCameraModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black"
                    >
                        <FaceCamera
                            onCapture={async (imageData) => {
                                setShowCameraModal(false);
                                setIsSaving(true);

                                try {
                                    // Convert base64 to file and upload
                                    const blob = await (await fetch(imageData)).blob();
                                    const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });

                                    const result = await studentService.updateProfileImage(file);

                                    if (result.success) {
                                        setCapturedImage(imageData);
                                        setHasProfileImage(true);
                                        // Refresh student data to get updated BB ID
                                        const userData = await authService.getCurrentUser();
                                        if (userData) {
                                            const studentResult = await studentService.getById(userData.id);
                                            if (studentResult.success && studentResult.data) {
                                                setStudent(studentResult.data);
                                            }
                                        }
                                    } else {
                                        alert(result.error || 'Failed to save photo');
                                    }
                                } catch (err) {
                                    console.error('Photo upload error:', err);
                                    alert('Failed to save photo. Please try again.');
                                } finally {
                                    setIsSaving(false);
                                }
                            }}
                            onCancel={() => setShowCameraModal(false)}
                            shape="circle"
                            instructions={true}
                        />
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
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
                        onClick={() => setShowInfoModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#121212] rounded-3xl p-6 w-full max-w-sm border border-white/[0.08]"
                        >
                            <h3 className="font-bold text-lg mb-4 text-white">Why Profile Photo?</h3>
                            <div className="space-y-4 text-sm text-white/60">
                                <div className="flex items-start gap-3">
                                    <ShieldCheck className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                                    <p>Used for offline verification at stores. Merchants verify your face matches your profile.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Lock className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                                    <p>Once added, the photo cannot be changed to prevent misuse of student discounts.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Camera className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                                    <p>Only selfie capture is allowed - no gallery uploads.</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => setShowInfoModal(false)}
                                className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl mt-6 shadow-lg shadow-green-500/25"
                            >
                                Got it!
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="py-6 flex justify-between items-center">
                <h1 className="text-xl font-bold text-white">My ID</h1>
                <button className="h-10 w-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.08] transition-colors">
                    <Settings className="h-5 w-5 text-white/50" />
                </button>
            </header>

            {/* Profile Photo Warning */}
            {
                !hasProfileImage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-orange-500/10 rounded-2xl p-4 mb-4 flex items-start gap-3 border border-orange-500/20"
                    >
                        <AlertCircle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-orange-300">Profile Photo Required</p>
                            <p className="text-xs text-orange-400/80 mt-1">
                                Add a selfie to use offline discounts. Without it, merchants cannot verify you.
                            </p>
                            <div className="flex gap-2 mt-3">
                                <Button
                                    onClick={openCameraModal}
                                    size="sm"
                                    className="h-8 bg-orange-500 text-white text-xs font-semibold rounded-lg hover:bg-orange-600"
                                >
                                    <Camera className="h-3 w-3 mr-1" /> Add Selfie
                                </Button>
                                <Button
                                    onClick={() => setShowInfoModal(true)}
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs font-semibold rounded-lg border-white/20 text-white/70 hover:bg-white/[0.05]"
                                >
                                    <Info className="h-3 w-3 mr-1" /> Why?
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )
            }

            {/* Premium Credit-Card Style ID */}
            <div
                className="relative w-full aspect-[1.586/1] mb-4 cursor-pointer"
                style={{ perspective: "1200px" }}
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <motion.div
                    className="w-full h-full relative"
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ type: "spring", damping: 30, stiffness: 200, mass: 0.8 }}
                    style={{ transformStyle: "preserve-3d" }}
                >
                    {/* FRONT of Card */}
                    <div
                        className="absolute inset-0 rounded-2xl overflow-hidden"
                        style={{ backfaceVisibility: "hidden" }}
                    >
                        {/* Card Background - Premium dark */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#111111] to-[#0a0a0a]" />

                        {/* Subtle metallic sheen - static, ultra-minimal */}
                        <div
                            className="absolute inset-0 opacity-20"
                            style={{
                                background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%)',
                            }}
                        />

                        {/* Subtle edge glow */}
                        <div className="absolute inset-0 rounded-2xl" style={{
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.3)'
                        }} />

                        {/* Clean border */}
                        <div className="absolute inset-0 rounded-2xl border border-white/[0.08]" />


                        {/* Card Content */}
                        <div className="relative h-full p-5 flex flex-col">

                            {/* Header Row */}
                            <div className="flex items-center justify-between mb-auto">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-md bg-white flex items-center justify-center">
                                        <span className="text-black font-bold text-[10px]">B</span>
                                    </div>
                                    <span className="text-sm text-white font-bold italic tracking-tight">BACKBENCHERS</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                                        <Check className="h-2.5 w-2.5 text-white" />
                                    </div>
                                    <span className="text-[9px] text-green-400 font-medium">VERIFIED</span>
                                </div>
                            </div>

                            {/* Main Content - Photo + Info */}
                            <div className="flex gap-4 items-start">
                                {/* Profile Photo */}
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="h-16 w-16 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0"
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
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-white/5">
                                            <Camera className="h-4 w-4 text-white/30" />
                                            <span className="text-[6px] text-white/30 mt-0.5">ADD</span>
                                        </div>
                                    )}
                                </motion.div>

                                {/* Name & College */}
                                <div className="flex-1 min-w-0 pt-1">
                                    <h2 className="text-base font-semibold text-white truncate leading-tight">
                                        {student?.name || 'Loading...'}
                                    </h2>
                                    <p className="text-[11px] text-white/50 truncate mt-0.5">
                                        {student?.college || 'College'}
                                    </p>
                                    <p className="text-[10px] text-white/30 mt-0.5">
                                        {student?.city || 'City'}
                                    </p>
                                </div>
                            </div>

                            {/* Bottom Section - ID & Details */}
                            <div className="mt-auto pt-3 border-t border-white/[0.06]">
                                <div className="flex items-end justify-between">
                                    {/* Student ID */}
                                    <div>
                                        <p className="text-[8px] text-white/30 uppercase tracking-wider mb-0.5">Student ID</p>
                                        <p className="text-sm font-mono font-semibold text-green-400 tracking-wider">
                                            {hasProfileImage && student?.bbId ? student.bbId : 'PENDING'}
                                        </p>
                                    </div>

                                    {/* DOB */}
                                    <div className="text-center">
                                        <p className="text-[8px] text-white/30 uppercase tracking-wider mb-0.5">DOB</p>
                                        <p className="text-[10px] text-white/60 font-medium">
                                            {student?.dob ? new Date(student.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                        </p>
                                    </div>

                                    {/* Valid */}
                                    <div className="text-right">
                                        <p className="text-[8px] text-white/30 uppercase tracking-wider mb-0.5">Valid</p>
                                        <p className="text-[10px] text-white/60 font-medium">12/25</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BACK of Card */}
                    <div
                        className="absolute inset-0 rounded-2xl overflow-hidden"
                        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    >
                        {/* Card Background */}
                        <div className="absolute inset-0 bg-white" />

                        {/* Top Accent */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-400" />

                        {/* Content - Centered QR or Selfie Prompt */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            {hasProfileImage && student?.bbId ? (
                                <>
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <BBQRCode value={student.bbId} size={110} withLogo={true} />
                                    </div>
                                    <p className="mt-3 font-semibold text-gray-800 text-sm">Scan to Verify</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">Show this QR at checkout</p>
                                </>
                            ) : (
                                <div className="text-center px-6">
                                    <Camera className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="font-semibold text-gray-600 text-sm">Add Selfie to Unlock</p>
                                    <p className="text-xs text-gray-400 mt-1">Your QR code will appear here after you add a profile photo</p>
                                </div>
                            )}
                        </div>

                        {/* Bottom Branding */}
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center items-center gap-1.5">
                            <div className="h-4 w-4 rounded-md bg-black flex items-center justify-center">
                                <span className="text-[8px] font-bold text-white">B</span>
                            </div>
                            <span className="text-[10px] text-gray-300 font-medium tracking-wider">backbenchers.in</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Tap Hint */}
            <motion.p
                className="text-[11px] text-white/40 text-center mb-6 flex items-center justify-center gap-2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
            >
                <span className="inline-block h-4 w-4 border border-white/20 rounded flex items-center justify-center text-[8px]">↻</span>
                Tap the card to flip
            </motion.p>


            {/* Savings Section - District-Quality Bold Stats */}
            <div className="bg-white/[0.03] rounded-2xl p-6 mb-6 border border-white/[0.06]">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 bg-green-500/15 rounded-lg flex items-center justify-center">
                            <Wallet className="h-5 w-5 text-green-400" />
                        </div>
                        <h3 className="font-semibold text-white">Your Savings</h3>
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
                        className="h-8 w-8 bg-white/[0.05] rounded-full flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50 hover:bg-white/[0.1]"
                    >
                        <RefreshCcw className={`h-4 w-4 text-white/50 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="text-center mb-4">
                    <p className="text-xs text-white/50">Total Saved</p>
                    <p className="text-6xl font-black text-white tracking-tight mt-1">
                        ₹{Math.round(savingsStats.total).toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-white/50 mt-1">from {totalRedemptions} redemptions</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/[0.04] rounded-xl p-3 text-center border border-white/[0.06]">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Store className="h-4 w-4 text-orange-400" />
                            <span className="text-xs text-white/50">Offline</span>
                        </div>
                        <p className="font-bold text-2xl text-white">₹{Math.round(savingsStats.offline).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-white/[0.04] rounded-xl p-3 text-center border border-white/[0.06]">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Globe className="h-4 w-4 text-blue-400" />
                            <span className="text-xs text-white/50">Online</span>
                        </div>
                        <p className="font-bold text-2xl text-white">₹{Math.round(savingsStats.online).toLocaleString('en-IN')}</p>
                    </div>
                </div>

                {/* Recent Transactions */}
                {transactions.length > 0 && (
                    <div className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.06]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-white/50">Recent Activity</span>
                            <TrendingUp className="h-4 w-4 text-green-400" />
                        </div>
                        <div className="space-y-2">
                            {transactions.slice(0, 3).map((tx: Transaction, i: number) => (
                                <div key={tx.id} className="flex justify-between items-center text-sm">
                                    <span className="text-white/70 truncate max-w-[150px]">{tx.merchantName}</span>
                                    <span className="text-green-400 font-semibold">₹{tx.discountAmount}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {transactions.length > 0 && (
                    <p className="text-xs text-white/40 text-center mt-3">
                        Last: {transactions[0]?.merchantName}
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
                {/* Saved Items */}
                <Link href="/dashboard/saved">
                    <button className="w-full h-14 flex items-center justify-between px-4 rounded-xl bg-white/[0.04] border border-white/[0.06] font-medium hover:bg-white/[0.08] transition-colors">
                        <div className="flex items-center gap-3">
                            <span className="text-lg">❤️</span>
                            <span className="text-white">Saved</span>
                        </div>
                        <span className="text-white/30">→</span>
                    </button>
                </Link>

                {/* Dark Mode Toggle */}
                <button
                    onClick={() => {
                        const isDark = document.documentElement.classList.toggle('dark');
                        localStorage.setItem('bb-theme', isDark ? 'dark' : 'light');
                    }}
                    className="w-full h-14 flex items-center justify-between px-4 rounded-xl bg-white/[0.04] border border-white/[0.06] font-medium hover:bg-white/[0.08] transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-lg">🌙</span>
                        <span className="text-white">Dark Mode</span>
                    </div>
                    <div className="relative h-6 w-11 bg-green-500 rounded-full">
                        <div className="absolute h-5 w-5 bg-white rounded-full top-0.5 left-[22px] shadow-sm" />
                    </div>
                </button>

                <button
                    onClick={handleSignOut}
                    className="w-full h-14 flex items-center justify-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium hover:bg-red-500/20 transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                </button>
            </div>
        </div >
    );
}

