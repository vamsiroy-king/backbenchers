"use client";

import {
    Users, Store, Tag, TrendingUp, ChevronRight, Clock, Check, X,
    Loader2, ArrowUpRight, ArrowDownRight, MoreHorizontal, Eye
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { studentService } from "@/lib/services/student.service";
import { merchantService } from "@/lib/services/merchant.service";
import { offerService } from "@/lib/services/offer.service";
import { transactionService } from "@/lib/services/transaction.service";
import { Merchant } from "@/lib/types";

export default function AdminDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        students: { total: 0, verified: 0, pending: 0, suspended: 0 },
        merchants: { total: 0, approved: 0, pending: 0, rejected: 0 },
        offers: { total: 0, active: 0, paused: 0 },
        transactions: { total: 0, today: 0, week: 0, totalSavings: 0 }
    });
    const [pendingMerchants, setPendingMerchants] = useState<Merchant[]>([]);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                setLoading(true);
                const [studentStats, merchantStats, offerStats, txStats] = await Promise.all([
                    studentService.getStats(),
                    merchantService.getStats(),
                    offerService.getStats(),
                    transactionService.getStats()
                ]);

                setStats({
                    students: studentStats,
                    merchants: merchantStats,
                    offers: offerStats,
                    transactions: txStats
                });

                const pendingResult = await merchantService.getAll({ status: 'pending' });
                if (pendingResult.success && pendingResult.data) {
                    setPendingMerchants(pendingResult.data.slice(0, 5));
                }
            } catch (error) {
                console.error('Error fetching admin stats:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    const STATS = [
        {
            label: "Total Students",
            value: stats.students.total,
            icon: Users,
            color: "from-blue-500 to-blue-600",
            bgColor: "bg-blue-50",
            textColor: "text-blue-600",
            trend: stats.students.pending > 0 ? `+${stats.students.pending} pending` : "0 pending",
            trendUp: stats.students.pending > 0,
            link: "/admin/dashboard/students"
        },
        {
            label: "Total Merchants",
            value: stats.merchants.total,
            icon: Store,
            color: "from-purple-500 to-pink-500",
            bgColor: "bg-purple-50",
            textColor: "text-purple-600",
            trend: stats.merchants.pending > 0 ? `+${stats.merchants.pending} pending` : "0 pending",
            trendUp: stats.merchants.pending > 0,
            link: "/admin/dashboard/merchants"
        },
        {
            label: "Active Offers",
            value: stats.offers.active,
            icon: Tag,
            color: "from-orange-500 to-red-500",
            bgColor: "bg-orange-50",
            textColor: "text-orange-600",
            trend: `${stats.offers.total} total`,
            trendUp: true,
            link: "/admin/dashboard/offers"
        },
        {
            label: "Today's Redemptions",
            value: stats.transactions.today,
            icon: TrendingUp,
            color: "from-green-500 to-emerald-500",
            bgColor: "bg-green-50",
            textColor: "text-green-600",
            trend: `₹${(stats.transactions.totalSavings / 1000).toFixed(1)}k saved`,
            trendUp: true,
            link: "/admin/dashboard/transactions"
        },
    ];

    const handleApprove = async (merchantId: string) => {
        setActionLoading(merchantId);
        try {
            await merchantService.approve(merchantId);
            setPendingMerchants(prev => prev.filter(m => m.id !== merchantId));
            setStats(prev => ({
                ...prev,
                merchants: {
                    ...prev.merchants,
                    pending: prev.merchants.pending - 1,
                    approved: prev.merchants.approved + 1
                }
            }));
        } catch (error) {
            console.error('Error approving merchant:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (merchantId: string) => {
        setActionLoading(merchantId);
        try {
            await merchantService.reject(merchantId, 'Rejected by admin');
            setPendingMerchants(prev => prev.filter(m => m.id !== merchantId));
            setStats(prev => ({
                ...prev,
                merchants: {
                    ...prev.merchants,
                    pending: prev.merchants.pending - 1,
                    rejected: prev.merchants.rejected + 1
                }
            }));
        } catch (error) {
            console.error('Error rejecting merchant:', error);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                    <p className="text-sm text-gray-500 mt-1">Welcome back! Here's what's happening with your platform.</p>
                </div>
                <div className="flex items-center gap-3">
                    <select className="h-10 px-4 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none">
                        <option>Last 7 days</option>
                        <option>Last 30 days</option>
                        <option>Last 90 days</option>
                    </select>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {STATS.map((stat, index) => (
                    <Link key={index} href={stat.link}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -4, boxShadow: "0 12px 40px -12px rgba(0,0,0,0.15)" }}
                            className="bg-white rounded-2xl p-6 border border-gray-100 cursor-pointer transition-all"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                                    <stat.icon className="h-6 w-6 text-white" />
                                </div>
                                <div className={`flex items-center gap-1 text-xs font-semibold ${stat.trendUp ? 'text-green-600' : 'text-gray-500'}`}>
                                    {stat.trendUp ? <ArrowUpRight className="h-3 w-3" /> : null}
                                    {stat.trend}
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                        </motion.div>
                    </Link>
                ))}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pending Approvals */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                                <Clock className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Pending Approvals</h3>
                                <p className="text-xs text-gray-500">{stats.merchants.pending} merchants waiting</p>
                            </div>
                        </div>
                        <Link href="/admin/dashboard/merchants" className="text-sm text-purple-600 font-semibold hover:underline flex items-center gap-1">
                            View all <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>

                    {pendingMerchants.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                            {pendingMerchants.map((merchant) => (
                                <div key={merchant.id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                                                {merchant.logo ? (
                                                    <img src={merchant.logo} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Store className="h-6 w-6 text-gray-400" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{merchant.businessName}</h4>
                                                <p className="text-xs text-gray-500">{merchant.category} • {merchant.city}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Redirect to detail page for proper 2-step approval with offer creation */}
                                            <Link href={`/admin/dashboard/merchants/${merchant.id}`}>
                                                <button className="h-9 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-1 transition-colors">
                                                    <Eye className="h-4 w-4" /> Review & Approve
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="h-8 w-8 text-green-600" />
                            </div>
                            <p className="text-gray-500">No pending approvals! 🎉</p>
                        </div>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-900 mb-6">Platform Health</h3>

                    <div className="space-y-6">
                        {/* Students Breakdown */}
                        <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-gray-500">Verified Students</span>
                                <span className="font-semibold">{stats.students.verified} / {stats.students.total}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full transition-all"
                                    style={{ width: `${stats.students.total > 0 ? (stats.students.verified / stats.students.total) * 100 : 0}%` }}
                                />
                            </div>
                        </div>

                        {/* Merchants Breakdown */}
                        <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-gray-500">Approved Merchants</span>
                                <span className="font-semibold">{stats.merchants.approved} / {stats.merchants.total}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-purple-500 rounded-full transition-all"
                                    style={{ width: `${stats.merchants.total > 0 ? (stats.merchants.approved / stats.merchants.total) * 100 : 0}%` }}
                                />
                            </div>
                        </div>

                        {/* Offers Status */}
                        <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-gray-500">Active Offers</span>
                                <span className="font-semibold">{stats.offers.active} / {stats.offers.total}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-orange-500 rounded-full transition-all"
                                    style={{ width: `${stats.offers.total > 0 ? (stats.offers.active / stats.offers.total) * 100 : 0}%` }}
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-500 text-sm">Total Savings</span>
                                <span className="text-2xl font-bold text-green-600">₹{stats.transactions.totalSavings.toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-gray-400">Generated for students</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/admin/dashboard/trending">
                    <motion.div
                        whileHover={{ y: -2 }}
                        className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white cursor-pointer"
                    >
                        <TrendingUp className="h-8 w-8 mb-3" />
                        <h4 className="font-bold">Manage Trending</h4>
                        <p className="text-sm opacity-80">Curate homepage carousel</p>
                    </motion.div>
                </Link>
                <Link href="/admin/dashboard/top-brands">
                    <motion.div
                        whileHover={{ y: -2 }}
                        className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white cursor-pointer"
                    >
                        <Store className="h-8 w-8 mb-3" />
                        <h4 className="font-bold">Top Brands</h4>
                        <p className="text-sm opacity-80">Feature merchants</p>
                    </motion.div>
                </Link>
                <Link href="/admin/dashboard/students">
                    <motion.div
                        whileHover={{ y: -2 }}
                        className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl p-6 text-white cursor-pointer"
                    >
                        <Users className="h-8 w-8 mb-3" />
                        <h4 className="font-bold">Students</h4>
                        <p className="text-sm opacity-80">{stats.students.pending} pending verification</p>
                    </motion.div>
                </Link>
                <Link href="/admin/dashboard/settings">
                    <motion.div
                        whileHover={{ y: -2 }}
                        className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl p-6 text-white cursor-pointer"
                    >
                        <Tag className="h-8 w-8 mb-3" />
                        <h4 className="font-bold">Settings</h4>
                        <p className="text-sm opacity-80">Configure platform</p>
                    </motion.div>
                </Link>
            </div>
        </div>
    );
}
