"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function MerchantAuthCallbackPage() {
    const router = useRouter();
    const [status, setStatus] = useState("Signing you in...");

    useEffect(() => {
        // Clean up flow marker
        localStorage.removeItem('auth_flow');

        // Listen for auth state changes - Supabase will automatically handle PKCE
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth state change:", event, session?.user?.email);

            if (event === 'SIGNED_IN' && session) {
                setStatus("Checking your account...");

                const userEmail = session.user.email?.toLowerCase() || "";
                console.log("Merchant auth callback - User email:", userEmail);

                // Check if merchant exists by user_id
                let { data: merchant } = await supabase
                    .from('merchants')
                    .select('id, status, bbm_id')
                    .eq('user_id', session.user.id)
                    .maybeSingle();

                // If not found by user_id, try by email
                if (!merchant && userEmail) {
                    const { data: merchantByEmail } = await supabase
                        .from('merchants')
                        .select('id, status, bbm_id, user_id')
                        .eq('email', userEmail)
                        .maybeSingle();

                    if (merchantByEmail) {
                        // Update user_id to match current auth
                        if (merchantByEmail.user_id !== session.user.id) {
                            await supabase
                                .from('merchants')
                                .update({ user_id: session.user.id })
                                .eq('id', merchantByEmail.id);
                        }
                        merchant = merchantByEmail;
                    }
                }

                if (merchant) {
                    console.log("Merchant found:", merchant);

                    // Check merchant status
                    if (merchant.status === 'approved') {
                        setStatus("Welcome back! Loading dashboard...");
                        router.replace("/merchant/dashboard");
                    } else if (merchant.status === 'pending') {
                        setStatus("Your application is pending review...");
                        router.replace("/merchant/onboarding/pending");
                    } else if (merchant.status === 'rejected') {
                        setStatus("Redirecting...");
                        router.replace("/merchant/auth/rejected");
                    } else {
                        // Continue onboarding
                        router.replace("/merchant/onboarding/pending");
                    }
                } else {
                    // New merchant - start onboarding
                    console.log("New merchant - starting onboarding");
                    setStatus("Setting up your account...");
                    router.replace("/merchant/onboarding/business");
                }
            }
        });

        // Also check for existing session on mount
        const checkExistingSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // Trigger the auth state change handler manually
                supabase.auth.onAuthStateChange(() => { });
            }
        };

        // Give Supabase time to process the URL params
        setTimeout(checkExistingSession, 500);

        return () => {
            subscription.unsubscribe();
        };
    }, [router]);

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-gray-600 text-sm">{status}</p>
        </div>
    );
}
