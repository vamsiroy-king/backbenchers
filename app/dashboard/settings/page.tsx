"use client";

import { ArrowLeft, User, Bell, Shield, HelpCircle, Info, LogOut, Moon, Sun, ChevronRight, Smartphone, Lock, FileText, MessageCircle, Star, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { authService } from "@/lib/services/auth.service";

interface SettingsItemProps {
    icon: React.ReactNode;
    label: string;
    description?: string;
    onClick?: () => void;
    rightElement?: React.ReactNode;
    danger?: boolean;
}

function SettingsItem({ icon, label, description, onClick, rightElement, danger }: SettingsItemProps) {
    return (
        <motion.button
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.05 }}
            onClick={onClick}
            className={`w-full flex items-center gap-4 p-4 bg-[#111] rounded-xl border border-[#222] ${danger ? 'hover:bg-red-500/10' : 'hover:bg-[#1a1a1a]'} transition-colors`}
        >
            <div className={`h-10 w-10 rounded-xl ${danger ? 'bg-red-500/20' : 'bg-white/5'} flex items-center justify-center`}>
                <span className={danger ? 'text-red-400' : 'text-white/60'}>{icon}</span>
            </div>
            <div className="flex-1 text-left">
                <p className={`text-sm font-medium ${danger ? 'text-red-400' : 'text-white'}`}>{label}</p>
                {description && <p className="text-xs text-white/40 mt-0.5">{description}</p>}
            </div>
            {rightElement || <ChevronRight className="h-4 w-4 text-white/30" />}
        </motion.button>
    );
}

export default function SettingsPage() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        setLoggingOut(true);
        await authService.logout();
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-black pb-24">
            {/* Header */}
            <header className="sticky top-0 z-50 px-4 py-4 bg-black/80 backdrop-blur-xl border-b border-white/[0.05]">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="h-10 w-10 bg-[#111] border border-[#222] rounded-xl flex items-center justify-center text-white hover:bg-[#1a1a1a] transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-xl font-bold text-white">Settings</h1>
                </div>
            </header>

            <main className="px-4 pt-6 space-y-6">
                {/* Account Section */}
                <section>
                    <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-1">Account</h2>
                    <div className="space-y-2">
                        <SettingsItem
                            icon={<User className="h-5 w-5" />}
                            label="Edit Profile"
                            description="Name, photo, college details"
                            onClick={() => router.push('/dashboard/profile/edit')}
                        />
                        <SettingsItem
                            icon={<Lock className="h-5 w-5" />}
                            label="Privacy & Security"
                            description="Password, 2FA, data"
                        />
                    </div>
                </section>

                {/* Preferences Section */}
                <section>
                    <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-1">Preferences</h2>
                    <div className="space-y-2">
                        <SettingsItem
                            icon={<Bell className="h-5 w-5" />}
                            label="Notifications"
                            description="Push, email, SMS preferences"
                        />
                        <SettingsItem
                            icon={theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                            label="Appearance"
                            description={theme === 'dark' ? 'Dark mode' : 'Light mode'}
                            onClick={toggleTheme}
                            rightElement={
                                <div className={`relative h-6 w-11 rounded-full transition-colors ${theme === 'dark' ? 'bg-green-500' : 'bg-gray-300'}`}>
                                    <motion.div
                                        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md"
                                        animate={{ left: theme === 'dark' ? '1.375rem' : '0.125rem' }}
                                        transition={{ duration: 0.2 }}
                                    />
                                </div>
                            }
                        />
                    </div>
                </section>

                {/* Support Section */}
                <section>
                    <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-1">Support</h2>
                    <div className="space-y-2">
                        <SettingsItem
                            icon={<HelpCircle className="h-5 w-5" />}
                            label="Help Center"
                            description="FAQs, tutorials, guides"
                        />
                        <SettingsItem
                            icon={<MessageCircle className="h-5 w-5" />}
                            label="Contact Support"
                            description="Chat with our team"
                        />
                        <SettingsItem
                            icon={<Star className="h-5 w-5" />}
                            label="Rate Backbenchers"
                            description="Love us? Leave a review!"
                        />
                    </div>
                </section>

                {/* Legal Section */}
                <section>
                    <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-1">Legal</h2>
                    <div className="space-y-2">
                        <SettingsItem
                            icon={<FileText className="h-5 w-5" />}
                            label="Terms of Service"
                        />
                        <SettingsItem
                            icon={<Shield className="h-5 w-5" />}
                            label="Privacy Policy"
                        />
                    </div>
                </section>

                {/* App Info */}
                <section>
                    <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-1">About</h2>
                    <div className="space-y-2">
                        <SettingsItem
                            icon={<Info className="h-5 w-5" />}
                            label="App Version"
                            description="v1.0.0"
                            rightElement={<span className="text-xs text-green-400">Latest</span>}
                        />
                    </div>
                </section>

                {/* Logout */}
                <section className="pt-4">
                    <SettingsItem
                        icon={<LogOut className="h-5 w-5" />}
                        label={loggingOut ? "Logging out..." : "Log Out"}
                        danger
                        onClick={handleLogout}
                        rightElement={loggingOut ? <div className="h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : undefined}
                    />
                </section>

                {/* Footer */}
                <div className="pt-6 pb-8 text-center">
                    <p className="text-xs text-white/20">Made with ❤️ for students</p>
                    <p className="text-[10px] text-white/10 mt-1">backbenchers.in</p>
                </div>
            </main>
        </div>
    );
}
