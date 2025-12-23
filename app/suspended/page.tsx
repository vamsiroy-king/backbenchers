"use client";

import { Ban, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SuspendedPage() {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center max-w-md"
            >
                {/* Icon */}
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Ban className="h-10 w-10 text-red-500" />
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Account Suspended
                </h1>

                {/* Description */}
                <p className="text-gray-500 mb-8">
                    Your Backbenchers account has been suspended due to a violation of our terms of service.
                    If you believe this is a mistake, please contact our support team.
                </p>

                {/* Actions */}
                <div className="space-y-3">
                    <a
                        href="mailto:support@backbenchers.in?subject=Account%20Suspension%20Appeal"
                        className="flex items-center justify-center gap-2 w-full h-12 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
                    >
                        <Mail className="h-5 w-5" />
                        Contact Support
                    </a>

                    <Link href="/login">
                        <button className="flex items-center justify-center gap-2 w-full h-12 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                            Back to Login
                        </button>
                    </Link>
                </div>

                {/* Footer */}
                <p className="text-xs text-gray-400 mt-8">
                    Reference code: SUSPENDED_ACCOUNT
                </p>
            </motion.div>
        </div>
    );
}
