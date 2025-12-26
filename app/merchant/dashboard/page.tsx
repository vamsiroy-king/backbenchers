"use client";

import { Button } from "@/components/ui/button";
import { Bell, TrendingUp, Users, Tag, IndianRupee, Plus, ScanLine, ChevronRight, Loader2, Store } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { merchantService } from "@/lib/services/merchant.service";
import { transactionService } from "@/lib/services/transaction.service";
import { offerService } from "@/lib/services/offer.service";
import { Transaction, Merchant, Offer } from "@/lib/types";

export default function MerchantDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [merchant, setMerchant] = useState<Merchant | null>(null);
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [dashboardStats, setDashboardStats] = useState({
        todayEarnings: 0,
        totalRedemptions: 0,
        activeOffers: 0,
        totalRevenue: 0
    });

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);

                // Get merchant profile
                const profileResult = await merchantService.getMyProfile();
                if (profileResult.success && profileResult.data) {
                    setMerchant(profileResult.data);

                    // Get dashboard stats
                    const stats = await merchantService.getDashboardStats(profileResult.data.id);
                    setDashboardStats(stats);

                    // Get recent transactions
                    const txResult = await transactionService.getMerchantTransactions(profileResult.data.id, 5);
                    if (txResult.success && txResult.data) {
                        setRecentTransactions(txResult.data);
                    }

                    // Get offers
                    const offersResult = await offerService.getMyOffers();
                    if (offersResult.success && offersResult.data) {
                        setOffers(offersResult.data);
                    }

                    // Subscribe to realtime transaction updates
                    const unsubscribe = transactionService.subscribeToMerchantTransactions(
                        profileResult.data.id,
                        (newTx) => {
                            setRecentTransactions(prev => [newTx, ...prev.slice(0, 4)]);
                            setDashboardStats(prev => ({
                                ...prev,
                                todayEarnings: prev.todayEarnings + newTx.finalAmount,
                                totalRedemptions: prev.totalRedemptions + 1
                            }));
                        }
                    );

                    return () => unsubscribe();
                }
            } catch (error) {
                console.error('Error fetching merchant data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
        return `${Math.floor(diffMins / 1440)} days ago`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 pb-32">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-b border-gray-100/80 dark:border-gray-800">
                <div className="px-5 h-16 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Welcome back</p>
                        <h1 className="font-bold text-lg text-gray-900 dark:text-white">{merchant?.businessName || 'Merchant'} 👋</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {merchant?.status === 'approved' && (
                            <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/30 px-2.5 py-1 rounded-lg">
                                <span className="text-yellow-500">★</span>
                                <span className="text-[10px] font-bold text-yellow-700 dark:text-yellow-400">
                                    {(merchant as any)?.rating?.toFixed(1) || '5.0'}
                                </span>
                            </div>
                        )}
                        {merchant?.status === 'pending' && (
                            <span className="text-[10px] bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 px-2.5 py-1 rounded-lg font-semibold">
                                Pending
                            </span>
                        )}
                        <button className="h-10 w-10 rounded-xl bg-white dark:bg-gray-800 shadow-subtle dark:shadow-none border border-gray-100/50 dark:border-gray-700 flex items-center justify-center">
                            <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="px-5 pt-8 space-y-6">
                {/* Status Banner for Pending */}
                {merchant?.status === 'pending' && (
                    <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 shadow-subtle">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <Store className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-yellow-800 text-sm">Awaiting Approval</h3>
                                <p className="text-xs text-yellow-600">Your account is under review. You'll get your BBM-ID once approved.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Today's Performance */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white shadow-elevated">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <p className="text-[10px] text-white/50 uppercase tracking-wider">
                                {new Date().toLocaleDateString('en-IN', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long'
                                })}
                            </p>
                            <h3 className="font-semibold text-base mt-0.5">Today's Performance</h3>
                        </div>
                        <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-white/80" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-2xl font-bold">{dashboardStats.totalRedemptions}</p>
                            <p className="text-[10px] text-white/50">Redemptions</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">₹{dashboardStats.todayEarnings.toLocaleString('en-IN')}</p>
                            <p className="text-[10px] text-white/50">Today's Earnings</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{dashboardStats.activeOffers}</p>
                            <p className="text-[10px] text-white/50">Active Offers</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <Link href="/merchant/dashboard/scan">
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-gray-900 text-white rounded-xl p-4 flex items-center justify-between shadow-card"
                            disabled={merchant?.status !== 'approved'}
                        >
                            <div className="flex items-center gap-3">
                                <ScanLine className="h-5 w-5" />
                                <span className="font-semibold text-sm">Scan QR</span>
                            </div>
                            <ChevronRight className="h-4 w-4 opacity-50" />
                        </motion.button>
                    </Link>
                    <Link href="/merchant/dashboard/offers/new">
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-primary text-white rounded-xl p-4 flex items-center justify-between shadow-card"
                            disabled={merchant?.status !== 'approved'}
                        >
                            <div className="flex items-center gap-3">
                                <Plus className="h-5 w-5" />
                                <span className="font-semibold text-sm">New Offer</span>
                            </div>
                            <ChevronRight className="h-4 w-4 opacity-50" />
                        </motion.button>
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: "Total Revenue", value: `₹${dashboardStats.totalRevenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: "bg-purple-500" },
                        { label: "Active Offers", value: offers.filter(o => o.status === 'active').length.toString(), icon: Tag, color: "bg-primary" },
                    ].map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm dark:shadow-none"
                        >
                            <div className={`h-10 w-10 ${stat.color} rounded-xl flex items-center justify-center mb-2`}>
                                <stat.icon className="h-5 w-5 text-white" />
                            </div>
                            <p className="text-2xl font-extrabold dark:text-white">{stat.value}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Recent Redemptions */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg dark:text-white">Recent Redemptions</h3>
                        <Link href="/merchant/dashboard/transactions" className="text-primary text-sm font-semibold">
                            View All
                        </Link>
                    </div>

                    {recentTransactions.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                            <TrendingUp className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">No redemptions yet</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">Transactions will appear here in real-time</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {recentTransactions.map((tx, index) => (
                                <motion.div
                                    key={tx.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                                            {tx.studentName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm dark:text-white">{tx.studentName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{tx.offerTitle}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm text-primary">₹{tx.finalAmount}</p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{formatTimeAgo(tx.redeemedAt)}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* My Offers */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg dark:text-white">My Offers</h3>
                        <Link href="/merchant/dashboard/offers" className="text-primary text-sm font-semibold">
                            Manage
                        </Link>
                    </div>

                    {offers.length === 0 ? (
                        <Link href="/merchant/dashboard/offers/new">
                            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6 text-center">
                                <Plus className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                <p className="font-bold text-gray-600 dark:text-gray-300">Create Your First Offer</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Attract students with exclusive discounts</p>
                            </div>
                        </Link>
                    ) : (
                        <div className="space-y-2">
                            {offers.slice(0, 3).map((offer) => (
                                <Link key={offer.id} href={`/merchant/dashboard/offers/${offer.id}`}>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                        <div>
                                            <p className="font-bold text-sm dark:text-white">{offer.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {offer.type === 'percentage' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${offer.status === 'active' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                                }`}>
                                                {offer.status}
                                            </span>
                                            <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
