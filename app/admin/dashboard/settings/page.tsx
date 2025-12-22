"use client";

import { Shield, Bell, Palette, Database, HelpCircle, FileText, LogOut, ChevronRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const SETTINGS = [
    { icon: Shield, label: "Security Settings", description: "Password, 2FA" },
    { icon: Bell, label: "Notifications", description: "Email, push alerts" },
    { icon: Palette, label: "Appearance", description: "Theme, display" },
    { icon: Database, label: "Data Management", description: "Export, backup" },
    { icon: HelpCircle, label: "Help & Support", description: "FAQs, contact" },
    { icon: FileText, label: "Terms & Policies", description: "Legal docs" },
];

// Content visibility toggles
interface ContentSettings {
    showTopBrands: boolean;
    showHeroBanners: boolean;
    showTrending: boolean;
}

export default function AdminSettingsPage() {
    const router = useRouter();

    const [contentSettings, setContentSettings] = useState<ContentSettings>({
        showTopBrands: true,
        showHeroBanners: true,
        showTrending: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Load settings from localStorage (can be replaced with Supabase later)
    useEffect(() => {
        const saved = localStorage.getItem('contentSettings');
        if (saved) {
            setContentSettings(JSON.parse(saved));
        }
        setLoading(false);
    }, []);

    // Save settings
    const toggleSetting = async (key: keyof ContentSettings) => {
        setSaving(true);
        const newSettings = {
            ...contentSettings,
            [key]: !contentSettings[key]
        };
        setContentSettings(newSettings);
        localStorage.setItem('contentSettings', JSON.stringify(newSettings));

        // Simulate save delay
        await new Promise(resolve => setTimeout(resolve, 300));
        setSaving(false);
    };

    const handleLogout = () => {
        router.push("/");
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32 pt-12">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-100/80">
                <div className="px-5 h-16 flex items-center">
                    <h1 className="font-bold text-xl text-gray-900">Settings</h1>
                </div>
            </header>

            <main className="px-5 pt-8 space-y-8">
                {/* Admin Profile */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white shadow-elevated">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                            <span className="text-2xl">👤</span>
                        </div>
                        <div>
                            <h2 className="font-semibold text-lg">Admin User</h2>
                            <p className="text-white/50 text-sm">admin@backbenchers.in</p>
                        </div>
                    </div>
                </div>

                {/* Content Visibility - NEW SECTION */}
                <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Content Visibility</h3>
                    <div className="bg-white rounded-xl shadow-card border border-gray-100/50 divide-y divide-gray-100">
                        {[
                            { key: 'showTopBrands' as const, label: 'Top Brands Section', desc: 'Show/hide in student app' },
                            { key: 'showHeroBanners' as const, label: 'Hero Banners', desc: 'Promotional banners on home' },
                            { key: 'showTrending' as const, label: 'Trending Offers', desc: 'Trending section visibility' },
                        ].map((item) => (
                            <button
                                key={item.key}
                                onClick={() => toggleSetting(item.key)}
                                disabled={saving}
                                className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50/50 transition-colors disabled:opacity-50"
                            >
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${contentSettings[item.key] ? 'bg-primary/10' : 'bg-gray-100'}`}>
                                    {contentSettings[item.key] ? (
                                        <Eye className="h-5 w-5 text-primary" />
                                    ) : (
                                        <EyeOff className="h-5 w-5 text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-sm text-gray-900">{item.label}</p>
                                    <p className="text-xs text-gray-500">{item.desc}</p>
                                </div>
                                <div className={`relative w-11 h-6 rounded-full transition-colors ${contentSettings[item.key] ? 'bg-primary' : 'bg-gray-300'}`}>
                                    <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${contentSettings[item.key] ? 'left-5.5 right-0.5' : 'left-0.5'}`}
                                        style={{ left: contentSettings[item.key] ? 'calc(100% - 22px)' : '2px' }} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Settings List */}
                <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">General Settings</h3>
                    <div className="bg-white rounded-xl shadow-card border border-gray-100/50 divide-y divide-gray-100">
                        {SETTINGS.map((setting, index) => (
                            <button
                                key={index}
                                className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50/50 transition-colors"
                            >
                                <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center">
                                    <setting.icon className="h-5 w-5 text-gray-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-sm text-gray-900">{setting.label}</p>
                                    <p className="text-xs text-gray-500">{setting.description}</p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-300" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-4 text-red-500 border border-red-100 rounded-xl bg-red-50/50 hover:bg-red-50 transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="font-semibold">Sign Out</span>
                </button>

                {/* App Switcher */}
                <div className="pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-400 text-center mb-3">Switch to</p>
                    <div className="flex justify-center gap-2.5">
                        <Link href="/dashboard" className="px-4 py-2.5 bg-white rounded-xl text-xs font-medium text-gray-600 border border-gray-100 shadow-subtle">
                            Student App
                        </Link>
                        <Link href="/merchant" className="px-4 py-2.5 bg-white rounded-xl text-xs font-medium text-gray-600 border border-gray-100 shadow-subtle">
                            Merchant App
                        </Link>
                    </div>
                </div>

                {/* Version */}
                <p className="text-center text-xs text-gray-400 pb-4">
                    Backbenchers Admin v1.0.0
                </p>
            </main>
        </div>
    );
}
