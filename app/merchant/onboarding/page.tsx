"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// Merchant onboarding index page - redirects to first step
export default function MerchantOnboardingPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the first onboarding step (business details)
        router.replace("/merchant/onboarding/business");
    }, [router]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Loading registration...</p>
            </div>
        </div>
    );
}
