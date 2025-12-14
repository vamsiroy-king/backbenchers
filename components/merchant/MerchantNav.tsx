"use client";

import { Home, Tag, ScanLine, BarChart3, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-100">
            <div className="flex items-center justify-around py-2 px-2 max-w-lg mx-auto">
                {TABS.map((tab) => {
                    const isActive = pathname === tab.href;
                    const Icon = tab.icon;

                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className="flex-1"
                        >
                            <div className="flex flex-col items-center justify-center py-1 active:scale-95 transition-transform duration-150">
                                <div
                                    className={`p-2.5 rounded-xl transition-all duration-200 ease-out transform ${isActive
                                            ? "bg-primary text-white scale-105 shadow-md shadow-primary/20"
                                            : "text-gray-400 hover:text-gray-600"
                                        }`}
                                    style={{ willChange: 'transform' }}
                                >
                                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                                </div>

                                <span className={`text-[10px] mt-1 font-semibold transition-colors duration-200 ${isActive ? "text-primary" : "text-gray-400"
                                    }`}>
                                    {tab.name}
                                </span>

                                {/* Active indicator */}
                                {isActive && (
                                    <div className="absolute -bottom-0.5 w-1 h-1 bg-primary rounded-full" />
                                )}
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
