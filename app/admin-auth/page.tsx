"use client";

import { useState } from "react";
import { Lock, Shield, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminAuthPage() {
    const router = useRouter();
    const [secret, setSecret] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!secret.trim()) {
            setError('Please enter the admin secret');
            setLoading(false);
            return;
        }

        // Redirect with secret in URL - middleware will validate and set cookie
        window.location.href = `/admin?secret=${encodeURIComponent(secret)}`;
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Security Badge */}
                <div className="flex justify-center mb-8">
                    <div className="bg-red-500/20 p-4 rounded-full">
                        <Shield className="h-12 w-12 text-red-400" />
                    </div>
                </div>

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Admin Access Required
                    </h1>
                    <p className="text-gray-400 text-sm">
                        This area is protected. Enter the admin secret to continue.
                    </p>
                </div>

                {/* Warning */}
                <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-xs">
                        Unauthorized access attempts are logged and may result in IP blocking.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">
                            Admin Secret
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                            <input
                                type="password"
                                value={secret}
                                onChange={(e) => setSecret(e.target.value)}
                                placeholder="Enter secret key..."
                                className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 px-12 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                                autoFocus
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Shield className="h-5 w-5" />
                                Authenticate
                            </>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-gray-600 text-xs text-center mt-8">
                    Backbenchers Admin Panel v1.0
                </p>
            </div>
        </div>
    );
}
