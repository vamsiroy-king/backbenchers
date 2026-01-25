"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Compass, User, Settings, Bell, Search, LogOut, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";

interface DesktopLayoutProps {
    children: ReactNode;
}

export function DesktopLayout({ children }: DesktopLayoutProps) {
    const pathname = usePathname();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Only apply desktop layout on specific paths (student app)
    // Admin, auth, and landing pages should handle their own layout or be excluded
    const isStudentApp = !pathname?.startsWith('/admin') &&
        !pathname?.startsWith('/merchant') &&
        !pathname?.startsWith('/auth');

    if (!isStudentApp) return <>{children}</>;

    const navItems = [
        { icon: Home, label: "Home", href: "/dashboard" },
        { icon: Search, label: "Explore", href: "/dashboard/explore" },
        { icon: Compass, label: "Trending", href: "/dashboard/trending" },
        { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
        { icon: User, label: "Profile", href: "/dashboard/profile" },
    ];

    return (
        <div className="flex min-h-screen bg-black text-white md:bg-black">
            {/* Desktop Sidebar (Left) */}
            <aside className="hidden md:flex w-[245px] flex-col border-r border-[#262626] h-screen sticky top-0 px-3 pt-8 pb-5 z-50">
                {/* Logo */}
                <div className="px-3 mb-8">
                    <h1 className="text-xl font-bold italic tracking-tighter cursor-pointer">Backbenchers</h1>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-4 p-3 rounded-lg hover:bg-[#1a1a1a] transition-colors group",
                                    isActive && "font-bold"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "h-6 w-6 transition-transform group-hover:scale-105",
                                        isActive ? "text-white fill-white" : "text-white"
                                    )}
                                    strokeWidth={isActive ? 3 : 2}
                                />
                                <span className="text-base">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="space-y-2 mt-auto">
                    <button className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#1a1a1a] w-full text-left transition-colors">
                        <Menu className="h-6 w-6" />
                        <span className="text-base">More</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area (Center) */}
            <main className={cn(
                "flex-1 w-full md:max-w-4xl mx-auto md:py-8 md:px-12 min-h-screen",
                // On mobile, standard full width. On desktop, centered column like Instagram
            )}>
                <div className="w-full max-w-[630px] mx-auto">
                    {children}
                </div>
            </main>

            {/* Right Sidebar (Suggestions/Profile) */}
            <aside className="hidden lg:block w-[320px] pl-8 py-8 pr-4 h-screen sticky top-0">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-full bg-zinc-800" />
                        <div className="text-sm">
                            <div className="font-bold">student_user</div>
                            <div className="text-zinc-500">Student Account</div>
                        </div>
                    </div>
                    <button className="text-xs font-bold text-blue-500 hover:text-white">Switch</button>
                </div>

                <div className="flex items-center justify-between mb-2 mt-6">
                    <span className="text-sm font-bold text-zinc-500">Suggested for you</span>
                    <button className="text-xs font-bold text-white hover:text-zinc-400">See All</button>
                </div>

                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-zinc-800" />
                                <div className="text-xs">
                                    <div className="font-bold text-white">store_brand_{i}</div>
                                    <div className="text-zinc-500">New partner</div>
                                </div>
                            </div>
                            <button className="text-xs font-bold text-blue-500 hover:text-white">Follow</button>
                        </div>
                    ))}
                </div>

                <div className="mt-8 text-xs text-zinc-700 space-y-4">
                    <p>About • Help • Press • API • Jobs • Privacy • Terms</p>
                    <p>© 2026 BACKBENCHERS STUDENTS APP</p>
                </div>
            </aside>
        </div>
    );
}
