"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
    LayoutDashboard,
    Store,
    Users,
    Tag,
    Flame,
    Star,
    CreditCard,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Image,
    Building2
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const MENU_ITEMS = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Hero Banners", href: "/admin/dashboard/hero-banners", icon: Image },
    { name: "Brands", href: "/admin/dashboard/brands", icon: Building2 },
    { name: "Merchants", href: "/admin/dashboard/merchants", icon: Store },
    { name: "Students", href: "/admin/dashboard/students", icon: Users },
    { name: "Offers", href: "/admin/dashboard/offers", icon: Tag },
    { name: "Trending", href: "/admin/dashboard/trending", icon: Flame },
    { name: "Top Brands", href: "/admin/dashboard/top-brands", icon: Star },
    { name: "Transactions", href: "/admin/dashboard/transactions", icon: CreditCard },
    { name: "Settings", href: "/admin/dashboard/settings", icon: Settings },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <motion.aside
            initial={false}
            animate={{ width: collapsed ? 80 : 280 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-screen bg-gray-900 text-white flex flex-col fixed left-0 top-0 z-50"
        >
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
                {!collapsed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-3"
                    >
                        <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center font-bold text-lg text-white">
                            BB
                        </div>
                        <div>
                            <h1 className="font-bold text-sm">Backbenchers</h1>
                            <p className="text-[10px] text-gray-400">Admin Panel</p>
                        </div>
                    </motion.div>
                )}
                {collapsed && (
                    <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center font-bold text-lg text-white mx-auto">
                        BB
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {MENU_ITEMS.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link key={item.name} href={item.href}>
                            <motion.div
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer",
                                    isActive
                                        ? "bg-primary text-white shadow-lg shadow-primary/25"
                                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                                )}
                            >
                                <Icon className={cn("h-5 w-5 flex-shrink-0", collapsed && "mx-auto")} />
                                {!collapsed && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-sm font-medium"
                                    >
                                        {item.name}
                                    </motion.span>
                                )}
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-gray-800">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all"
                >
                    {collapsed ? (
                        <ChevronRight className="h-5 w-5" />
                    ) : (
                        <>
                            <ChevronLeft className="h-5 w-5" />
                            <span className="text-sm">Collapse</span>
                        </>
                    )}
                </button>
            </div>
        </motion.aside>
    );
}
