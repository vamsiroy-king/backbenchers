"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Bell, Sparkles, Users, Store, Smartphone, CheckCircle, ArrowRight } from "lucide-react";

export default function ComingSoonPage() {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setError("");

        try {
            const response = await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, source: 'coming_soon' }),
            });

            const data = await response.json();

            if (data.success) {
                setSubmitted(true);
            } else {
                setError(data.error || 'Something went wrong');
            }
        } catch (err) {
            setError('Failed to join waitlist. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/2 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-500" />
            </div>

            {/* Content */}
            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Header */}
                <header className="p-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center font-bold text-lg">
                            B
                        </div>
                        <span className="font-bold text-xl">Backbenchers</span>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 flex items-center justify-center px-6 py-12">
                    <div className="max-w-2xl mx-auto text-center">
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-4 py-2 mb-8"
                        >
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-primary">Coming Soon</span>
                        </motion.div>

                        {/* Heading */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-6xl font-bold mb-6"
                        >
                            Student Discounts,{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                                Reimagined
                            </span>
                        </motion.h1>

                        {/* Subheading */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg md:text-xl text-gray-400 mb-12 max-w-xl mx-auto"
                        >
                            India's first verified student discount platform.
                            Exclusive deals from your favorite brands and local stores.
                        </motion.p>

                        {/* Features */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="grid grid-cols-3 gap-4 mb-12"
                        >
                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                                <Store className="h-8 w-8 text-primary mx-auto mb-2" />
                                <p className="text-sm text-gray-400">Local Stores</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                                <Smartphone className="h-8 w-8 text-primary mx-auto mb-2" />
                                <p className="text-sm text-gray-400">Online Brands</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                                <p className="text-sm text-gray-400">Verified Students</p>
                            </div>
                        </motion.div>

                        {/* Email Form */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            {!submitted ? (
                                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                                    <div className="flex-1 relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                        <input
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full h-14 pl-12 pr-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-gray-500 outline-none focus:border-primary transition-colors"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="h-14 px-6 bg-primary hover:bg-primary/90 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Join Waitlist
                                                <ArrowRight className="h-5 w-5" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            ) : (
                                <div className="flex items-center justify-center gap-3 bg-primary/20 border border-primary/30 rounded-xl p-4 max-w-md mx-auto">
                                    <CheckCircle className="h-6 w-6 text-primary" />
                                    <span className="font-medium">You're on the list! We'll notify you at launch.</span>
                                </div>
                            )}

                            <p className="text-sm text-gray-500 mt-4">
                                🔒 We respect your privacy. No spam, ever.
                            </p>
                        </motion.div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="p-6 text-center">
                    <p className="text-sm text-gray-500">
                        © 2024 Backbenchers. Made with 💚 for students.
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-3">
                        <a href="https://instagram.com/backbenchersapp" target="_blank" className="text-gray-500 hover:text-white transition-colors text-sm">
                            Instagram
                        </a>
                        <span className="text-gray-700">•</span>
                        <a href="https://linkedin.com/company/backbenchersapp" target="_blank" className="text-gray-500 hover:text-white transition-colors text-sm">
                            LinkedIn
                        </a>
                        <span className="text-gray-700">•</span>
                        <a href="mailto:hello@backbenchers.app" className="text-gray-500 hover:text-white transition-colors text-sm">
                            Contact
                        </a>
                    </div>
                </footer>
            </div>
        </div>
    );
}
