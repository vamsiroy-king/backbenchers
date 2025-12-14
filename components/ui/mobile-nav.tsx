"use client";

import { Home, Map as MapIcon, User, Flame, Compass } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const TABS = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Explore", href: "/dashboard/explore", icon: Compass },
    { name: "Map", href: "/dashboard/map", icon: MapIcon },
    { name: "Drops", href: "/dashboard/drops", icon: Flame },
    { name: "Profile", href: "/dashboard/profile", icon: User },
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed md:absolute bottom-4 left-4 right-4 z-50"
        >
            {/* Floating Pill Container */}
            <div className="bg-white/80 backdrop-blur-xl rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 px-2 py-2">
                <div className="flex items-center justify-around">
                    {TABS.map((tab) => {
                        const isActive = pathname === tab.href;
                        const Icon = tab.icon;

                        return (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                className="flex-1"
                            >
                                <motion.div
                                    className="flex flex-col items-center justify-center py-1 relative"
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <motion.div
                                        animate={{
                                            scale: isActive ? 1.15 : 1,
                                            y: isActive ? -2 : 0
                                        }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                        className={`p-2.5 rounded-2xl transition-all duration-300 ${isActive
                                            ? "bg-primary text-white shadow-lg shadow-primary/30"
                                            : "text-gray-400 hover:text-gray-600"
                                            }`}
                                    >
                                        <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.8} />
                                    </motion.div>

                                    <motion.span
                                        initial={false}
                                        animate={{
                                            opacity: isActive ? 1 : 0.6,
                                            scale: isActive ? 1 : 0.95
                                        }}
                                        className={`text-[9px] mt-1 font-semibold ${isActive ? "text-primary" : "text-gray-400"
                                            }`}
                                    >
                                        {tab.name}
                                    </motion.span>

                                    {/* Active indicator dot */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeIndicator"
                                            className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full"
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Safe area padding for iPhone home indicator */}
            <div className="h-[env(safe-area-inset-bottom,0px)]" />
        </motion.div>
    );
}

