"use client";

import { Home, Tag, ScanLine, BarChart3, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const TABS = [
    { name: "Home", href: "/merchant/dashboard", icon: Home },
    { name: "Offers", href: "/merchant/dashboard/offers", icon: Tag },
    { name: "Scan", href: "/merchant/dashboard/scan", icon: ScanLine },
    { name: "Analytics", href: "/merchant/dashboard/analytics", icon: BarChart3 },
    { name: "Profile", href: "/merchant/dashboard/profile", icon: User },
];

export function MerchantNav() {
    const pathname = usePathname();

    return (
        <div className="fixed md:absolute bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200/50">
            <div className="flex items-center justify-around py-2 px-2">
                {TABS.map((tab) => {
                    const isActive = pathname === tab.href;
                    const Icon = tab.icon;

                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className="flex-1"
                        >
                            <div className="flex flex-col items-center justify-center py-1">
                                <motion.div
                                    animate={{ scale: isActive ? 1.1 : 1 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    className={`p-2 rounded-xl transition-colors ${isActive ? "bg-primary text-white" : "text-gray-400"
                                        }`}
                                >
                                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                                </motion.div>

                                <span className={`text-[9px] mt-0.5 font-semibold ${isActive ? "text-primary" : "text-gray-400"
                                    }`}>
                                    {tab.name}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Safe area padding for iPhone home indicator */}
            <div className="h-[env(safe-area-inset-bottom,8px)]" />
        </div>
    );
}
