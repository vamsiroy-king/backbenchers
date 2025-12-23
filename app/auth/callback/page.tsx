"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// Create a fresh client to ensure we get the latest auth state
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
                // This can happen if Supabase redirects to default URL
                const authFlow = localStorage.getItem('auth_flow');
                if (authFlow === 'merchant') {
                    console.log('Detected merchant flow - redirecting to merchant callback');
                    localStorage.removeItem('auth_flow');
                    router.replace('/merchant/auth/callback');
                    return;
                }

                // Create fresh supabase client
                const supabase = createClient(supabaseUrl, supabaseAnonKey);

                // Wait for auth state to be ready
                setStatus("Authenticating...");
                addDebug("Starting auth callback...");

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
                        addDebug("No student record found - new user");
                        setStatus("Completing setup...");
                        router.replace("/verify");
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
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-gray-600 text-sm">{status}</p>
        </div>
    );
}
