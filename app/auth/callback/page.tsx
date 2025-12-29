"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
    const router = useRouter();
    const [status, setStatus] = useState("Signing you in...");
    const [debugInfo, setDebugInfo] = useState<string[]>([]);

    const addDebug = (msg: string) => {
        console.log(msg);
        setDebugInfo(prev => [...prev, msg]);
    };

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
                addDebug("Starting auth callback...");

                // Check for code parameter (PKCE flow)
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get('code');

                if (code) {
                    addDebug(`Found auth code, exchanging for session...`);
                    // Use the shared Supabase client which has the code verifier
                    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error) {
                        addDebug(`Code exchange error: ${error.message}`);
                        // Don't redirect on error, just continue to try getting session
                        console.error('Code exchange failed:', error);
                    } else {
                        addDebug(`Code exchange successful!`);
                    }
                }

                // Get session with retries
                let attempts = 0;
                let session = null;

                while (attempts < 15 && !session) {
                    const { data, error } = await supabase.auth.getSession();
                    if (error) {
                        addDebug(`Session error: ${error.message}`);
                    }
                    session = data.session;
                    if (!session) {
                        await new Promise(resolve => setTimeout(resolve, 300));
                        attempts++;
                        addDebug(`Waiting for session... attempt ${attempts}`);
                    }
                }

                if (!session) {
                    addDebug("No session found after retries");
                    router.replace("/login");
                    return;
                }

                addDebug(`Session found! User ID: ${session.user.id}`);
                addDebug(`User email: ${session.user.email}`);

                // Now check if user has a student record
                setStatus("Checking your account...");

                const { data: student, error: studentError } = await supabase
                    .from('students')
                    .select('id, status, bb_id, email')
                    .eq('user_id', session.user.id)
                    .maybeSingle();

                if (studentError) {
                    addDebug(`Student query error: ${studentError.message}`);
                }

                if (student) {
                    addDebug(`Student found: ${JSON.stringify(student)}`);

                    // Check if student is suspended
                    if (student.status === 'suspended') {
                        addDebug("Student account is SUSPENDED - blocking login");
                        setStatus("Account suspended");
                        // Sign out the user
                        await supabase.auth.signOut();
                        router.replace("/suspended");
                        return;
                    }

                    setStatus("Welcome back! Loading dashboard...");
                    router.replace("/dashboard");
                } else {
                    // Also try matching by email
                    addDebug("No student by user_id, trying email...");
                    const { data: studentByEmail, error: emailError } = await supabase
                        .from('students')
                        .select('id, status, bb_id, email, user_id')
                        .eq('email', session.user.email?.toLowerCase())
                        .maybeSingle();

                    if (emailError) {
                        addDebug(`Email query error: ${emailError.message}`);
                    }

                    if (studentByEmail) {
                        addDebug(`Student found by email: ${JSON.stringify(studentByEmail)}`);

                        // Check if student is suspended
                        if (studentByEmail.status === 'suspended') {
                            addDebug("Student account is SUSPENDED - blocking login");
                            setStatus("Account suspended");
                            await supabase.auth.signOut();
                            router.replace("/suspended");
                            return;
                        }

                        // If student exists but user_id doesn't match, update it
                        if (studentByEmail.user_id !== session.user.id) {
                            addDebug("Updating student user_id to match auth user");
                            await supabase
                                .from('students')
                                .update({ user_id: session.user.id })
                                .eq('id', studentByEmail.id);
                        }

                        setStatus("Welcome back! Loading dashboard...");
                        router.replace("/dashboard");
                    } else {
                        addDebug("No student record found - new user, redirecting to /verify");
                        setStatus("Completing setup...");
                        // Use window.location for more reliable redirect
                        window.location.href = "/verify";
                    }
                }
            } catch (error: any) {
                addDebug(`Error: ${error.message}`);
                console.error("Auth callback error:", error);
                router.replace("/login");
            }
        }

        handleCallback();
    }, [router]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
            {/* Branded Logo */}
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

            {/* Debug Info - Visible for troubleshooting */}
            {debugInfo.length > 0 && (
                <div className="mt-6 bg-gray-900 rounded-lg p-4 max-w-md w-full border border-gray-700">
                    <p className="text-xs text-gray-500 mb-2">Debug Log:</p>
                    <div className="text-xs text-green-400 font-mono space-y-1 max-h-40 overflow-y-auto">
                        {debugInfo.map((d, i) => <p key={i}>{d}</p>)}
                    </div>
                </div>
            )}
        </div>
    );
}
