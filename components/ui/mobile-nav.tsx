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
            {/* Glass effect nav bar */}
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-100/80 dark:border-gray-800 px-2 pt-2 pb-[max(env(safe-area-inset-bottom),8px)]">
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
                                        className={`p-2 rounded-xl transition-colors duration-100 ${isActive ? 'bg-primary' : 'bg-transparent'}`}
                                    >
                                        <Icon
                                            className={`h-5 w-5 transition-colors duration-100 ${isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`}
                                            strokeWidth={isActive ? 2.5 : 1.8}
                                        />
                                    </div>

                                    <span
                                        className={`text-[10px] mt-0.5 font-medium transition-colors duration-100 ${isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}
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
