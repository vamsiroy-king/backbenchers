"use client";

import { Shield, Bell, Palette, Database, HelpCircle, FileText, LogOut, ChevronRight, Eye, EyeOff, Moon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { settingsService, ContentSettings } from "@/lib/services/settings.service";

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
    const [isDarkMode, setIsDarkMode] = useState(false);

    const [contentSettings, setContentSettings] = useState<ContentSettings>({
        showTopBrands: true,
        showHeroBanners: true,
        showTrending: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Load settings from DATABASE (not localStorage!)
    useEffect(() => {
        async function loadSettings() {
            try {
                const settings = await settingsService.getContentSettings();
                setContentSettings(settings);
            } catch (error) {
                console.error("Error loading settings:", error);
            } finally {
                setLoading(false);
            }
            // Check dark mode state
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
        loadSettings();
    }, []);

    // Toggle dark mode
    const toggleDarkMode = () => {
        const html = document.documentElement;
        const newDark = !isDarkMode;
        if (newDark) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
        localStorage.setItem('admin_theme', newDark ? 'dark' : 'light');
        setIsDarkMode(newDark);
    };

    // Save settings to DATABASE
    const toggleSetting = async (key: keyof ContentSettings) => {
        if (saving) return; // Prevent double-click

        setSaving(true);
        const oldSettings = { ...contentSettings };
        const newSettings = {
            ...contentSettings,
            [key]: !contentSettings[key]
        };

        console.log('Toggling setting:', key, 'from', oldSettings[key], 'to', newSettings[key]);

        // Optimistic update
        setContentSettings(newSettings);

        // Save to database for realtime sync!
        try {
            const result = await settingsService.updateContentSettings(newSettings);
            console.log('Save result:', result);

            if (!result.success) {
                console.error("Failed to save settings:", result.error);
                // Revert on failure
                setContentSettings(oldSettings);
                alert('Failed to save: ' + result.error);
            } else {
                console.log('Settings saved successfully!');
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            setContentSettings(oldSettings);
        }

        setSaving(false);
    };

    const handleLogout = () => {
        router.push("/");
    };

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 pb-32 pt-12">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100/80 dark:border-gray-800">
                <div className="px-5 h-16 flex items-center">
                    <h1 className="font-bold text-xl text-gray-900 dark:text-white">Settings</h1>
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

                {/* Dark Mode Toggle */}
                <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Appearance</h3>
                    <button
                        onClick={toggleDarkMode}
                        className="w-full flex items-center gap-4 p-4 bg-gray-900 dark:bg-gray-800 rounded-xl"
                    >
                        <div className="h-10 w-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                            <Moon className="h-5 w-5 text-yellow-500" />
                        </div>
                        <span className="flex-1 font-semibold text-white text-left">Dark Mode</span>
                        <div className={`relative w-12 h-7 rounded-full transition-colors ${isDarkMode ? 'bg-primary' : 'bg-gray-600'}`}>
                            <div
                                className="absolute top-1 h-5 w-5 bg-white rounded-full transition-all shadow-sm"
                                style={{ left: isDarkMode ? 'calc(100% - 22px)' : '2px' }}
                            />
                        </div>
                    </button>
                </div>

                {/* Content Visibility - NEW SECTION */}
                <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Content Visibility</h3>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-card border border-gray-100/50 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                        {[
                            { key: 'showTopBrands' as const, label: 'Top Brands Section', desc: 'Show/hide in student app' },
                            { key: 'showHeroBanners' as const, label: 'Hero Banners', desc: 'Promotional banners on home' },
                            { key: 'showTrending' as const, label: 'Trending Offers', desc: 'Trending section visibility' },
                        ].map((item) => (
                            <button
                                key={item.key}
                                onClick={() => toggleSetting(item.key)}
                                disabled={saving}
                                className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50"
                            >
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${contentSettings[item.key] ? 'bg-primary/10' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                    {contentSettings[item.key] ? (
                                        <Eye className="h-5 w-5 text-primary" />
                                    ) : (
                                        <EyeOff className="h-5 w-5 text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-sm text-gray-900 dark:text-white">{item.label}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                                </div>
                                <div className={`relative w-11 h-6 rounded-full transition-colors ${contentSettings[item.key] ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}>
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
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-card border border-gray-100/50 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                        {SETTINGS.map((setting, index) => (
                            <button
                                key={index}
                                className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <div className="h-10 w-10 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                                    <setting.icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-sm text-gray-900 dark:text-white">{setting.label}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{setting.description}</p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-500" />
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
