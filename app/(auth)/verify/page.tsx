"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, RefreshCw, Loader2, AlertCircle, Mail, ChevronDown, MapPin, Building2, GraduationCap, Camera, UserCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { authService, isValidStudentEmail, getInvalidDomainError, ALLOWED_COLLEGE_DOMAINS } from "@/lib/services/auth.service";
import { universityService, University } from "@/lib/services/university.service";
import { INDIAN_STATES, getCitiesForState } from "@/lib/data/locations";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

export default function VerifyPage() {
    const router = useRouter();
    const [step, setStep] = useState<"details" | "location" | "university" | "email" | "otp" | "photo" | "success">("details");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [googleEmail, setGoogleEmail] = useState("");
    const [showPWAPrompt, setShowPWAPrompt] = useState(false);
    const [studentId, setStudentId] = useState<string | null>(null);

    // Camera and face detection state
    const [showCamera, setShowCamera] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isSavingPhoto, setIsSavingPhoto] = useState(false);
    const [faceCount, setFaceCount] = useState(0);
    const [faceDetectionSupported, setFaceDetectionSupported] = useState(true);
    const [isDetecting, setIsDetecting] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const faceDetectorRef = useRef<any>(null);
    const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Form data
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        gender: "",
        dob: "",
        phone: "", // 10 digit Indian mobile number
        state: "",
        city: "",
        universityId: "",
        universityName: "",
        collegeEmail: ""
    });

    // Available options based on selection
    const [availableCities, setAvailableCities] = useState<string[]>([]);
    const [availableUniversities, setAvailableUniversities] = useState<University[]>([]);
    const [totalUniversitiesCount, setTotalUniversitiesCount] = useState(0);
    const [loadingUniversities, setLoadingUniversities] = useState(false);

    // OTP state
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [otpError, setOtpError] = useState("");
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Resend timer
    const [resendTimer, setResendTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    // Get total university count on mount
    useEffect(() => {
        universityService.getCount().then(setTotalUniversitiesCount);
    }, []);

    // Check if user is signed in with Google and if they already have a student account
    useEffect(() => {
        async function checkAuth() {
            try {
                // If URL has hash fragment (OAuth tokens), redirect to callback first
                if (window.location.hash && window.location.hash.includes('access_token')) {
                    console.log('OAuth tokens in verify page - redirecting to callback');
                    const authFlow = localStorage.getItem('auth_flow');
                    if (authFlow === 'merchant') {
                        localStorage.removeItem('auth_flow');
                        router.replace('/merchant/auth/callback' + window.location.hash);
                    } else {
                        router.replace('/auth/callback' + window.location.hash);
                    }
                    return;
                }

                // Import supabase directly for database check
                const { supabase } = await import("@/lib/supabase");

                // Get the current auth session
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    console.log("No session - redirecting to signup");
                    router.push("/signup");
                    return;
                }

                const userEmail = session.user.email?.toLowerCase() || "";
                console.log("=== AUTH CHECK ===");
                console.log("User ID:", session.user.id);
                console.log("User email:", userEmail);
                setGoogleEmail(userEmail);

                // Check if student record exists by user_id
                let { data: student, error: err1 } = await supabase
                    .from('students')
                    .select('id, bb_id, status, email')
                    .eq('user_id', session.user.id)
                    .maybeSingle();

                console.log("Query by user_id result:", student, "Error:", err1?.message);

                if (student) {
                    console.log("✅ Student found by user_id:", student);
                    router.push("/dashboard");
                    return;
                }

                // Try by email column
                const { data: studentByEmail, error: err2 } = await supabase
                    .from('students')
                    .select('id, bb_id, status, user_id, email')
                    .eq('email', userEmail)
                    .maybeSingle();

                console.log("Query by email result:", studentByEmail, "Error:", err2?.message);

                if (studentByEmail) {
                    console.log("✅ Student found by email:", studentByEmail);
                    // Update user_id if needed
                    if (studentByEmail.user_id !== session.user.id) {
                        console.log("Updating user_id...");
                        await supabase
                            .from('students')
                            .update({ user_id: session.user.id })
                            .eq('id', studentByEmail.id);
                    }
                    router.push("/dashboard");
                    return;
                }

                // Try by college_email column
                const { data: studentByCollegeEmail, error: err3 } = await supabase
                    .from('students')
                    .select('id, bb_id, status, user_id, email, college_email')
                    .eq('college_email', userEmail)
                    .maybeSingle();

                console.log("Query by college_email result:", studentByCollegeEmail, "Error:", err3?.message);

                if (studentByCollegeEmail) {
                    console.log("✅ Student found by college_email:", studentByCollegeEmail);
                    if (studentByCollegeEmail.user_id !== session.user.id) {
                        await supabase
                            .from('students')
                            .update({ user_id: session.user.id })
                            .eq('id', studentByCollegeEmail.id);
                    }
                    router.push("/dashboard");
                    return;
                }

                // No match - show debug info
                console.log("❌ No student record found for email:", userEmail);
                console.log("Showing onboarding form...");

            } catch (error) {
                console.error("Auth check error:", error);
            } finally {
                setCheckingAuth(false);
            }
        }
        checkAuth();
    }, [router]);

    // Update cities when state changes
    useEffect(() => {
        if (formData.state) {
            const cities = getCitiesForState(formData.state);
            setAvailableCities(cities);
            setFormData(prev => ({ ...prev, city: "", universityId: "", universityName: "" }));
            setAvailableUniversities([]);
        }
    }, [formData.state]);

    // Fetch universities from Supabase when city changes
    useEffect(() => {
        async function fetchUniversities() {
            if (formData.city) {
                setLoadingUniversities(true);
                try {
                    const universities = await universityService.getByCity(formData.city);
                    setAvailableUniversities(universities);
                } catch (error) {
                    console.error("Failed to fetch universities:", error);
                    setAvailableUniversities([]);
                } finally {
                    setLoadingUniversities(false);
                }
            }
        }
        fetchUniversities();
    }, [formData.city]);

    // Resend timer for OTP
    useEffect(() => {
        if (step === "otp" && resendTimer > 0) {
            const interval = setInterval(() => {
                setResendTimer((prev) => {
                    if (prev <= 1) {
                        setCanResend(true);
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [step, resendTimer]);

    const handleDetailsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setStep("location");
    };

    const handleLocationSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!formData.state || !formData.city) {
            setError("Please select your state and city");
            return;
        }
        setStep("university");
    };

    const handleUniversitySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!formData.universityId) {
            setError("Please select your university");
            return;
        }
        setStep("email");
    };

    const handleUniversityChange = (universityId: string) => {
        const university = availableUniversities.find(u => u.id === universityId);
        setFormData({
            ...formData,
            universityId,
            universityName: university?.name || ""
        });
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const email = formData.collegeEmail.toLowerCase().trim();

        // STRICT college domain validation (.ac.in, .edu.in, .edu ONLY)
        if (!isValidStudentEmail(email)) {
            setError(getInvalidDomainError());
            setLoading(false);
            return;
        }

        try {
            // Check if email already exists
            const exists = await authService.checkCollegeEmailExists(email);
            if (exists) {
                setError("This college email is already registered with another account.");
                setLoading(false);
                return;
            }

            // Send OTP to college email
            const result = await authService.sendCollegeEmailOTP(email);
            if (!result.success) {
                setError(result.error || "Failed to send OTP");
                setLoading(false);
                return;
            }

            // Move to OTP step
            setStep("otp");
            setResendTimer(60);
            setCanResend(false);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setOtpError("");

        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }

        if (newOtp.every(d => d.length === 1)) {
            handleVerifyOTP(newOtp.join(""));
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOTP = async (code: string) => {
        setLoading(true);
        setOtpError("");

        try {
            // ONLY after successful OTP verification, student is added to database
            const result = await authService.verifyCollegeEmailOTP(
                formData.collegeEmail,
                code,
                googleEmail, // Pass the Google account email for storage in 'email' field
                {
                    name: `${formData.firstName} ${formData.lastName}`.trim(),
                    dob: formData.dob,
                    gender: formData.gender,
                    phone: `+91${formData.phone}`, // Full phone with country code
                    college: formData.universityName, // Store university name
                    city: formData.city,
                    state: formData.state,
                    universityId: formData.universityId // Store university ID for reference
                }
            );

            if (!result.success) {
                setOtpError(result.error || "Invalid OTP");
                setOtp(["", "", "", "", "", ""]);
                otpRefs.current[0]?.focus();
                setLoading(false);
                return;
            }
            // Success - go to photo step for optional face verification
            setStudentId(result.data?.studentId || null);
            setStep("photo");
            setLoading(false);
        } catch (error: any) {
            setOtpError(error.message);
            setOtp(["", "", "", "", "", ""]);
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;
        setLoading(true);

        try {
            await authService.sendCollegeEmailOTP(formData.collegeEmail);
            setResendTimer(60);
            setCanResend(false);
        } catch (error) {
            console.error("Resend error:", error);
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => {
        if (step === "location") setStep("details");
        else if (step === "university") setStep("location");
        else if (step === "email") setStep("university");
        else if (step === "otp") setStep("email");
        // Note: Can't go back from photo step - OTP already verified
    };

    // Camera functions for face verification
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 640, height: 640 }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    startFaceDetection();
                };
            }
            setShowCamera(true);
        } catch (err) {
            console.error('Camera error:', err);
            setError('Could not access camera. Please grant permission.');
        }
    };

    const stopCamera = () => {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
        }
        setIsDetecting(false);
        setFaceCount(0);

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setShowCamera(false);
    };

    const startFaceDetection = async () => {
        // Check if FaceDetector API is available (Chrome only, requires flags)
        try {
            if ('FaceDetector' in window) {
                console.log('FaceDetector API available, initializing...');
                faceDetectorRef.current = new (window as any).FaceDetector({
                    fastMode: true,
                    maxDetectedFaces: 5
                });
                setIsDetecting(true);
                setFaceDetectionSupported(true);

                const detectFaces = async () => {
                    if (videoRef.current && faceDetectorRef.current && videoRef.current.readyState === 4) {
                        try {
                            const faces = await faceDetectorRef.current.detect(videoRef.current);
                            setFaceCount(faces.length);
                        } catch (e) {
                            console.log('Face detection frame error:', e);
                        }
                    }
                };

                detectionIntervalRef.current = setInterval(detectFaces, 250);
            } else {
                // FaceDetector not available - allow capture without face detection
                console.log('FaceDetector API not available in this browser');
                setFaceDetectionSupported(false);
                // Set faceCount to 1 to allow capture button to work
                setFaceCount(1);
            }
        } catch (e) {
            console.log('Face detection initialization error:', e);
            setFaceDetectionSupported(false);
            setFaceCount(1); // Allow capture without detection
        }
    };

    const capturePhoto = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = Math.min(video.videoWidth, video.videoHeight);
        const x = (video.videoWidth - size) / 2;
        const y = (video.videoHeight - size) / 2;
        ctx.drawImage(video, x, y, size, size, 0, 0, 400, 400);

        const imageData = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(imageData);
        stopCamera();

        // Upload the photo and generate BB ID
        setIsSavingPhoto(true);
        try {
            const blob = await (await fetch(imageData)).blob();
            const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });

            const { studentService } = await import('@/lib/services/student.service');
            const result = await studentService.updateProfileImage(file);

            if (result.success) {
                // Photo uploaded successfully - BB ID should be generated
                setStep("success");
                setShowPWAPrompt(true);
            } else {
                setError(result.error || 'Failed to save photo');
            }
        } catch (err) {
            console.error('Photo upload error:', err);
            setError('Failed to save photo. You can try again from your profile.');
        } finally {
            setIsSavingPhoto(false);
        }
    };

    const skipPhoto = () => {
        // Skip photo - go to success without BB ID
        setCapturedImage(null);
        setStep("success");
        setShowPWAPrompt(true);
    };

    if (checkingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const stepIndex = ["details", "location", "university", "email", "otp", "photo"].indexOf(step);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/3" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md space-y-6 bg-white/50 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-xl"
            >
                {/* Progress */}
                <div className="flex items-center gap-1 justify-center mb-4">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center">
                            <div className={`h-2 w-6 rounded-full transition-colors ${i <= stepIndex ? "bg-primary" : "bg-gray-200"
                                }`} />
                        </div>
                    ))}
                </div>

                {/* Google Account Display */}
                {googleEmail && (
                    <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-blue-600">Signed in as</p>
                            <p className="font-semibold text-sm text-blue-900">{googleEmail}</p>
                        </div>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {/* Step 1: Personal Details */}
                    {step === "details" && (
                        <motion.form
                            key="details"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleDetailsSubmit}
                            className="space-y-4"
                        >
                            <div className="text-center mb-4">
                                <h2 className="text-xl font-bold">Personal Details</h2>
                                <p className="text-sm text-gray-500">Tell us about yourself</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder="First Name"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                    className="h-12 bg-white border border-gray-200 rounded-xl px-4"
                                />
                                <input
                                    type="text"
                                    placeholder="Last Name"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    required
                                    className="h-12 bg-white border border-gray-200 rounded-xl px-4"
                                />
                            </div>

                            <div className="relative">
                                <select
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    required
                                    className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 pr-10 appearance-none"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                            </div>

                            <input
                                type="date"
                                placeholder="Date of Birth"
                                value={formData.dob}
                                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                required
                                className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4"
                            />

                            {/* Mobile Number Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Mobile Number</label>
                                <div className="flex gap-2">
                                    <div className="flex items-center px-4 bg-gray-100 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm">
                                        🇮🇳 +91
                                    </div>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        maxLength={10}
                                        placeholder="10 digit mobile number"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                        required
                                        className="flex-1 h-12 bg-white border border-gray-200 rounded-xl px-4"
                                    />
                                </div>
                                <p className="text-xs text-amber-600 flex items-center gap-1">
                                    ⚠️ Mobile number cannot be changed after verification
                                </p>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 font-semibold"
                                disabled={formData.phone.length !== 10}
                            >
                                Continue
                            </Button>
                        </motion.form>
                    )}

                    {/* Step 2: Location (State & City) */}
                    {step === "location" && (
                        <motion.form
                            key="location"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleLocationSubmit}
                            className="space-y-4"
                        >
                            <button type="button" onClick={goBack} className="flex items-center text-sm text-gray-500">
                                <ArrowLeft className="h-4 w-4 mr-1" /> Back
                            </button>

                            <div className="text-center mb-4">
                                <MapPin className="h-12 w-12 text-primary mx-auto mb-3" />
                                <h2 className="text-xl font-bold">Your Location</h2>
                                <p className="text-sm text-gray-500">Select your state and city</p>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 rounded-xl p-3 flex items-center gap-2 text-sm">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* State Dropdown */}
                            <div className="relative">
                                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">State</label>
                                <select
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    required
                                    className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 pr-10 appearance-none"
                                >
                                    <option value="">Select State</option>
                                    {INDIAN_STATES.map(state => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-[60%] -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                            </div>

                            {/* City Dropdown */}
                            <div className="relative">
                                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">City</label>
                                <select
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    required
                                    disabled={!formData.state}
                                    className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 pr-10 appearance-none disabled:opacity-50"
                                >
                                    <option value="">{formData.state ? "Select City" : "Select state first"}</option>
                                    {availableCities.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-[60%] -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                            </div>

                            <Button type="submit" className="w-full h-12 font-semibold" disabled={!formData.state || !formData.city}>
                                Continue
                            </Button>
                        </motion.form>
                    )}

                    {/* Step 3: University Selection (from Supabase) */}
                    {step === "university" && (
                        <motion.form
                            key="university"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleUniversitySubmit}
                            className="space-y-4"
                        >
                            <button type="button" onClick={goBack} className="flex items-center text-sm text-gray-500">
                                <ArrowLeft className="h-4 w-4 mr-1" /> Back
                            </button>

                            <div className="text-center mb-4">
                                <GraduationCap className="h-12 w-12 text-primary mx-auto mb-3" />
                                <h2 className="text-xl font-bold">Your University</h2>
                                <p className="text-sm text-gray-500">
                                    {totalUniversitiesCount} universities available across India
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 rounded-xl p-3 flex items-center gap-2 text-sm">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            {loadingUniversities ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : availableUniversities.length > 0 ? (
                                <div className="relative">
                                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                                        Universities in {formData.city}
                                    </label>
                                    <select
                                        value={formData.universityId}
                                        onChange={(e) => handleUniversityChange(e.target.value)}
                                        required
                                        className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 pr-10 appearance-none"
                                    >
                                        <option value="">Select University</option>
                                        {availableUniversities.map(uni => (
                                            <option key={uni.id} value={uni.id}>
                                                {uni.name} {uni.shortName ? `(${uni.shortName})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-[60%] -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                </div>
                            ) : (
                                <div className="bg-yellow-50 rounded-xl p-4 text-center">
                                    <Building2 className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                                    <p className="text-sm text-yellow-700 font-medium">
                                        No universities listed yet in {formData.city}
                                    </p>
                                    <p className="text-xs text-yellow-600 mt-1">
                                        We're expanding! Contact support to add your university.
                                    </p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-12 font-semibold"
                                disabled={!formData.universityId}
                            >
                                Continue
                            </Button>
                        </motion.form>
                    )}

                    {/* Step 4: College Email */}
                    {step === "email" && (
                        <motion.form
                            key="email"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleEmailSubmit}
                            className="space-y-4"
                        >
                            <button type="button" onClick={goBack} className="flex items-center text-sm text-gray-500">
                                <ArrowLeft className="h-4 w-4 mr-1" /> Back
                            </button>

                            <div className="text-center mb-4">
                                <Mail className="h-12 w-12 text-primary mx-auto mb-3" />
                                <h2 className="text-xl font-bold">College Email</h2>
                                <p className="text-sm text-gray-500">Enter your official college email</p>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 rounded-xl p-3 flex items-center gap-2 text-sm">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div>
                                <input
                                    type="email"
                                    placeholder="yourname@college.edu"
                                    value={formData.collegeEmail}
                                    onChange={(e) => setFormData({ ...formData, collegeEmail: e.target.value })}
                                    required
                                    className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Use your official college email address
                                </p>
                            </div>

                            <Button type="submit" className="w-full h-12 font-semibold" disabled={loading}>
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send OTP"}
                            </Button>
                        </motion.form>
                    )}

                    {/* Step 5: OTP Verification */}
                    {step === "otp" && (
                        <motion.div
                            key="otp"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <button type="button" onClick={goBack} className="flex items-center text-sm text-gray-500">
                                <ArrowLeft className="h-4 w-4 mr-1" /> Back
                            </button>

                            <div className="text-center mb-4">
                                <h2 className="text-xl font-bold">Verify OTP</h2>
                                <p className="text-sm text-gray-500">
                                    Enter the 6-digit code sent to<br />
                                    <strong className="text-primary">{formData.collegeEmail}</strong>
                                </p>
                            </div>

                            {otpError && (
                                <div className="bg-red-50 text-red-600 rounded-xl p-3 flex items-center gap-2 text-sm">
                                    <AlertCircle className="h-4 w-4" />
                                    {otpError}
                                </div>
                            )}

                            <div className="flex justify-center gap-2">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => { otpRefs.current[index] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        className="h-14 w-12 text-center text-xl font-bold border-2 rounded-xl focus:border-primary focus:outline-none"
                                        disabled={loading}
                                    />
                                ))}
                            </div>

                            <div className="text-center">
                                {canResend ? (
                                    <button
                                        onClick={handleResend}
                                        disabled={loading}
                                        className="text-primary font-semibold text-sm flex items-center justify-center gap-2 mx-auto"
                                    >
                                        <RefreshCw className="h-4 w-4" /> Resend OTP
                                    </button>
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        Resend in <span className="font-bold text-primary">{resendTimer}s</span>
                                    </p>
                                )}
                            </div>

                            {loading && (
                                <div className="flex justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Step 6: Photo Verification (Optional) */}
                    {step === "photo" && (
                        <motion.div
                            key="photo"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="text-center mb-4">
                                <Camera className="h-12 w-12 text-primary mx-auto mb-3" />
                                <h2 className="text-xl font-bold">Take a Selfie</h2>
                                <p className="text-sm text-gray-500">Optional but required for discounts</p>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 rounded-xl p-3 flex items-center gap-2 text-sm">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            {!showCamera && !capturedImage && (
                                <div className="space-y-4">
                                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                                        <p className="text-sm text-amber-800">
                                            📸 <strong>Upload a selfie to get your BB Student ID & QR code.</strong><br />
                                            <span className="text-xs text-amber-600">You need this to redeem discounts at partner stores.</span>
                                        </p>
                                    </div>
                                    <Button onClick={startCamera} className="w-full h-12 font-semibold">
                                        <Camera className="h-5 w-5 mr-2" /> Take Selfie Now
                                    </Button>
                                    <button
                                        onClick={skipPhoto}
                                        className="w-full text-gray-500 text-sm hover:text-gray-700 py-2"
                                    >
                                        Skip for now (no BB ID)
                                    </button>
                                </div>
                            )}

                            {showCamera && (
                                <div className="relative">
                                    <div className={`relative rounded-2xl overflow-hidden border-4 transition-colors ${faceCount === 1 ? 'border-green-500' :
                                        faceCount === 0 ? 'border-yellow-500' : 'border-red-500'
                                        }`}>
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full aspect-square object-cover"
                                        />
                                        <canvas ref={canvasRef} className="hidden" />

                                        {/* Face detection status */}
                                        <div className="absolute bottom-4 left-0 right-0 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${faceCount === 1 ? 'bg-green-500 text-white' :
                                                faceCount === 0 ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'
                                                }`}>
                                                {faceCount === 1 ? '✓ Face detected' :
                                                    faceCount === 0 ? 'Position your face' : 'Only one face please'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                        <Button
                                            variant="outline"
                                            onClick={stopCamera}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={capturePhoto}
                                            disabled={faceDetectionSupported && faceCount !== 1}
                                            className="flex-1"
                                        >
                                            Capture
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {isSavingPhoto && (
                                <div className="flex flex-col items-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                                    <p className="text-sm text-gray-500">Saving your photo...</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Step 7: Success + PWA Prompt */}
                    {step === "success" && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-8"
                        >
                            {/* PWA Install Prompt */}
                            {showPWAPrompt && (
                                <PWAInstallPrompt
                                    onComplete={() => {
                                        setShowPWAPrompt(false);
                                        router.push('/dashboard');
                                    }}
                                />
                            )}

                            {!showPWAPrompt && (
                                <>
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", duration: 0.6 }}
                                        className="h-20 w-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6"
                                    >
                                        <Check className="h-10 w-10 text-white" strokeWidth={3} />
                                    </motion.div>
                                    <h2 className="text-2xl font-extrabold mb-2">You're Verified! 🎉</h2>
                                    <p className="text-gray-500 mb-6">
                                        Welcome to BackBenchers!
                                    </p>
                                    <div className="bg-primary/10 border border-primary/20 rounded-2xl px-6 py-4 inline-block">
                                        <p className="text-sm text-gray-500 mb-1">Your BB-ID will be generated</p>
                                        <p className="text-sm text-primary font-semibold">after admin verification</p>
                                    </div>
                                    <p className="mt-6 text-sm text-gray-400">Redirecting...</p>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
