"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    LayoutDashboard, PlusCircle, ListChecks, Users, User,
    ChevronLeft, ChevronRight, LogOut, Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

const MENU_ITEMS = [
    { name: "Dashboard", href: "/recruiter/dashboard", icon: LayoutDashboard },
    { name: "Post Opportunity", href: "/recruiter/dashboard/post", icon: PlusCircle },
    { name: "My Listings", href: "/recruiter/dashboard/listings", icon: ListChecks },
    { name: "Applicants", href: "/recruiter/dashboard/applicants", icon: Users },
    { name: "Profile", href: "/recruiter/dashboard/profile", icon: User },
];

export default function RecruiterDashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.replace('/recruiter/auth/signup');
    };

    return (
        <div className="flex min-h-screen bg-black">
            {/* Sidebar — Desktop */}
            <motion.aside
                initial={false}
                animate={{ width: collapsed ? 80 : 260 }}
                transition={{ duration: 0.3 }}
                className="hidden md:flex flex-col h-screen sticky top-0 border-r border-white/[0.06]"
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.06]">
                    {!collapsed && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                                <Briefcase className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="font-bold text-sm text-white">BackBenchers</h1>
                                <p className="text-[10px] text-green-400 font-semibold">BUSINESS</p>
                            </div>
                        </motion.div>
                    )}
                    {collapsed && (
                        <div className="h-10 w-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mx-auto">
                            <Briefcase className="h-5 w-5 text-white" />
                        </div>
                    )}
                </div>

                {/* Nav Links */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {MENU_ITEMS.map(item => {
                        const isActive = pathname === item.href ||
                            (item.href !== "/recruiter/dashboard" && pathname.startsWith(item.href));
                        const Icon = item.icon;

                        return (
                            <Link key={item.name} href={item.href}>
                                <motion.div
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer",
                                        isActive
                                            ? "bg-green-500 text-white shadow-lg shadow-green-500/25"
                                            : "text-white/40 hover:text-white hover:bg-white/[0.04]"
                                    )}
                                >
                                    <Icon className={cn("h-5 w-5 flex-shrink-0", collapsed && "mx-auto")} />
                                    {!collapsed && (
                                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-medium">
                                            {item.name}
                                        </motion.span>
                                    )}
                                </motion.div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-white/[0.06] space-y-1">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-white/30 hover:text-white hover:bg-white/[0.04] rounded-xl transition-all"
                    >
                        {collapsed ? <ChevronRight className="h-5 w-5" /> : <><ChevronLeft className="h-5 w-5" /><span className="text-sm">Collapse</span></>}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-red-400/50 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                        <LogOut className="h-5 w-5" />
                        {!collapsed && <span className="text-sm">Sign Out</span>}
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <div className="flex-1">
                {/* Mobile Header */}
                <div className="md:hidden sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/[0.06]">
                    <div className="flex items-center justify-between px-5 h-14">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                                <Briefcase className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-bold text-sm text-white">BackBenchers Business</span>
                        </div>
                    </div>
                    {/* Mobile Nav */}
                    <div className="flex overflow-x-auto hide-scrollbar gap-1 px-4 pb-3">
                        {MENU_ITEMS.map(item => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link key={item.name} href={item.href}
                                    className={cn(
                                        "flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all",
                                        isActive
                                            ? "bg-green-500 text-white"
                                            : "bg-white/[0.04] text-white/40"
                                    )}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
