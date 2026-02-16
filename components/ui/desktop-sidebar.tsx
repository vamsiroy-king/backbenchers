"use client";

import { Home, User, Briefcase, Compass, Map, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";

const TABS = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Explore", href: "/dashboard/explore", icon: Compass },
    { name: "Map", href: "/dashboard/map", icon: Map },
    { name: "Hustle", href: "/dashboard/hustle", icon: Briefcase },
    { name: "Profile", href: "/dashboard/profile", icon: User },
];

export function DesktopSidebar() {
    const pathname = usePathname();
    const { theme } = useTheme();
    const isLight = theme === 'light';

    return (
        <div className={`hidden md:flex flex-col w-[240px] h-screen sticky top-0 border-r transition-colors duration-300 ${isLight ? 'bg-white border-gray-200' : 'bg-black border-white/[0.08]'
            }`}>
            {/* Logo Area */}
            <div className="p-6 mb-2">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                        <span className="text-black font-bold text-xl italic tracking-tighter">B</span>
                    </div>
                    <div>
                        <h1 className={`font-bold text-lg italic tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>BackBenchers</h1>
                        <p className="text-[10px] bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-green-600 font-bold tracking-wider">STUDENT DISCOUNTS</p>
                    </div>
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                {TABS.map((tab) => {
                    const isActive = pathname === tab.href;
                    const Icon = tab.icon;

                    return (
                        <Link key={tab.name} href={tab.href} prefetch={true} className="block group">
                            <div className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 ${isActive
                                ? isLight ? 'bg-gray-100' : 'bg-white/[0.08]'
                                : 'hover:bg-white/[0.04]'
                                }`}>
                                <Icon
                                    className={`h-6 w-6 transition-colors ${isActive
                                        ? 'text-green-500' // Always green when active
                                        : isLight ? 'text-gray-500 group-hover:text-gray-900' : 'text-white/40 group-hover:text-white'
                                        }`}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                <span className={`font-medium text-sm transition-colors ${isActive
                                    ? isLight ? 'text-gray-900 font-bold' : 'text-white font-bold'
                                    : isLight ? 'text-gray-500 group-hover:text-gray-900' : 'text-white/60 group-hover:text-white'
                                    }`}>
                                    {tab.name}
                                </span>

                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabIndicatorDesktop"
                                        className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500"
                                    />
                                )}
                            </div>
                        </Link>
                    )
                })}
            </nav>

            {/* Footer / Account */}
            <div className={`p-4 border-t ${isLight ? 'border-gray-200' : 'border-white/[0.08]'}`}>
                <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${isLight ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/[0.05] text-white/50'
                    }`}>
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium text-sm">Sign Out</span>
                </button>
            </div>
        </div>
    );
}
