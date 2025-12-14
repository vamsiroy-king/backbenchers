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
        <div className="fixed bottom-4 left-4 right-4 z-50">
            {/* Floating Pill Container */}
            <div className="bg-white/90 backdrop-blur-xl rounded-full shadow-lg shadow-black/10 border border-gray-100 px-2 py-2 max-w-md mx-auto">
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
                                <div className="flex flex-col items-center justify-center py-1 relative active:scale-90 transition-transform duration-100">
                                    <div
                                        className={`p-2.5 rounded-2xl transition-all duration-200 ease-out transform ${isActive
                                                ? "bg-primary text-white scale-110 -translate-y-0.5 shadow-lg shadow-primary/30"
                                                : "text-gray-400 hover:text-gray-600"
                                            }`}
                                        style={{ willChange: 'transform' }}
                                    >
                                        <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.8} />
                                    </div>

                                    <span
                                        className={`text-[9px] mt-1 font-semibold transition-all duration-200 ${isActive ? "text-primary opacity-100" : "text-gray-400 opacity-60"
                                            }`}
                                    >
                                        {tab.name}
                                    </span>

                                    {/* Active indicator dot */}
                                    {isActive && (
                                        <div className="absolute -bottom-0.5 w-1 h-1 bg-primary rounded-full" />
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Safe area padding for iPhone home indicator */}
            <div className="h-[env(safe-area-inset-bottom,0px)]" />
        </div>
    );
}
