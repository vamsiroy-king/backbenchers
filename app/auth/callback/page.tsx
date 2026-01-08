"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
    const router = useRouter();
    const [status, setStatus] = useState("Signing you in...");

    useEffect(() => {
        async function handleCallback() {
            try {
                // Check if user was in merchant signup flow but landed on student callback
                const authFlow = localStorage.getItem('auth_flow');
                if (authFlow === 'merchant') {
                    console.log('Detected merchant flow - redirecting to merchant callback');
                    localStorage.removeItem('auth_flow');
                    router.replace('/merchant/auth/callback' + window.location.search);
                    return;
                }

                setStatus("Authenticating...");

                // Supabase will auto-detect and handle PKCE code exchange via detectSessionInUrl
                // Just wait for the session to become available
                let attempts = 0;
                let session = null;

                while (attempts < 20 && !session) {
                    const { data, error } = await supabase.auth.getSession();
                    if (error) {
                        console.error('Session error:', error.message);
                    }
                    session = data.session;
                    if (!session) {
                        await new Promise(resolve => setTimeout(resolve, 250));
                        attempts++;
                    }
                }

                if (!session) {
                    console.error("No session found after retries");
                    setStatus("Authentication failed. Please try again.");
                    setTimeout(() => router.replace("/signup"), 2000);
                    return;
                }

                console.log(`Session found! User ID: ${session.user.id}`);

                // IMPORTANT: Only allow @gmail.com accounts for student signup
                const userEmail = session.user.email?.toLowerCase() || '';
                if (!userEmail.endsWith('@gmail.com')) {
                    console.log(`Non-Gmail account detected: ${userEmail}`);
                    setStatus("Only Gmail accounts allowed");
                    await supabase.auth.signOut();
                    window.location.href = '/signup?error=gmail_only';
                    return;
                }

                // Check if user has a student record
                setStatus("Checking your account...");

                const { data: student, error: studentError } = await supabase
                    .from('students')
                    .select('id, status, bb_id, email')
                    .eq('user_id', session.user.id)
                    .maybeSingle();

                if (studentError) {
                    console.error('Student query error:', studentError.message);
                }

                if (student) {
                    console.log('Student found:', student.id);

                    if (student.status === 'suspended') {
                        setStatus("Account suspended");
                        await supabase.auth.signOut();
                        router.replace("/suspended");
                        return;
                    }

                    setStatus("Welcome back!");
                    router.replace("/dashboard");
                } else {
                    // Try matching by email
                    console.log("No student by user_id, trying email...");
                    const { data: studentByEmail } = await supabase
                        .from('students')
                        .select('id, status, user_id')
                        .eq('email', session.user.email?.toLowerCase())
                        .maybeSingle();

                    if (studentByEmail) {
                        console.log('Student found by email:', studentByEmail.id);

                        if (studentByEmail.status === 'suspended') {
                            setStatus("Account suspended");
                            await supabase.auth.signOut();
                            router.replace("/suspended");
                            return;
                        }

                        // Update user_id if needed
                        if (studentByEmail.user_id !== session.user.id) {
                            await supabase
                                .from('students')
                                .update({ user_id: session.user.id })
                                .eq('id', studentByEmail.id);
                        }

                        setStatus("Welcome back!");
                        router.replace("/dashboard");
                    } else {
                        // NEW USER - redirect to onboarding
                        console.log("New user - redirecting to onboarding");
                        setStatus("Setting up your account...");
                        window.location.href = "/verify";
                    }
                }
            } catch (error: any) {
                console.error("Auth callback error:", error);
                router.replace("/signup");
            }
        }

        handleCallback();
    }, [router]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
            {/* Logo */}
            <div className="mb-6 animate-pulse">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
                    <span className="text-white font-bold text-2xl">B</span>
                </div>
            </div>

            {/* Loading dots */}
            <div className="flex gap-1.5 mb-4">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-green-500 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                    />
                ))}
            </div>

            <p className="text-white/50 text-sm font-medium">{status}</p>
        </div>
    );
}
