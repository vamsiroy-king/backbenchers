"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, XCircle, ArrowRight, Loader2 } from "lucide-react";
import { recruiterService, Recruiter } from "@/lib/services/recruiter.service";

export default function RecruiterPendingPage() {
    const router = useRouter();
    const [recruiter, setRecruiter] = useState<Recruiter | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const check = async () => {
            const res = await recruiterService.getMyProfile();
            if (res.success && res.data) {
                setRecruiter(res.data);
                if (res.data.status === 'verified') {
                    router.replace('/recruiter/dashboard');
                    return;
                }
            }
            setLoading(false);
        };
        check();
        // Poll every 30 seconds
        const interval = setInterval(check, 30000);
        return () => clearInterval(interval);
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-green-500" />
            </div>
        );
    }

    const isRejected = recruiter?.status === 'rejected';

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center max-w-md"
            >
                <div className={`h-20 w-20 rounded-3xl mx-auto mb-6 flex items-center justify-center ${isRejected ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                    {isRejected ? (
                        <XCircle className="h-10 w-10 text-red-400" />
                    ) : (
                        <Clock className="h-10 w-10 text-amber-400" />
                    )}
                </div>

                <h1 className="text-white text-2xl font-bold mb-2">
                    {isRejected ? 'Application Rejected' : 'Under Review'}
                </h1>

                <p className="text-white/40 text-sm mb-6">
                    {isRejected
                        ? 'Unfortunately, your application was not approved.'
                        : 'Our team is reviewing your company details. This usually takes less than 24 hours.'
                    }
                </p>

                {isRejected && recruiter?.rejected_reason && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6 text-left">
                        <p className="text-red-400 text-xs font-semibold mb-1">Reason</p>
                        <p className="text-white/60 text-sm">{recruiter.rejected_reason}</p>
                    </div>
                )}

                {!isRejected && (
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 mb-6 text-left space-y-3">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-white/70 text-sm font-medium">Application Submitted</p>
                                <p className="text-white/30 text-xs">Your details have been received</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Clock className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-white/70 text-sm font-medium">Admin Verification</p>
                                <p className="text-white/30 text-xs">We're checking your company details</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 opacity-40">
                            <CheckCircle2 className="h-4 w-4 text-white/20 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-white/70 text-sm font-medium">Dashboard Access</p>
                                <p className="text-white/30 text-xs">Post opportunities & find students</p>
                            </div>
                        </div>
                    </div>
                )}

                <p className="text-white/20 text-[10px]">
                    BBR ID: {recruiter?.bbr_id || '—'} · This page auto-refreshes
                </p>
            </motion.div>
        </div>
    );
}
