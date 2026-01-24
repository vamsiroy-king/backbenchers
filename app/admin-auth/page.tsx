"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLoginPage() {
    const router = useRouter();
    const [secret, setSecret] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!secret) {
            toast.error("Please enter the admin secret");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/admin-login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ secret }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success("Access Granted. Subdomain confirmed.");
                router.push("/admin/dashboard");
                router.refresh();
            } else {
                toast.error(data.error || "Access Denied");
                setSecret(""); // Clear secret on failure
            }
        } catch (error) {
            toast.error("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black opacity-50 z-0" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md z-10"
            >
                <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <div className="flex flex-col items-center mb-8">
                        <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">
                            Admin Access
                        </h1>
                        <p className="text-zinc-500 text-sm mt-2 text-center">
                            Enter your secure credential to verify identity.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                            <Input
                                type="password"
                                placeholder="Admin Secret Key"
                                value={secret}
                                onChange={(e) => setSecret(e.target.value)}
                                className="pl-10 h-12 bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus:ring-white/20 focus:border-white/20 transition-all font-mono"
                                autoComplete="off"
                                autoFocus
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-medium text-base transition-all active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            ) : (
                                <div className="flex items-center gap-2">
                                    Verify Access <ArrowRight className="w-4 h-4" />
                                </div>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-zinc-700 font-mono">
                            SECURE CONNECTION • ENCRYPTED ENDPOINT
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
