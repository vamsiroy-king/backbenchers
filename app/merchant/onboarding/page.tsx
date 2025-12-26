"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authService } from "@/lib/services/auth.service";

// Merchant onboarding flow controller
// Checks auth state and routes appropriately:
// 1. Not logged in → Redirect to merchant signup (Google auth)
// 2. Already a merchant → Redirect to merchant dashboard
// 3. Logged in but not merchant → Proceed to business details form
export default function MerchantOnboardingPage() {
    const router = useRouter();
    const [status, setStatus] = useState("Checking account...");

    useEffect(() => {
        async function checkAuthAndRoute() {
            try {
                // Check if user is logged in
                const user = await authService.getCurrentUser();

                if (!user) {
                    // Not logged in - redirect to merchant signup
                    setStatus("Redirecting to sign up...");
                    router.replace("/merchant/auth/signup");
                    return;
                }

                // User is logged in - check if already a merchant
                if (user.role === 'merchant' && user.isComplete) {
                    // Already an approved merchant - go to dashboard
                    setStatus("Welcome back! Loading dashboard...");
                    router.replace("/merchant/dashboard");
                    return;
                }

                // User is logged in but not yet a merchant
                // Proceed to business details form (first onboarding step)
                setStatus("Starting registration...");
                router.replace("/merchant/onboarding/business");

            } catch (error) {
                console.error("Auth check error:", error);
                // On error, default to signup
                router.replace("/merchant/auth/signup");
            }
        }

        checkAuthAndRoute();
    }, [router]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">{status}</p>
            </div>
        </div>
    );
}

