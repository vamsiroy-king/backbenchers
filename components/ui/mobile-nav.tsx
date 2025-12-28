"use client";

import { Home, User, Flame, Compass, Map } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const TABS = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Explore", href: "/dashboard/explore", icon: Compass },
    { name: "Map", href: "/dashboard/map", icon: Map },
    { name: "Drops", href: "/dashboard/drops", icon: Flame },
    { name: "Profile", href: "/dashboard/profile", icon: User },
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50"
            style={{ transform: 'translateZ(0)', willChange: 'transform' }}
        >
            {/* Whop-style glass effect nav bar */}
            <div className="bg-[#0a0a0b]/90 backdrop-blur-2xl border-t border-white/[0.06] px-2 pt-2 pb-[max(env(safe-area-inset-bottom),8px)]">
                <div className="flex items-center justify-around max-w-md mx-auto">
                    {TABS.map((tab) => {
                        const isActive = pathname === tab.href;
                        const Icon = tab.icon;

                        return (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                prefetch={true}
                                className="flex-1"
                            >
                                <div
                                    className="flex flex-col items-center justify-center py-2 relative"
                                    style={{ transform: 'translateZ(0)' }}
                                >
                                    <div
                                        className={`p-2 rounded-xl transition-all duration-150 ${isActive ? 'bg-green-500 shadow-lg shadow-green-500/25' : 'bg-transparent'}`}
                                    >
                                        <Icon
                                            className={`h-5 w-5 transition-colors duration-150 ${isActive ? 'text-white' : 'text-white/40'}`}
                                            strokeWidth={isActive ? 2.5 : 1.8}
                                        />
                                    </div>

                                    <span
                                        className={`text-[10px] mt-0.5 font-medium transition-colors duration-150 ${isActive ? 'text-green-400' : 'text-white/40'}`}
                                    >
                                        {tab.name}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}
