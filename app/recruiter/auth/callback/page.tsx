"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// After Google OAuth, redirect to recruiter flow
export default function RecruiterAuthCallback() {
    const router = useRouter();

    useEffect(() => {
        // The hash fragment is handled by Supabase auth client automatically.
        // Just redirect to the recruiter landing which will figure out next step.
        const timer = setTimeout(() => {
            router.replace("/recruiter");
        }, 1500);
        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-green-500 mx-auto mb-4" />
                <p className="text-white/50 text-sm">Verifying your account...</p>
            </div>
        </div>
    );
}
