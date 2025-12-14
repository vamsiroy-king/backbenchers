"use client";

import { Shield, Bell, Palette, Database, HelpCircle, FileText, LogOut, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SETTINGS = [
    { icon: Shield, label: "Security Settings", description: "Password, 2FA" },
    { icon: Bell, label: "Notifications", description: "Email, push alerts" },
    { icon: Palette, label: "Appearance", description: "Theme, display" },
    { icon: Database, label: "Data Management", description: "Export, backup" },
    { icon: HelpCircle, label: "Help & Support", description: "FAQs, contact" },
    { icon: FileText, label: "Terms & Policies", description: "Legal docs" },
];

export default function AdminSettingsPage() {
    const router = useRouter();

    const handleLogout = () => {
        router.push("/");
    };

    return (
        <div className="min-h-screen bg-white pb-32 pt-12">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100">
                <div className="px-4 h-14 flex items-center">
                    <h1 className="font-extrabold text-xl">Settings</h1>
                </div>
            </header>

            <main className="px-4 pt-6 space-y-6">
                {/* Admin Profile */}
                <div className="bg-gray-900 rounded-2xl p-5 text-white">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-white/20 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">👤</span>
                        </div>
                        <div>
                            <h2 className="font-bold text-lg">Admin User</h2>
                            <p className="text-white/60 text-sm">admin@backbenchers.in</p>
                        </div>
                    </div>
                </div>

                {/* Settings List */}
                <div className="space-y-3">
                    {SETTINGS.map((setting, index) => (
                        <button
                            key={index}
                            className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-2xl text-left"
                        >
                            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                <setting.icon className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-sm">{setting.label}</p>
                                <p className="text-xs text-gray-500">{setting.description}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                        </button>
                    ))}
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-4 text-red-500 border border-red-200 rounded-2xl bg-red-50"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="font-semibold">Sign Out</span>
                </button>

                {/* App Switcher */}
                <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 text-center mb-3">Switch to</p>
                    <div className="flex justify-center gap-3">
                        <Link href="/dashboard" className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-semibold">
                            Student App
                        </Link>
                        <Link href="/merchant" className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-semibold">
                            Merchant App
                        </Link>
                    </div>
                </div>

                {/* Version */}
                <p className="text-center text-xs text-gray-400">
                    Backbenchers Admin v1.0.0
                </p>
            </main>
        </div>
    );
}
