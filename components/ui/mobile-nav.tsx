"use client";

import { Home, User, Briefcase, Compass, Map } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/providers/ThemeProvider";

const TABS = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Explore", href: "/dashboard/explore", icon: Compass },
    { name: "Map", href: "/dashboard/map", icon: Map },
    { name: "Hustle", href: "/dashboard/hustle", icon: Briefcase },
    { name: "Profile", href: "/dashboard/profile", icon: User },
];

export function MobileNav() {
    const pathname = usePathname();
    const { theme } = useTheme();
    const isLight = theme === 'light';

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-[5000]"
            style={{ transform: 'translateZ(0)', willChange: 'transform' }}
        >
            {/* Premium Glass Nav Bar - Apple Style */}
            <div className={`backdrop-blur-xl px-2 pt-2 pb-[max(env(safe-area-inset-bottom),8px)] transition-all duration-300 ${isLight
                ? 'bg-white/80 border-t border-gray-200'
                : 'bg-black/60 border-t border-white/10'
                }`}>
                <div className="flex items-center justify-around max-w-md mx-auto">
                    {TABS.map((tab) => {
                        const isActive = pathname === tab.href;
                        const Icon = tab.icon;

                        return (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                prefetch={true}
                                className="flex-1 press-scale"
                            >
                                <div
                                    className="flex flex-col items-center justify-center py-2 relative"
                                    style={{ transform: 'translateZ(0)' }}
                                >
                                    <div
                                        className={`p-2 rounded-xl transition-all duration-150 ${isActive
                                            ? 'bg-green-500 shadow-lg shadow-green-500/25'
                                            : 'bg-transparent'
                                            }`}
                                    >
                                        <Icon
                                            className={`h-5 w-5 transition-colors duration-150 ${isActive
                                                ? 'text-white'
                                                : isLight
                                                    ? 'text-gray-400'
                                                    : 'text-white/40'
                                                }`}
                                            strokeWidth={isActive ? 2.5 : 1.8}
                                        />
                                    </div>

                                    <span
                                        className={`text-[10px] mt-0.5 font-medium transition-colors duration-150 ${isActive
                                            ? 'text-green-500'
                                            : isLight
                                                ? 'text-gray-400'
                                                : 'text-white/40'
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
