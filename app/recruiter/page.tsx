"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authService } from "@/lib/services/auth.service";
import { recruiterService } from "@/lib/services/recruiter.service";

// Recruiter landing page — routes based on auth & profile status
export default function RecruiterPage() {
    const router = useRouter();
    const [status, setStatus] = useState("Checking account...");

    useEffect(() => {
        async function checkAuthAndRoute() {
            try {
                const user = await authService.getCurrentUser();

                if (!user) {
                    setStatus("Redirecting to sign up...");
                    router.replace("/recruiter/auth/signup");
                    return;
                }

                // Check if already a recruiter
                const res = await recruiterService.getMyProfile();
                if (res.success && res.data) {
                    if (res.data.status === 'verified') {
                        setStatus("Welcome back! Loading dashboard...");
                        router.replace("/recruiter/dashboard");
                    } else if (res.data.status === 'pending') {
                        setStatus("Your account is under review...");
                        router.replace("/recruiter/onboarding/pending");
                    } else if (res.data.status === 'rejected') {
                        setStatus("Redirecting...");
                        router.replace("/recruiter/onboarding/pending");
                    } else {
                        router.replace("/recruiter/dashboard");
                    }
                    return;
                }

                // Not a recruiter yet — start onboarding
                setStatus("Starting registration...");
                router.replace("/recruiter/onboarding/company");

            } catch (error) {
                console.error("Auth check error:", error);
                router.replace("/recruiter/auth/signup");
            }
        }

        checkAuthAndRoute();
    }, [router]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-green-500 mx-auto mb-4" />
                <p className="text-white/50 text-sm">{status}</p>
            </div>
        </div>
    );
}
