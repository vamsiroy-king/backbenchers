"use client";

import { Button } from "@/components/ui/button";
import { Tag, Check, CreditCard, Banknote, ArrowLeft, ShieldCheck, Loader2, ScanLine, RefreshCw, UserX, Camera, XCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { studentService } from "@/lib/services/student.service";
import { merchantService } from "@/lib/services/merchant.service";
import { offerService } from "@/lib/services/offer.service";
import { transactionService } from "@/lib/services/transaction.service";
import { Student, Merchant, Offer } from "@/lib/types";
import dynamic from "next/dynamic";

// Dynamically import QR scanner to avoid SSR issues
const QRScanner = dynamic(() => import("@/components/scanner/QRScanner"), {
    ssr: false,
    loading: () => (
        <div className="w-full aspect-square bg-gray-900 rounded-2xl flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
    )
});

type ScanStep =
    | "scanning"
    | "student_found"
    | "select_offer"
    | "enter_bill"  // NEW: Enter bill amount
    | "select_payment"
    | "payment_cash"
    | "payment_online"
    | "success";

export default function ScanPage() {
    const [step, setStep] = useState<ScanStep>("scanning");
    const [student, setStudent] = useState<Student | null>(null);
    const [merchant, setMerchant] = useState<Merchant | null>(null);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<"online" | "cash" | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [scanInput, setScanInput] = useState("");
    const [refreshCountdown, setRefreshCountdown] = useState(0);
    const [isScanning, setIsScanning] = useState(true);
    const [scanError, setScanError] = useState("");
    // NEW: Bill amount entry for dynamic calculation
    const [billAmount, setBillAmount] = useState<string>("");

    // Load merchant data and offers on mount
    useEffect(() => {
        async function loadMerchantData() {
            console.log('[ScanPage] 🔄 Loading merchant data...');
            try {
                const profileResult = await merchantService.getMyProfile();
                console.log('[ScanPage] 📊 Profile result:', profileResult.success, profileResult.error);
                if (profileResult.success && profileResult.data) {
                    console.log('[ScanPage] ✅ Merchant loaded:', profileResult.data.businessName, 'ID:', profileResult.data.id);
                    setMerchant(profileResult.data);
                } else {
                    console.error('[ScanPage] ❌ Failed to load merchant profile:', profileResult.error);
                }

                const offersResult = await offerService.getMyOffers();
                console.log('[ScanPage] 📊 Offers result:', offersResult.success, offersResult.data?.length || 0, 'offers');
                if (offersResult.success && offersResult.data) {
                    setOffers(offersResult.data.filter(o => o.status === 'active'));
                }


            } catch (error) {
                console.error('[ScanPage] ❌ Error loading merchant data:', error);
            }
        }
        loadMerchantData();
    }, []);

    // Handle QR code scan result
    const handleQRScan = useCallback(async (scannedText: string) => {
        try {
            setScanError("");
            setIsScanning(false);

            // Parse BB-ID from the scanned QR code
            // QR code format could be:
            // 1. Just the BB-ID: "BB-536339"
            // 2. Full URL: "https://backbenchers.app/verify/BB-536339"
            // 3. JSON: {"bbId": "BB-536339", "studentId": "..."}

            let bbId = "";

            // Try parsing as JSON first
            try {
                const parsed = JSON.parse(scannedText);
                bbId = parsed.bbId || parsed.bb_id || "";
            } catch {
                // Not JSON, check for BB-ID pattern
                const bbIdMatch = scannedText.match(/BB-\d{6}/i);
                if (bbIdMatch) {
                    bbId = bbIdMatch[0].toUpperCase();
                } else {
                    bbId = scannedText.trim();
                }
            }

            if (!bbId || !bbId.startsWith("BB-")) {
                setScanError("Invalid QR code. Please scan a valid student QR.");
                setIsScanning(true);
                return;
            }

            console.log("Looking up student with BB-ID:", bbId);

            // Fetch student from database
            const result = await studentService.getByBbId(bbId);

            if (result.success && result.data) {
                setStudent(result.data);
                setStep("student_found");
            } else {
                setScanError(`Student not found: ${bbId}`);
                setIsScanning(true);
            }
        } catch (error: any) {
            console.error("Error processing QR scan:", error);
            setScanError(error.message || "Error processing QR code");
            setIsScanning(true);
        }
    }, []);

    // Countdown timer effect for refresh button
    useEffect(() => {
        if (refreshCountdown > 0) {
            const timer = setInterval(() => {
                setRefreshCountdown(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [refreshCountdown]);

    // Check if student has profile photo
    const hasProfilePhoto = student?.profileImage && student.profileImage.trim() !== '';

    // Refresh student data to check for updated photo
    const handleRefreshStudent = async () => {
        if (!student?.bbId) return;
        // No countdown - unlimited refresh allowed

        try {
            const result = await studentService.getByBbId(student.bbId);
            if (result.success && result.data) {
                setStudent(result.data);
            }
        } catch (error) {
            console.error('Error refreshing student:', error);
        }
    };

    // Handle face doesn't match - reset the scan
    const handleFaceDoesntMatch = () => {
        resetScan();
    };

    const handleFaceVerified = () => setStep("select_offer");

    const handleOfferSelect = (offer: Offer) => {
        setSelectedOffer(offer);
        setBillAmount(""); // Clear previous bill amount
        setStep("enter_bill"); // Go to bill entry instead of payment
    };

    // Calculate discount based on offer type and bill amount
    const calculateDiscount = () => {
        const bill = parseFloat(billAmount) || 0;
        if (!selectedOffer || bill <= 0) return { discount: 0, final: 0 };

        let discount = 0;
        const discountValue = selectedOffer.discountValue || 0;

        if (selectedOffer.type === 'percentage') {
            discount = Math.round(bill * (discountValue / 100));
        } else if (selectedOffer.type === 'flat') {
            discount = discountValue;
        } else {
            // BOGO, freebie, custom - use the fixed discount from offer
            discount = selectedOffer.discountAmount || 0;
        }

        // Ensure discount doesn't exceed bill
        discount = Math.min(discount, bill);
        let final = bill - discount;

        // Safety check for NaN
        if (isNaN(discount)) discount = 0;
        if (isNaN(final)) final = Math.max(0, bill);

        return { discount: Math.round(discount), final: Math.round(final) };
    };

    const handleBillConfirm = () => {
        if (parseFloat(billAmount) > 0) {
            setStep("select_payment");
        }
    };

    const handlePaymentSelect = (method: "online" | "cash") => {
        setPaymentMethod(method);
        setStep(method === "online" ? "payment_online" : "payment_cash");
    };

    const handleBillPaid = () => setShowConfirmation(true);

    const handleConfirmPayment = async () => {
        console.log('[ConfirmPayment] 🔄 Starting payment confirmation...');
        console.log('[ConfirmPayment] Student:', student?.id, student?.name);
        console.log('[ConfirmPayment] Merchant:', merchant?.id, merchant?.businessName);
        console.log('[ConfirmPayment] Offer:', selectedOffer?.id, selectedOffer?.title);

        if (!student || !merchant || !selectedOffer) {
            console.error('[ConfirmPayment] ❌ MISSING DATA! student:', !!student, 'merchant:', !!merchant, 'offer:', !!selectedOffer);
            return;
        }

        setShowConfirmation(false);
        setIsProcessing(true);

        // Use calculated amounts from bill entry
        const { discount, final } = calculateDiscount();
        const originalBill = parseFloat(billAmount) || 0;

        console.log('[ConfirmPayment] 📊 Bill:', originalBill, 'Discount:', discount, 'Final:', final, 'Method:', paymentMethod);

        try {
            // Record the transaction in Supabase with actual bill amounts
            console.log('[ConfirmPayment] 🔄 Recording transaction...');
            // Record the transaction via Server-Side API (Bypasses RLS issues)
            console.log('[ConfirmPayment] 🔄 Recording transaction (Server-Side)...');

            const response = await fetch('/api/merchant/transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: student.id,
                    studentBbId: student.bbId || '',
                    studentName: student.name,
                    merchantId: merchant.id,
                    merchantBbmId: merchant.bbmId || '',
                    merchantName: merchant.businessName,
                    offerId: selectedOffer.id,
                    offerTitle: selectedOffer.title,
                    originalAmount: originalBill,
                    discountAmount: discount,
                    finalAmount: final,
                    paymentMethod: paymentMethod || 'cash'
                })
            });

            const txResult = await response.json();


            console.log('[ConfirmPayment] 📊 Transaction result:', txResult.success, txResult.error);

            if (!txResult.success) {
                console.error('❌ Transaction Failed:', txResult.error);
                // alert(`❌ TRANSACTION FAILED: ${txResult.error}`); // Use UI error instead
                setScanError(`Transaction Failed: ${txResult.error}`);
                setIsProcessing(false);
                return;
            }

            if (txResult.data) {
                console.log('[ConfirmPayment] ✅ Transaction ID:', txResult.data.id);
            }

            // Send notification to student to rate the merchant
            if (txResult.success && txResult.data) {
                // Store pending rating in DATABASE (works across devices!)
                console.log('[ConfirmPayment] ✅ Transaction successful, saving pending rating...');
                console.log('[ConfirmPayment] Rating data:', {
                    transactionId: txResult.data.id,
                    merchantId: merchant.id,
                    merchantName: merchant.businessName,
                    studentId: student.id,
                });
                try {
                    const { addPendingRatingToDB } = await import('@/lib/services/pendingRatings');
                    const result = await addPendingRatingToDB({
                        transactionId: txResult.data.id,
                        merchantId: merchant.id,
                        merchantName: merchant.businessName,
                        studentId: student.id,
                    });
                    console.log('[ConfirmPayment] ✅ Pending rating saved, result:', result);
                } catch (e) {
                    console.error('[ConfirmPayment] ❌ Could not store pending rating:', e);
                }

                // Also send notification as backup
                try {
                    const { notificationService } = await import('@/lib/services/notification.service');
                    await notificationService.createForUser(
                        student.id,
                        'student',
                        'rate_merchant', // This type triggers rating modal on student app
                        '⭐ Rate Your Experience',
                        `How was your experience at ${merchant.businessName}? Tap to rate!`,
                        {
                            transactionId: txResult.data.id,
                            merchantId: merchant.id,
                            merchantName: merchant.businessName
                        }
                    );
                    console.log('[ConfirmPayment] ✅ Notification sent');
                } catch (notifError) {
                    console.log('[ConfirmPayment] ⚠️ Notification not sent (optional):', notifError);
                }
            } else {
                console.error('[ConfirmPayment] ❌ Transaction FAILED:', txResult.error);
            }

            setStep("success");
            console.log('[ConfirmPayment] ✅ Flow complete - showing success screen');
        } catch (error) {
            console.error('[ConfirmPayment] ❌ EXCEPTION in transaction:', error);
        } finally {
            setIsProcessing(false);
        }
    };


    const resetScan = () => {
        setStep("scanning");
        setStudent(null);
        setSelectedOffer(null);
        setPaymentMethod(null);
        setIsScanning(true);
        setScanError("");
        setScanInput("");
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 pb-32">\n            <AnimatePresence mode="wait">
            {/* Step 1: Scanning Student's QR */}
            {step === "scanning" && (
                <motion.div
                    key="scanning"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center px-6 pt-4"
                >
                    <h2 className="text-xl font-extrabold mb-2">Scan Student QR Code</h2>
                    <p className="text-gray-500 text-sm mb-4">Point camera at student&apos;s Backbenchers QR code</p>

                    {/* Real QR Camera Scanner */}
                    <div className="w-full max-w-sm">
                        <QRScanner
                            isActive={isScanning}
                            onScan={handleQRScan}
                            onError={(err) => setScanError(err)}
                        />
                    </div>

                    {/* Error Message */}
                    {scanError && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 bg-red-100 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2"
                        >
                            <XCircle className="h-5 w-5" />
                            <span className="text-sm font-medium">{scanError}</span>
                        </motion.div>
                    )}

                    {/* Manual Input Option */}
                    <div className="mt-6 w-full max-w-sm">
                        <p className="text-xs text-gray-400 text-center mb-2">Or enter BB-ID manually</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="BB-XXXXXX or just 536339"
                                value={scanInput}
                                onChange={(e) => setScanInput(e.target.value.toUpperCase())}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && scanInput.length >= 3) {
                                        const idToVerify = scanInput.startsWith("BB-") ? scanInput : `BB-${scanInput.replace(/\D/g, '')}`;
                                        handleQRScan(idToVerify);
                                    }
                                }}
                                className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl text-center font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                suppressHydrationWarning
                            />
                            <Button
                                onClick={() => {
                                    if (scanInput.length >= 3) {
                                        // Auto-add BB- prefix if not present
                                        const idToVerify = scanInput.startsWith("BB-") ? scanInput : `BB-${scanInput.replace(/\D/g, '')}`;
                                        console.log('[ManualInput] Verifying:', idToVerify);
                                        handleQRScan(idToVerify);
                                    }
                                }}
                                disabled={scanInput.length < 3}
                                className="px-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                Verify
                            </Button>
                        </div>
                        <p className="text-xs text-gray-400 text-center mt-2">Enter just the number (e.g., 536339) or full ID (BB-536339)</p>
                    </div>
                </motion.div>
            )}

            {/* Step 2: Student Found - Verify Face */}
            {step === "student_found" && student && (
                <motion.div
                    key="student_found"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="px-6 py-6"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center justify-center gap-2 bg-emerald-100 text-emerald-700 rounded-full px-4 py-2 mx-auto w-fit mb-5"
                    >
                        <Check className="h-4 w-4" />
                        <span className="text-sm font-semibold">Student Found!</span>
                    </motion.div>

                    <h2 className="text-xl font-extrabold text-center mb-5">Verify Identity</h2>

                    {/* Student Card */}
                    {/* Student Card - ID Style */}
                    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[2rem] p-6 text-white shadow-2xl shadow-emerald-500/30 relative overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute top-0 left-0 w-full h-32 bg-white/10" />
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />

                        <div className="relative flex flex-col items-center text-center">
                            {/* Profile Photo - Large & Central */}
                            <div className="relative mb-4">
                                <div className="h-32 w-32 rounded-full p-1.5 bg-white/20 backdrop-blur-sm">
                                    <div className="h-full w-full rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-200">
                                        {hasProfilePhoto ? (
                                            <img src={student.profileImage || ''} alt={student.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                                <UserX className="h-10 w-10 text-gray-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* Verified Badge */}
                                <div className="absolute bottom-1 right-1 bg-white text-emerald-600 rounded-full p-1.5 shadow-lg border-2 border-emerald-50 text-[10px] font-bold flex items-center gap-1">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                            </div>

                            {/* Name & ID */}
                            <h3 className="font-extrabold text-2xl tracking-tight mb-1">{student.name}</h3>
                            <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full mb-4 border border-white/10">
                                <span className="font-mono font-bold tracking-widest text-sm">{student.bbId}</span>
                            </div>
                            <p className="text-white/90 text-sm font-medium mb-6 flex items-center justify-center gap-1">
                                <span className="opacity-70">🎓</span> {student.college}
                            </p>

                            {/* Divider */}
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mb-6" />

                            {/* Details Grid */}
                            <div className="grid grid-cols-3 gap-2 w-full">
                                {/* DOB */}
                                <div className="bg-black/20 rounded-xl p-2.5 backdrop-blur-sm">
                                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-1">Born</p>
                                    <p className="font-bold text-sm">
                                        {student.dob ? new Date(student.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '--'}
                                    </p>
                                </div>

                                {/* Gender */}
                                <div className="bg-black/20 rounded-xl p-2.5 backdrop-blur-sm">
                                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-1">Gender</p>
                                    <p className="font-bold text-sm capitalize">{student.gender || '--'}</p>
                                </div>

                                {/* City */}
                                <div className="bg-black/20 rounded-xl p-2.5 backdrop-blur-sm">
                                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-1">City</p>
                                    <p className="font-bold text-sm truncate">{student.city || '--'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Conditional UI based on profile photo */}
                    {hasProfilePhoto ? (
                        <>
                            {/* Has profile photo - show verification buttons */}
                            <div className="bg-blue-50 rounded-2xl p-4 mt-6">
                                <h4 className="font-bold text-sm text-blue-800 mb-1">👀 Please Verify</h4>
                                <p className="text-xs text-blue-700">Check if the student's face matches their profile photo.</p>
                            </div>

                            <div className="mt-8 space-y-3">
                                <Button onClick={handleFaceVerified} className="w-full h-14 bg-primary text-white font-bold rounded-2xl text-base">
                                    <Check className="h-5 w-5 mr-2" /> Face Verified - Continue
                                </Button>
                                <Button onClick={handleFaceDoesntMatch} variant="outline" className="w-full h-12 rounded-xl font-medium">
                                    Face Doesn't Match
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* No profile photo - show warning and refresh button */}
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-6">
                                <h4 className="font-bold text-sm text-amber-800 mb-1">⚠️ Profile Photo Not Updated</h4>
                                <p className="text-xs text-amber-700">
                                    This student has not uploaded a profile photo yet.
                                    Ask them to update their profile in the Backbenchers app.
                                </p>
                            </div>

                            <div className="mt-8 space-y-3">
                                <Button
                                    onClick={handleRefreshStudent}
                                    className="w-full h-14 bg-primary text-white font-bold rounded-2xl text-base"
                                >
                                    <RefreshCw className="h-5 w-5 mr-2" />
                                    Check Profile Status
                                </Button>
                                <Button onClick={resetScan} variant="outline" className="w-full h-12 rounded-xl font-medium">
                                    Cancel & Scan Another
                                </Button>
                            </div>
                        </>
                    )}
                </motion.div>
            )}

            {/* Step 3: Select Offer - WITH FIXED PRICES */}
            {step === "select_offer" && student && (
                <motion.div
                    key="select_offer"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="px-6 py-8"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <button onClick={() => setStep("student_found")}><ArrowLeft className="h-5 w-5" /></button>
                        <h2 className="text-xl font-extrabold">Select Offer</h2>
                    </div>

                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 mb-6">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">{student.name.charAt(0)}</div>
                        <div>
                            <p className="font-semibold text-sm">{student.name}</p>
                            <p className="text-xs text-primary font-mono">{student.bbId}</p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-500 mb-4">Choose offer for this student:</p>

                    <div className="space-y-3">
                        {offers.map((offer: Offer) => (
                            <motion.button
                                key={offer.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleOfferSelect(offer)}
                                className="w-full p-4 rounded-2xl border-2 border-gray-200 text-left hover:border-primary hover:bg-primary/5 transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                            <Tag className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{offer.title}</p>
                                            <p className="text-xs text-gray-500">
                                                <span className="line-through">₹{offer.originalPrice}</span>
                                                <span className="text-green-600 font-semibold ml-2">₹{offer.finalPrice}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="bg-primary text-white px-3 py-1 rounded-lg font-bold text-sm">
                                            {offer.type === "percentage" ? `${offer.discountValue}%` : `₹${offer.discountAmount}`} OFF
                                        </div>
                                        <p className="text-xs text-green-600 mt-1">Save ₹{offer.discountAmount}</p>
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Step 4: Enter Bill Amount - DYNAMIC DISCOUNT CALCULATION */}
            {step === "enter_bill" && selectedOffer && (
                <motion.div
                    key="enter_bill"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="px-6 py-8"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <button onClick={() => setStep("select_offer")}><ArrowLeft className="h-5 w-5" /></button>
                        <h2 className="text-xl font-extrabold">Enter Bill Amount</h2>
                    </div>

                    {/* Offer Selected Badge */}
                    <div className="bg-primary/10 rounded-2xl p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center">
                                    <Tag className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{selectedOffer.title}</p>
                                    <p className="text-xs text-gray-500">
                                        {selectedOffer.type === "percentage" ? `${selectedOffer.discountValue}% OFF` : `₹${selectedOffer.discountAmount} OFF`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bill Amount Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Total Bill Amount (₹)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">₹</span>
                            <input
                                type="number"
                                value={billAmount}
                                onChange={(e) => setBillAmount(e.target.value)}
                                placeholder="0"
                                className="w-full h-16 bg-gray-100 rounded-2xl pl-12 pr-4 text-3xl font-bold text-gray-900 focus:ring-2 focus:ring-primary focus:outline-none"
                                autoFocus
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Enter the total bill amount before discount</p>
                    </div>

                    {/* Live Calculation Display */}
                    {parseFloat(billAmount) > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-5 mb-6"
                        >
                            <h4 className="font-bold text-sm text-emerald-800 mb-3">💰 Bill Breakdown</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Bill Amount</span>
                                    <span className="font-semibold">₹{parseFloat(billAmount).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Discount ({selectedOffer.type === 'percentage' ? `${selectedOffer.discountValue}%` : 'Flat'})</span>
                                    <span className="font-semibold text-green-600">- ₹{calculateDiscount().discount.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="h-px bg-emerald-200 my-2" />
                                <div className="flex justify-between">
                                    <span className="font-bold text-emerald-800">Final Amount</span>
                                    <span className="text-2xl font-extrabold text-emerald-700">₹{calculateDiscount().final.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Minimum Bill Warning */}
                    {parseFloat(billAmount) > 0 && selectedOffer.minPurchase && parseFloat(billAmount) < selectedOffer.minPurchase && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6"
                        >
                            <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ Minimum Bill Required</p>
                            <p className="text-xs text-amber-700">
                                This offer requires a minimum bill of <span className="font-bold">₹{selectedOffer.minPurchase.toLocaleString('en-IN')}</span>.
                                Current bill is ₹{parseFloat(billAmount).toLocaleString('en-IN')}.
                            </p>
                        </motion.div>
                    )}

                    {/* Continue Button */}
                    <Button
                        onClick={handleBillConfirm}
                        disabled={
                            !billAmount ||
                            parseFloat(billAmount) <= 0 ||
                            Boolean(selectedOffer.minPurchase && parseFloat(billAmount) < selectedOffer.minPurchase)
                        }
                        className="w-full h-14 bg-primary text-white font-bold rounded-2xl text-base disabled:opacity-50"
                    >
                        Continue to Payment
                    </Button>
                </motion.div>
            )}

            {/* Step 5: Select Payment Method */}
            {step === "select_payment" && selectedOffer && (
                <motion.div
                    key="select_payment"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="px-6 py-8"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <button onClick={() => setStep("enter_bill")}><ArrowLeft className="h-5 w-5" /></button>
                        <h2 className="text-xl font-extrabold">Payment</h2>
                    </div>

                    {/* Bill Summary with Calculated Amounts */}
                    <div className="bg-primary text-white rounded-2xl p-6 mb-6">
                        <p className="text-sm opacity-80 mb-1">{selectedOffer.title}</p>
                        <div className="flex items-baseline gap-3">
                            <p className="text-4xl font-extrabold">₹{calculateDiscount().final.toLocaleString('en-IN')}</p>
                            <p className="text-lg line-through opacity-60">₹{parseFloat(billAmount).toLocaleString('en-IN')}</p>
                        </div>
                        <p className="text-sm opacity-80 mt-2">
                            Student saves ₹{calculateDiscount().discount.toLocaleString('en-IN')} 🎉
                        </p>
                    </div>

                    <p className="text-sm text-gray-500 mb-4">How is {student?.name} paying?</p>

                    <div className="space-y-3">
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handlePaymentSelect("cash")}
                            className="w-full p-5 rounded-2xl border-2 border-gray-200 flex items-center gap-4 hover:border-green-500 hover:bg-green-50"
                        >
                            <div className="h-14 w-14 bg-green-100 rounded-xl flex items-center justify-center">
                                <Banknote className="h-7 w-7 text-green-600" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold">Cash</p>
                                <p className="text-xs text-gray-500">Collect ₹{selectedOffer.finalPrice} in cash</p>
                            </div>
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handlePaymentSelect("online")}
                            className="w-full p-5 rounded-2xl border-2 border-gray-200 flex items-center gap-4 hover:border-blue-500 hover:bg-blue-50"
                        >
                            <div className="h-14 w-14 bg-blue-100 rounded-xl flex items-center justify-center">
                                <CreditCard className="h-7 w-7 text-blue-600" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold">Online / UPI</p>
                                <p className="text-xs text-gray-500">Student scans your payment QR</p>
                            </div>
                        </motion.button>
                    </div>
                </motion.div>
            )}

            {/* Step 5a: Cash Payment */}
            {step === "payment_cash" && selectedOffer && (
                <motion.div
                    key="payment_cash"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="px-6 py-8 flex flex-col items-center"
                >
                    <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center">
                        <Banknote className="h-12 w-12 text-green-600" />
                    </div>

                    <h2 className="text-xl font-extrabold mt-6">Collect Cash</h2>

                    <div className="bg-green-50 rounded-2xl p-6 mt-6 text-center w-full">
                        <p className="text-sm text-gray-600">Collect from {student?.name}</p>
                        <p className="text-4xl font-extrabold text-green-600 mt-2">₹{selectedOffer.finalPrice}</p>
                        <p className="text-xs text-green-700 mt-2 font-medium">
                            Student saves ₹{selectedOffer.discountAmount} 💚
                        </p>
                    </div>

                    <div className="mt-8 w-full space-y-3">
                        <Button onClick={handleBillPaid} className="w-full h-14 bg-green-600 text-white font-bold rounded-2xl text-base">
                            <Check className="h-5 w-5 mr-2" /> Bill Paid Successfully
                        </Button>
                        <Button onClick={() => setStep("select_payment")} variant="outline" className="w-full h-12 rounded-xl">Back</Button>
                    </div>
                </motion.div>
            )}

            {/* Step 5b: Online Payment - Show MERCHANT's UPI QR */}
            {step === "payment_online" && selectedOffer && (
                <motion.div
                    key="payment_online"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="px-6 py-8 flex flex-col items-center"
                >
                    <h2 className="text-xl font-extrabold mb-2">Student Scans to Pay</h2>
                    <p className="text-gray-500 text-sm mb-6">Show your payment QR to {student?.name}</p>

                    <div className="bg-white rounded-3xl p-6 shadow-xl border">
                        <div className="bg-blue-50 rounded-2xl p-4 mb-4 text-center">
                            <p className="text-sm text-gray-600">Amount to Pay</p>
                            <p className="text-3xl font-extrabold text-blue-600">₹{selectedOffer.finalPrice}</p>
                        </div>
                        <div className="flex justify-center">
                            {merchant?.paymentQrUrl ? (
                                <img src={merchant.paymentQrUrl} alt="Your Payment QR" className="w-48 h-48 rounded-lg border object-contain bg-white" />
                            ) : (
                                <div className="w-48 h-48 rounded-lg border bg-gray-100 flex items-center justify-center">
                                    <p className="text-xs text-gray-400 text-center px-4">No Payment QR uploaded. Add in Settings.</p>
                                </div>
                            )}
                        </div>
                        <p className="text-center text-xs text-gray-400 mt-4">Your UPI Payment QR</p>
                    </div>

                    <p className="text-xs text-green-600 mt-4 text-center font-medium">
                        {student?.name} saves ₹{selectedOffer.discountAmount} with this offer! 💚
                    </p>

                    <div className="mt-8 w-full space-y-3">
                        <Button onClick={handleBillPaid} className="w-full h-14 bg-blue-600 text-white font-bold rounded-2xl text-base">
                            <Check className="h-5 w-5 mr-2" /> Bill Paid Successfully
                        </Button>
                        <Button onClick={() => setStep("select_payment")} variant="outline" className="w-full h-12 rounded-xl">Back</Button>
                    </div>
                </motion.div>
            )}

            {/* Step 6: Premium Success Screen - Apple Level */}
            {step === "success" && student && selectedOffer && (
                <motion.div
                    key="success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center min-h-[85vh] px-6 relative"
                >
                    {/* Subtle gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-b from-green-50/50 via-white to-emerald-50/30 -z-10" />

                    {/* Elegant Success Animation */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
                        className="relative"
                    >
                        {/* Subtle ring pulse */}
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                            transition={{ repeat: 2, duration: 1.2, delay: 0.3 }}
                            className="absolute inset-0 rounded-full border-2 border-primary/30"
                        />
                        <div className="h-24 w-24 bg-gradient-to-br from-primary to-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-primary/20">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4, type: "spring" }}
                            >
                                <Check className="h-12 w-12 text-white" strokeWidth={2.5} />
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Payment Info */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="text-center mt-8"
                    >
                        <p className="text-gray-400 text-sm font-medium tracking-wide uppercase">Payment Received</p>
                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="text-5xl font-bold text-gray-900 mt-3 tracking-tight"
                        >
                            ₹{selectedOffer.finalPrice}
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.9 }}
                            className="text-gray-400 text-sm mt-2"
                        >
                            {paymentMethod === "online" ? "Online Payment" : "Cash"}
                        </motion.p>
                    </motion.div>

                    {/* Elegant Thank You Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.1 }}
                        className="w-full mt-10"
                    >
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                            {/* Student Info Row */}
                            <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
                                <div className="h-14 w-14 rounded-2xl overflow-hidden bg-gray-100">
                                    <img src={student.profileImage || ''} alt="" className="h-full w-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-900">{student.name}</p>
                                    <p className="text-xs text-primary font-mono">{student.bbId}</p>
                                </div>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 1.4, type: "spring" }}
                                    className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center"
                                >
                                    <Check className="h-5 w-5 text-green-600" />
                                </motion.div>
                            </div>

                            {/* Savings Highlight */}
                            <div className="pt-5 text-center">
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Student Saved</p>
                                <motion.p
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 1.6, type: "spring" }}
                                    className="text-3xl font-bold text-primary mt-1"
                                >
                                    ₹{selectedOffer.discountAmount}
                                </motion.p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Thank You Message */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.8 }}
                        className="mt-8 text-center"
                    >
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="h-5 w-5 bg-primary rounded flex items-center justify-center">
                                <span className="text-white font-bold text-[10px]">B</span>
                            </div>
                            <span className="text-sm font-semibold text-gray-600">Backbenchers</span>
                        </div>
                        <p className="text-sm text-gray-400">
                            Thank you for supporting students 💚
                        </p>
                    </motion.div>

                    {/* Next Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2.2 }}
                        className="mt-10 w-full"
                    >
                        <Button
                            onClick={resetScan}
                            className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-2xl text-base shadow-lg shadow-gray-900/10"
                        >
                            Scan Next Student
                        </Button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {showConfirmation && selectedOffer && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white rounded-3xl p-6 w-full max-w-sm"
                        >
                            <h3 className="font-bold text-lg text-center">Confirm Payment</h3>
                            <p className="text-gray-500 text-sm text-center mt-2">
                                Did you receive ₹{selectedOffer.finalPrice} from {student?.name}?
                            </p>

                            <div className="bg-gray-50 rounded-xl p-4 mt-4 text-center">
                                <p className="text-3xl font-extrabold text-primary">₹{selectedOffer.finalPrice}</p>
                                <p className="text-xs text-gray-500 mt-1">via {paymentMethod === "online" ? "Online" : "Cash"}</p>
                            </div>

                            <div className="bg-blue-50 rounded-xl p-3 mt-4">
                                <p className="text-xs text-blue-700 text-center">
                                    ✓ {student?.name}'s savings will be updated<br />
                                    ✓ Your sales data will be recorded
                                </p>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <Button onClick={() => setShowConfirmation(false)} variant="outline" className="flex-1 h-12 rounded-xl">Cancel</Button>
                                <Button onClick={handleConfirmPayment} disabled={isProcessing} className="flex-1 h-12 bg-primary text-white font-bold rounded-xl">
                                    {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm"}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
