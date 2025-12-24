"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, Bell, BellOff,
    Sparkles, Tag, Store, ShieldCheck, TrendingUp, Gift,
    ChevronRight, Clock, Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { notificationService, Notification } from "@/lib/services/notification.service";

// Icon mapping based on notification type
const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'offer': return { icon: Tag, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' };
        case 'redemption': return { icon: Gift, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' };
        case 'merchant': return { icon: Store, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' };
        case 'approval': return { icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' };
        case 'trending': return { icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' };
        default: return { icon: Sparkles, color: 'text-primary', bg: 'bg-primary/10' };
    }
};

// Format relative time
const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch notifications and auto-mark all as read when page opens
    useEffect(() => {
        async function fetchAndMarkRead() {
            setLoading(true);
            const result = await notificationService.getMyNotifications();
            if (result.success && result.data) {
                setNotifications(result.data);

                // Auto-mark all as read when opening the page
                const hasUnread = result.data.some(n => !n.isRead);
                if (hasUnread) {
                    await notificationService.markAllAsRead();
                    // Update local state to show all as read
                    setNotifications(result.data.map(n => ({ ...n, isRead: true })));
                }
            }
            setLoading(false);
        }
        fetchAndMarkRead();
    }, []);

    // Handle notification click - Smart redirects based on type
    const handleNotificationClick = async (notification: Notification) => {
        // Navigate based on notification type and data
        const data = notification.data || {};

        switch (notification.type) {
            case 'offer':
                // Go to explore with merchant filter if available
                if (data.merchantId) {
                    router.push(`/dashboard/explore?merchant=${data.merchantId}`);
                } else if (data.offerId) {
                    router.push(`/dashboard/explore?offer=${data.offerId}`);
                } else {
                    router.push('/dashboard/explore');
                }
                break;
            case 'redemption':
                // Go to profile/transactions
                router.push('/dashboard/profile');
                break;
            case 'welcome':
                // Go to explore to start browsing
                router.push('/dashboard/explore');
                break;
            case 'approval':
                // Merchant approved - go to merchant dashboard
                router.push('/merchant/dashboard');
                break;
            case 'alert':
                // Stay on current page or go home
                router.push('/');
                break;
            default:
                // Use route from data if available, otherwise explore
                if (data.route) {
                    router.push(data.route);
                } else if (data.merchantId) {
                    router.push(`/dashboard/explore?merchant=${data.merchantId}`);
                } else {
                    router.push('/dashboard/explore');
                }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
            {/* Premium Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between px-5 h-16">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center active:scale-95 transition-transform"
                        >
                            <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                        </button>
                        <h1 className="font-bold text-lg text-gray-900 dark:text-white">Notifications</h1>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="px-5 pt-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                            <Bell className="h-10 w-10 text-primary" />
                        </motion.div>
                        <p className="text-gray-500 mt-4">Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-20"
                    >
                        <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                            <BellOff className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">No notifications yet</h3>
                        <p className="text-sm text-gray-500 text-center max-w-[200px]">
                            When you get notifications, they'll appear here
                        </p>
                    </motion.div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {notifications.map((notification, index) => {
                                const { icon: Icon, color, bg } = getNotificationIcon(notification.type);

                                return (
                                    <motion.div
                                        key={notification.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => handleNotificationClick(notification)}
                                        className="relative p-4 rounded-2xl cursor-pointer active:scale-[0.98] transition-all bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
                                    >
                                        <div className="flex gap-4">
                                            {/* Icon */}
                                            <div className={`h-12 w-12 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0`}>
                                                <Icon className={`h-6 w-6 ${color}`} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 dark:text-white mb-0.5">
                                                    {notification.title}
                                                </h3>
                                                {notification.body && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                                        {notification.body}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                    <span className="text-xs text-gray-500">
                                                        {getRelativeTime(notification.createdAt)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Arrow */}
                                            {(notification.data?.route || notification.data?.offerId || notification.data?.merchantId) && (
                                                <div className="flex items-center">
                                                    <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
}
