"use client";

import { Bell, Search, User, ChevronDown, LogOut, Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface AdminTopbarProps {
    sidebarCollapsed?: boolean;
}

export function AdminTopbar({ sidebarCollapsed = false }: AdminTopbarProps) {
    const [showProfile, setShowProfile] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const profileRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);

    // Close dropdowns on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfile(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const notifications = [
        { id: 1, title: "New merchant signup", message: "Cafe Corner requested approval", time: "2 min ago", unread: true },
        { id: 2, title: "Student verified", message: "John Doe completed verification", time: "15 min ago", unread: true },
        { id: 3, title: "Offer created", message: "Pizza Place added 20% off deal", time: "1 hour ago", unread: false },
    ];

    const unreadCount = notifications.filter(n => n.unread).length;

    return (
        <header
            className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 z-40 flex items-center justify-between px-6"
            style={{ left: sidebarCollapsed ? 80 : 280, transition: "left 0.3s ease-in-out" }}
        >
            {/* Search */}
            <div className="flex-1 max-w-xl">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search merchants, students, offers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-11 pl-12 pr-4 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white border border-transparent focus:border-primary/30 transition-all"
                    />
                </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4 ml-6">
                {/* Notifications */}
                <div ref={notifRef} className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="h-10 w-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center relative transition-colors"
                    >
                        <Bell className="h-5 w-5 text-gray-600" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    <AnimatePresence>
                        {showNotifications && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                            >
                                <div className="p-4 border-b border-gray-100">
                                    <h3 className="font-bold">Notifications</h3>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${notif.unread ? "bg-primary/5" : ""}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`h-2 w-2 rounded-full mt-2 ${notif.unread ? "bg-primary" : "bg-transparent"}`} />
                                                <div className="flex-1">
                                                    <p className="font-semibold text-sm">{notif.title}</p>
                                                    <p className="text-xs text-gray-500">{notif.message}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">{notif.time}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 border-t border-gray-100">
                                    <button className="w-full text-sm text-primary font-semibold hover:underline">
                                        View all notifications
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Divider */}
                <div className="h-8 w-px bg-gray-200" />

                {/* Profile */}
                <div ref={profileRef} className="relative">
                    <button
                        onClick={() => setShowProfile(!showProfile)}
                        className="flex items-center gap-3 hover:bg-gray-100 rounded-xl p-2 pr-3 transition-colors"
                    >
                        <div className="h-9 w-9 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-sm">
                            A
                        </div>
                        <div className="text-left hidden sm:block">
                            <p className="text-sm font-semibold">Admin</p>
                            <p className="text-[10px] text-gray-500">Super Admin</p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>

                    <AnimatePresence>
                        {showProfile && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute right-0 top-14 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                            >
                                <div className="p-4 border-b border-gray-100">
                                    <p className="font-bold">Admin User</p>
                                    <p className="text-xs text-gray-500">admin@backbenchers.in</p>
                                </div>
                                <div className="p-2">
                                    <Link href="/admin/dashboard/settings">
                                        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-xl">
                                            <Settings className="h-4 w-4" />
                                            Settings
                                        </button>
                                    </Link>
                                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl">
                                        <LogOut className="h-4 w-4" />
                                        Sign out
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
}
