"use client";

import { Home, Map as MapIcon, User, Flame, Compass } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
        <div className="fixed bottom-0 left-0 right-0 z-50">
            {/* Floating Pill Container - fixed at bottom with safe area */}
            <div className="bg-white/95 backdrop-blur-xl border-t border-gray-100/80 px-3 pt-2 pb-[max(env(safe-area-inset-bottom),12px)]">
                <div className="flex items-center justify-around max-w-md mx-auto">
                    {TABS.map((tab) => {
                        const isActive = pathname === tab.href;
                        const Icon = tab.icon;

                        return (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                className="flex-1"
                            >
                                <div className="flex flex-col items-center justify-center py-1 relative active:scale-90 transition-transform duration-100">
                                    <div
                                        className={`p-2 rounded-xl transition-all duration-200 ease-out ${isActive
                                            ? "bg-primary text-white shadow-sm"
                                            : "text-gray-400"
                                            }`}
                                    >
                                        <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.8} />
                                    </div>

                                    <span
                                        className={`text-[10px] mt-0.5 font-medium transition-all duration-200 ${isActive ? "text-primary" : "text-gray-400"
                                            }`}
                                    >
                                        {tab.name}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
