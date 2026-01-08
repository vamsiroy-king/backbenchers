"use client";

import { ArrowLeft, Loader2, AlertCircle, ChevronDown, Check, RefreshCw } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { authService, isValidStudentEmail, getInvalidDomainError } from "@/lib/services/auth.service";
import { universityService, University } from "@/lib/services/university.service";
import { INDIAN_STATES, getCitiesForState } from "@/lib/data/locations";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import FaceCamera from "@/components/FaceCamera";

// Input component - District style
const Input = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="space-y-2">
        <label className="text-xs font-medium text-white/40 uppercase tracking-wider">{label}</label>
        <input {...props} className="w-full h-12 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-green-500/50 transition-colors" />
    </div>
);

// Select component
const Select = ({ label, options, placeholder, ...props }: { label: string; options: { value: string; label: string }[]; placeholder: string } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <div className="space-y-2">
        <label className="text-xs font-medium text-white/40 uppercase tracking-wider">{label}</label>
        <div className="relative">
            <select {...props} className="w-full h-12 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 pr-10 text-white appearance-none focus:outline-none focus:border-green-500/50 transition-colors">
                <option value="" className="bg-[#0a0a0a]">{placeholder}</option>
                {options.map(o => <option key={o.value} value={o.value} className="bg-[#0a0a0a]">{o.label}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
        </div>
    </div>
);

// Progress bar
const Progress = ({ current, total }: { current: number; total: number }) => (
    <div className="flex gap-1 mb-6">
        {Array.from({ length: total }).map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i < current ? 'bg-green-500' : i === current ? 'bg-white' : 'bg-white/10'}`} />
        ))}
    </div>
);

export default function VerifyPage() {
    const router = useRouter();
    const [step, setStep] = useState<"details" | "location" | "university" | "email" | "otp" | "photo" | "success">("details");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [googleEmail, setGoogleEmail] = useState("");
    const [showPWAPrompt, setShowPWAPrompt] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        firstName: "", lastName: "", gender: "", dob: "", phone: "",
        state: "", city: "", universityId: "", universityName: "", collegeEmail: ""
    });

    const [availableCities, setAvailableCities] = useState<string[]>([]);
    const [availableUniversities, setAvailableUniversities] = useState<University[]>([]);
    const [totalUniversitiesCount, setTotalUniversitiesCount] = useState(0);
    const [loadingUniversities, setLoadingUniversities] = useState(false);

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [otpError, setOtpError] = useState("");
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [resendTimer, setResendTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => { universityService.getCount().then(setTotalUniversitiesCount); }, []);

    useEffect(() => {
        async function checkAuth() {
            try {
                if (window.location.hash?.includes('access_token')) {
                    router.replace('/auth/callback' + window.location.hash);
                    return;
                }
                const { supabase } = await import("@/lib/supabase");
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) { router.push("/signup"); return; }
                setGoogleEmail(session.user.email?.toLowerCase() || "");

                // Check by user_id first
                const { data: student } = await supabase.from('students').select('id').eq('user_id', session.user.id).maybeSingle();
                if (student) { router.push("/dashboard"); return; }

                // Also check by email (in case user_id doesn't match)
                if (session.user.email) {
                    const { data: studentByEmail } = await supabase.from('students').select('id, user_id').eq('email', session.user.email.toLowerCase()).maybeSingle();
                    if (studentByEmail) {
                        // Update user_id if needed and redirect to dashboard
                        if (studentByEmail.user_id !== session.user.id) {
                            await supabase.from('students').update({ user_id: session.user.id }).eq('id', studentByEmail.id);
                        }
                        router.push("/dashboard");
                        return;
                    }
                }

                // No student found - show onboarding form
            } catch (e) { console.error(e); }
            finally { setCheckingAuth(false); }
        }
        checkAuth();
    }, [router]);

    useEffect(() => {
        if (!googleEmail) return;
        try {
            const saved = localStorage.getItem('onboarding_state');
            if (saved) {
                const p = JSON.parse(saved);
                if (p.googleEmail === googleEmail && p.step !== 'success') {
                    setStep(p.step);
                    setFormData(prev => ({ ...prev, ...p.formData }));
                }
            }
        } catch (e) { }
    }, [googleEmail]);

    useEffect(() => {
        if (!googleEmail || step === 'success') { localStorage.removeItem('onboarding_state'); return; }
        localStorage.setItem('onboarding_state', JSON.stringify({ step, formData, googleEmail }));
    }, [step, formData, googleEmail]);

    useEffect(() => {
        if (formData.state) {
            setAvailableCities(getCitiesForState(formData.state));
            setFormData(prev => ({ ...prev, city: "", universityId: "", universityName: "" }));
        }
    }, [formData.state]);

    useEffect(() => {
        if (formData.city) {
            setLoadingUniversities(true);
            universityService.getByCity(formData.city).then(setAvailableUniversities).finally(() => setLoadingUniversities(false));
        }
    }, [formData.city]);

    useEffect(() => {
        if (step === "otp" && resendTimer > 0) {
            const i = setInterval(() => setResendTimer(p => p <= 1 ? (setCanResend(true), 0) : p - 1), 1000);
            return () => clearInterval(i);
        }
    }, [step, resendTimer]);

    const stepIndex = ["details", "location", "university", "email", "otp", "photo"].indexOf(step);
    const goBack = () => {
        if (step === "location") setStep("details");
        else if (step === "university") setStep("location");
        else if (step === "email") setStep("university");
        else if (step === "otp") setStep("email");
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setError(""); setLoading(true);
        const email = formData.collegeEmail.toLowerCase().trim();
        if (!isValidStudentEmail(email)) { setError(getInvalidDomainError()); setLoading(false); return; }
        try {
            if (await authService.checkCollegeEmailExists(email)) { setError("Email already registered."); setLoading(false); return; }
            const r = await authService.sendCollegeEmailOTP(email);
            if (!r.success) { setError(r.error || "Failed to send OTP"); setLoading(false); return; }
            setStep("otp"); setResendTimer(60); setCanResend(false);
        } catch (e: any) { setError(e.message); } finally { setLoading(false); }
    };

    const handleOtpChange = (i: number, val: string) => {
        if (val.length > 1) return;
        const newOtp = [...otp]; newOtp[i] = val; setOtp(newOtp); setOtpError("");
        if (val && i < 5) otpRefs.current[i + 1]?.focus();
        if (newOtp.every(d => d)) handleVerifyOTP(newOtp.join(""));
    };

    const handleVerifyOTP = async (code: string) => {
        setLoading(true); setOtpError("");
        try {
            const r = await authService.verifyCollegeEmailOTP(formData.collegeEmail, code, googleEmail, {
                name: `${formData.firstName} ${formData.lastName}`.trim(),
                dob: formData.dob, gender: formData.gender, phone: `+91${formData.phone}`,
                college: formData.universityName, city: formData.city, state: formData.state, universityId: formData.universityId
            });
            if (!r.success) { setOtpError(r.error || "Invalid OTP"); setOtp(["", "", "", "", "", ""]); setLoading(false); return; }
            setStep("photo");
        } catch (e: any) { setOtpError(e.message); setOtp(["", "", "", "", "", ""]); } finally { setLoading(false); }
    };

    const handleResend = async () => {
        if (!canResend) return;
        setLoading(true);
        try { await authService.sendCollegeEmailOTP(formData.collegeEmail); setResendTimer(60); setCanResend(false); }
        catch (e) { } finally { setLoading(false); }
    };

    if (checkingAuth) return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]"><Loader2 className="h-5 w-5 animate-spin text-green-500" /></div>;

    return (
        <div className="min-h-screen bg-[#0a0a0a] px-5 pt-12 pb-8">
            {/* Header */}
            {step !== "details" && step !== "photo" && step !== "success" && (
                <button onClick={goBack} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-6">
                    <ArrowLeft className="h-4 w-4" /><span className="text-sm">Back</span>
                </button>
            )}

            <Progress current={stepIndex} total={6} />

            {/* Google badge */}
            {googleEmail && (
                <div className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl mb-6">
                    <div className="h-8 w-8 bg-white/[0.06] rounded-full flex items-center justify-center">
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-white/40 uppercase tracking-wider">Signed in as</p>
                        <p className="text-sm text-white truncate">{googleEmail}</p>
                    </div>
                    <button onClick={async () => { const { supabase } = await import("@/lib/supabase"); await supabase.auth.signOut(); window.location.href = '/signup'; }} className="text-xs text-white/40 hover:text-white">Switch</button>
                </div>
            )}

            <AnimatePresence mode="wait">
                {step === "details" && (
                    <motion.form key="d" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} onSubmit={e => { e.preventDefault(); setStep("location"); }} className="space-y-5">
                        <div><h1 className="text-xl font-bold text-white mb-1">Personal details</h1><p className="text-sm text-white/40">Tell us about yourself</p></div>
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="First name" placeholder="John" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required />
                            <Input label="Last name" placeholder="Doe" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} required />
                        </div>
                        <Select label="Gender" placeholder="Select" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Other", label: "Other" }]} required />
                        <Input label="Date of birth" type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} required />
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Mobile</label>
                            <div className="flex gap-2">
                                <div className="h-12 px-3 bg-white/[0.04] border border-white/[0.08] rounded-xl flex items-center text-white/50 text-sm">+91</div>
                                <input type="tel" inputMode="numeric" maxLength={10} placeholder="10 digits" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} required className="flex-1 h-12 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-green-500/50" />
                            </div>
                        </div>
                        <button type="submit" disabled={formData.phone.length !== 10} className="w-full h-12 bg-green-500 hover:bg-green-400 disabled:bg-white/10 disabled:text-white/30 text-black font-semibold rounded-xl transition-colors">Continue</button>
                    </motion.form>
                )}

                {step === "location" && (
                    <motion.form key="l" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} onSubmit={e => { e.preventDefault(); if (formData.state && formData.city) setStep("university"); else setError("Select both"); }} className="space-y-5">
                        <div><h1 className="text-xl font-bold text-white mb-1">Your location</h1><p className="text-sm text-white/40">Select state and city</p></div>
                        {error && <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400"><AlertCircle className="h-4 w-4" />{error}</div>}
                        <Select label="State" placeholder="Select" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} options={INDIAN_STATES.map(s => ({ value: s, label: s }))} required />
                        <Select label="City" placeholder={formData.state ? "Select" : "Select state first"} value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} options={availableCities.map(c => ({ value: c, label: c }))} disabled={!formData.state} required />
                        <button type="submit" disabled={!formData.state || !formData.city} className="w-full h-12 bg-green-500 hover:bg-green-400 disabled:bg-white/10 disabled:text-white/30 text-black font-semibold rounded-xl transition-colors">Continue</button>
                    </motion.form>
                )}

                {step === "university" && (
                    <motion.form key="u" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} onSubmit={e => { e.preventDefault(); if (formData.universityId) setStep("email"); else setError("Select university"); }} className="space-y-5">
                        <div><h1 className="text-xl font-bold text-white mb-1">Your university</h1><p className="text-sm text-white/40">{totalUniversitiesCount} available</p></div>
                        {error && <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400"><AlertCircle className="h-4 w-4" />{error}</div>}
                        {loadingUniversities ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-white/30" /></div> :
                            availableUniversities.length > 0 ? <Select label={`In ${formData.city}`} placeholder="Select" value={formData.universityId} onChange={e => { const u = availableUniversities.find(x => x.id === e.target.value); setFormData({ ...formData, universityId: e.target.value, universityName: u?.name || "" }); }} options={availableUniversities.map(u => ({ value: u.id, label: u.name + (u.shortName ? ` (${u.shortName})` : '') }))} required />
                                : <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-sm text-orange-300">No universities in {formData.city} yet</div>}
                        <button type="submit" disabled={!formData.universityId} className="w-full h-12 bg-green-500 hover:bg-green-400 disabled:bg-white/10 disabled:text-white/30 text-black font-semibold rounded-xl transition-colors">Continue</button>
                    </motion.form>
                )}

                {step === "email" && (
                    <motion.form key="e" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} onSubmit={handleEmailSubmit} className="space-y-5">
                        <div><h1 className="text-xl font-bold text-white mb-1">College email</h1><p className="text-sm text-white/40">Enter your official email</p></div>
                        {error && <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400"><AlertCircle className="h-4 w-4" />{error}</div>}
                        <Input label="Email" type="email" placeholder="you@college.edu.in" value={formData.collegeEmail} onChange={e => setFormData({ ...formData, collegeEmail: e.target.value })} required />
                        <button type="submit" disabled={loading} className="w-full h-12 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}</button>
                    </motion.form>
                )}

                {step === "otp" && (
                    <motion.div key="o" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-5">
                        <div><h1 className="text-xl font-bold text-white mb-1">Verify OTP</h1><p className="text-sm text-white/40">Code sent to {formData.collegeEmail}</p></div>
                        {otpError && <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400"><AlertCircle className="h-4 w-4" />{otpError}</div>}
                        <div className="flex justify-center gap-2">
                            {otp.map((d, i) => <input key={i} ref={el => { otpRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={d} onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => { if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus(); }} className="w-10 h-12 text-center text-lg font-bold bg-white/[0.04] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-green-500/50" />)}
                        </div>
                        <div className="text-center">
                            {canResend ? <button onClick={handleResend} disabled={loading} className="text-green-400 text-sm font-medium flex items-center justify-center gap-2 mx-auto"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Resend</button> : <p className="text-white/40 text-sm">Resend in {resendTimer}s</p>}
                        </div>
                        {loading && <div className="flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-green-500" /></div>}
                    </motion.div>
                )}

                {step === "photo" && (
                    <motion.div key="p" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-5">
                        <div><h1 className="text-xl font-bold text-white mb-1">Profile photo</h1><p className="text-sm text-white/40">Optional for offline verification</p></div>
                        {showCamera ? <FaceCamera onCapture={img => { setCapturedImage(img); setShowCamera(false); }} onCancel={() => setShowCamera(false)} />
                            : capturedImage ? (
                                <div className="space-y-4">
                                    <div className="mx-auto h-24 w-24 rounded-full overflow-hidden border-2 border-green-500/30"><img src={capturedImage} alt="" className="w-full h-full object-cover" /></div>
                                    <div className="flex gap-3">
                                        <button onClick={() => setShowCamera(true)} className="flex-1 h-12 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white">Retake</button>
                                        <button onClick={() => { setStep("success"); setShowPWAPrompt(true); }} className="flex-1 h-12 bg-green-500 rounded-xl text-black font-semibold">Continue</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <button onClick={() => setShowCamera(true)} className="w-full h-12 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white">Take photo</button>
                                    <button onClick={() => { setStep("success"); setShowPWAPrompt(true); }} className="w-full text-center text-sm text-white/40">Skip for now</button>
                                </div>
                            )}
                    </motion.div>
                )}

                {step === "success" && (
                    <motion.div key="s" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 space-y-6">
                        <div className="mx-auto h-16 w-16 bg-green-500 rounded-full flex items-center justify-center"><Check className="h-8 w-8 text-black" /></div>
                        <div><h1 className="text-2xl font-bold text-white mb-2">You're verified</h1><p className="text-white/40">Welcome to Backbenchers</p></div>
                        <button onClick={() => router.push('/dashboard')} className="w-full h-12 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl transition-colors">Explore deals</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {showPWAPrompt && <PWAInstallPrompt onComplete={() => setShowPWAPrompt(false)} />}
        </div>
    );
}
