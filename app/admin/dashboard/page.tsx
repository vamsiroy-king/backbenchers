"use client";

import {
    Users, Store, Tag, TrendingUp, ChevronRight, Clock, Check,
    Loader2, ArrowUpRight, ArrowDownRight, Eye, Image, DollarSign,
    PiggyBank, Activity, MapPin, BarChart3, PieChart, Wallet,
    UserCheck, Award, AlertTriangle, Star, LogOut
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { studentService } from "@/lib/services/student.service";
import { merchantService } from "@/lib/services/merchant.service";
import { offerService } from "@/lib/services/offer.service";
import { transactionService } from "@/lib/services/transaction.service";
import { analyticsService, TopMerchant, CityDistribution, CategoryPerformance } from "@/lib/services/analytics.service";
import { Merchant } from "@/lib/types";

export default function AdminDashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [signingOut, setSigningOut] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'merchants'>('overview');
    const [stats, setStats] = useState({
        students: { total: 0, verified: 0, pending: 0, suspended: 0 },
        merchants: { total: 0, approved: 0, pending: 0, rejected: 0 },
        offers: { total: 0, active: 0, paused: 0 },
        transactions: { total: 0, today: 0, week: 0, totalSavings: 0 }
    });
    const [pendingMerchants, setPendingMerchants] = useState<Merchant[]>([]);
    const [topMerchants, setTopMerchants] = useState<TopMerchant[]>([]);
    const [cityDistribution, setCityDistribution] = useState<CityDistribution[]>([]);
    const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformance[]>([]);
    const [dateRange, setDateRange] = useState('7');

    // Sign out handler
    const handleSignOut = async () => {
        setSigningOut(true);
        try {
            await fetch('/api/admin/signout', { method: 'POST' });
            // Redirect to auth page
            window.location.href = '/admin-auth';
        } catch (error) {
            console.error('Sign out failed:', error);
            setSigningOut(false);
        }
    };

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);

                // Core stats
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

                // Pending merchants
                const pendingResult = await merchantService.getAll({ status: 'pending' });
                if (pendingResult.success && pendingResult.data) {
                    setPendingMerchants(pendingResult.data.slice(0, 5));
                }

                // Analytics data
                const [topMerchantsData, cityData, categoryData] = await Promise.all([
                    analyticsService.getTopMerchants(10),
                    analyticsService.getCityDistribution(),
                    analyticsService.getCategoryPerformance()
                ]);

                setTopMerchants(topMerchantsData);
                setCityDistribution(cityData);
                setCategoryPerformance(categoryData);

            } catch (error) {
                console.error('Error fetching admin data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [dateRange]);

    // Calculate totals for analytics
    const totalCityStudents = cityDistribution.reduce((sum, c) => sum + c.studentsCount, 0);
    const totalCityMerchants = cityDistribution.reduce((sum, c) => sum + c.merchantsCount, 0);
    const totalCategoryTx = categoryPerformance.reduce((sum, c) => sum + c.transactionsCount, 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
                    <p className="text-gray-500">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Complete platform overview and analytics</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="h-10 px-4 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-purple-500/20"
                    >
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="365">This Year</option>
                    </select>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-gray-100 pb-3">
                {[
                    { id: 'overview', label: 'Overview', icon: BarChart3 },
                    { id: 'analytics', label: 'Analytics', icon: PieChart },
                    { id: 'merchants', label: 'Merchants', icon: Store }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                            ? 'bg-purple-100 text-purple-700'
                            : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* Key Metrics Row */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Total Revenue */}
                            <motion.div
                                whileHover={{ y: -2 }}
                                className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-green-500/20"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <DollarSign className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs bg-white/20 px-2 py-1 rounded-lg">+12%</span>
                                </div>
                                <p className="text-2xl font-bold">₹{(stats.transactions.totalSavings * 1.5).toLocaleString()}</p>
                                <p className="text-sm opacity-80 mt-1">Total Revenue</p>
                            </motion.div>

                            {/* Student Savings */}
                            <motion.div
                                whileHover={{ y: -2 }}
                                className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <PiggyBank className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs bg-white/20 px-2 py-1 rounded-lg">+8%</span>
                                </div>
                                <p className="text-2xl font-bold">₹{stats.transactions.totalSavings.toLocaleString()}</p>
                                <p className="text-sm opacity-80 mt-1">Student Savings</p>
                            </motion.div>

                            {/* Active Users */}
                            <motion.div
                                whileHover={{ y: -2 }}
                                className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-5 text-white shadow-lg shadow-purple-500/20"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs bg-white/20 px-2 py-1 rounded-lg">{stats.students.pending} pending</span>
                                </div>
                                <p className="text-2xl font-bold">{stats.students.total.toLocaleString()}</p>
                                <p className="text-sm opacity-80 mt-1">Total Students</p>
                            </motion.div>

                            {/* Today's Transactions */}
                            <motion.div
                                whileHover={{ y: -2 }}
                                className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 text-white shadow-lg shadow-orange-500/20"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Activity className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs bg-white/20 px-2 py-1 rounded-lg">{stats.transactions.week} this week</span>
                                </div>
                                <p className="text-2xl font-bold">{stats.transactions.today}</p>
                                <p className="text-sm opacity-80 mt-1">Today's Redemptions</p>
                            </motion.div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <Link href="/admin/dashboard/students">
                                <div className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg transition-all cursor-pointer">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                            <UserCheck className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-2xl font-bold text-gray-900">{stats.students.verified}</p>
                                            <p className="text-xs text-gray-500">Verified Students</p>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats.students.total > 0 ? (stats.students.verified / stats.students.total) * 100 : 0}%` }} />
                                    </div>
                                </div>
                            </Link>

                            <Link href="/admin/dashboard/merchants">
                                <div className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg transition-all cursor-pointer">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-10 w-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                            <Store className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-2xl font-bold text-gray-900">{stats.merchants.approved}</p>
                                            <p className="text-xs text-gray-500">Active Merchants</p>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${stats.merchants.total > 0 ? (stats.merchants.approved / stats.merchants.total) * 100 : 0}%` }} />
                                    </div>
                                </div>
                            </Link>

                            <Link href="/admin/dashboard/offers">
                                <div className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg transition-all cursor-pointer">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-10 w-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                            <Tag className="h-5 w-5 text-orange-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-2xl font-bold text-gray-900">{stats.offers.active}</p>
                                            <p className="text-xs text-gray-500">Active Offers</p>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${stats.offers.total > 0 ? (stats.offers.active / stats.offers.total) * 100 : 0}%` }} />
                                    </div>
                                </div>
                            </Link>

                            <Link href="/admin/dashboard/transactions">
                                <div className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg transition-all cursor-pointer">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-10 w-10 bg-green-100 rounded-xl flex items-center justify-center">
                                            <Wallet className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-2xl font-bold text-gray-900">{stats.transactions.total}</p>
                                            <p className="text-xs text-gray-500">Total Transactions</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-green-600">
                                        <ArrowUpRight className="h-3 w-3" />
                                        {stats.transactions.week} this week
                                    </div>
                                </div>
                            </Link>
                        </div>

                        {/* Pending Approvals & Alerts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Pending Approvals */}
                            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
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
                                        {pendingMerchants.slice(0, 4).map((merchant) => (
                                            <div key={merchant.id} className="p-4 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                                                            {merchant.logo ? (
                                                                <img src={merchant.logo} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Store className="h-5 w-5 text-gray-400" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900 text-sm">{merchant.businessName}</h4>
                                                            <p className="text-xs text-gray-500">{merchant.category} • {merchant.city}</p>
                                                        </div>
                                                    </div>
                                                    <Link href={`/admin/dashboard/merchants/${merchant.id}`}>
                                                        <button className="h-8 px-3 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors">
                                                            <Eye className="h-3 w-3" /> Review
                                                        </button>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center">
                                        <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Check className="h-6 w-6 text-green-600" />
                                        </div>
                                        <p className="text-gray-500 text-sm">No pending approvals! 🎉</p>
                                    </div>
                                )}
                            </div>

                            {/* Alerts & Notifications */}
                            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                <div className="p-5 border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center">
                                            <AlertTriangle className="h-5 w-5 text-red-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">Alerts</h3>
                                            <p className="text-xs text-gray-500">Items requiring attention</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    {stats.merchants.pending > 0 && (
                                        <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl">
                                            <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                                <Clock className="h-4 w-4 text-yellow-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">{stats.merchants.pending} merchants pending approval</p>
                                                <p className="text-xs text-gray-500">Review and approve to activate</p>
                                            </div>
                                        </div>
                                    )}
                                    {stats.students.pending > 0 && (
                                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                                            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <Users className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">{stats.students.pending} students pending</p>
                                                <p className="text-xs text-gray-500">Awaiting verification</p>
                                            </div>
                                        </div>
                                    )}
                                    {stats.students.suspended > 0 && (
                                        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                                            <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
                                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">{stats.students.suspended} suspended students</p>
                                                <p className="text-xs text-gray-500">Account access blocked</p>
                                            </div>
                                        </div>
                                    )}
                                    {stats.merchants.pending === 0 && stats.students.pending === 0 && stats.students.suspended === 0 && (
                                        <div className="text-center py-6">
                                            <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">All clear! No alerts.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <Link href="/admin/dashboard/hero-banners">
                                <motion.div whileHover={{ y: -2 }} className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white cursor-pointer">
                                    <Image className="h-7 w-7 mb-2" />
                                    <h4 className="font-bold text-sm">Hero Banners</h4>
                                    <p className="text-xs opacity-80">Manage banners</p>
                                </motion.div>
                            </Link>
                            <Link href="/admin/dashboard/trending">
                                <motion.div whileHover={{ y: -2 }} className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 text-white cursor-pointer">
                                    <TrendingUp className="h-7 w-7 mb-2" />
                                    <h4 className="font-bold text-sm">Trending</h4>
                                    <p className="text-xs opacity-80">Curate offers</p>
                                </motion.div>
                            </Link>
                            <Link href="/admin/dashboard/top-brands">
                                <motion.div whileHover={{ y: -2 }} className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-5 text-white cursor-pointer">
                                    <Award className="h-7 w-7 mb-2" />
                                    <h4 className="font-bold text-sm">Top Brands</h4>
                                    <p className="text-xs opacity-80">Feature merchants</p>
                                </motion.div>
                            </Link>
                            <Link href="/admin/dashboard/students">
                                <motion.div whileHover={{ y: -2 }} className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl p-5 text-white cursor-pointer">
                                    <Users className="h-7 w-7 mb-2" />
                                    <h4 className="font-bold text-sm">Students</h4>
                                    <p className="text-xs opacity-80">{stats.students.total} total</p>
                                </motion.div>
                            </Link>
                            <Link href="/admin/dashboard/settings">
                                <motion.div whileHover={{ y: -2 }} className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl p-5 text-white cursor-pointer">
                                    <Tag className="h-7 w-7 mb-2" />
                                    <h4 className="font-bold text-sm">Settings</h4>
                                    <p className="text-xs opacity-80">Configure</p>
                                </motion.div>
                            </Link>
                        </div>
                    </motion.div>
                )}

                {/* ANALYTICS TAB */}
                {activeTab === 'analytics' && (
                    <motion.div
                        key="analytics"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* City Distribution */}
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <div className="p-5 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                        <MapPin className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">City Distribution</h3>
                                        <p className="text-xs text-gray-500">Students and merchants by city</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-5">
                                {cityDistribution.length > 0 ? (
                                    <div className="space-y-4">
                                        {cityDistribution.slice(0, 8).map((city, index) => (
                                            <div key={city.city} className="flex items-center gap-4">
                                                <span className="text-sm font-medium text-gray-500 w-6">{index + 1}</span>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-semibold text-gray-900">{city.city || 'Unknown'}</span>
                                                        <span className="text-sm text-gray-500">
                                                            {city.studentsCount} students • {city.merchantsCount} merchants
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <div
                                                            className="h-2 bg-blue-500 rounded-full"
                                                            style={{ width: `${totalCityStudents > 0 ? (city.studentsCount / totalCityStudents) * 100 : 0}%`, minWidth: city.studentsCount > 0 ? '4px' : '0' }}
                                                        />
                                                        <div
                                                            className="h-2 bg-purple-500 rounded-full"
                                                            style={{ width: `${totalCityMerchants > 0 ? (city.merchantsCount / totalCityMerchants) * 100 : 0}%`, minWidth: city.merchantsCount > 0 ? '4px' : '0' }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-gray-500 py-8">No city data available</p>
                                )}
                            </div>
                        </div>

                        {/* Category Performance */}
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <div className="p-5 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                        <PieChart className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">Category Performance</h3>
                                        <p className="text-xs text-gray-500">Merchants and transactions by category</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-5">
                                {categoryPerformance.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {categoryPerformance.map((cat) => (
                                            <div key={cat.category} className="bg-gray-50 rounded-xl p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-semibold text-gray-900">{cat.category}</span>
                                                    <span className="text-xs bg-white px-2 py-1 rounded-lg text-gray-500">
                                                        {cat.merchantsCount} merchants
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <div>
                                                        <p className="text-gray-500">Offers</p>
                                                        <p className="font-bold text-gray-900">{cat.offersCount}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500">Transactions</p>
                                                        <p className="font-bold text-gray-900">{cat.transactionsCount}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500">Revenue</p>
                                                        <p className="font-bold text-green-600">₹{cat.revenue.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-gray-500 py-8">No category data available</p>
                                )}
                            </div>
                        </div>

                        {/* Platform Summary */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-blue-50 rounded-xl p-5">
                                <p className="text-sm text-blue-600 mb-1">Total Students</p>
                                <p className="text-3xl font-bold text-blue-900">{stats.students.total}</p>
                                <p className="text-xs text-blue-500 mt-1">{stats.students.verified} verified</p>
                            </div>
                            <div className="bg-purple-50 rounded-xl p-5">
                                <p className="text-sm text-purple-600 mb-1">Total Merchants</p>
                                <p className="text-3xl font-bold text-purple-900">{stats.merchants.total}</p>
                                <p className="text-xs text-purple-500 mt-1">{stats.merchants.approved} approved</p>
                            </div>
                            <div className="bg-orange-50 rounded-xl p-5">
                                <p className="text-sm text-orange-600 mb-1">Total Offers</p>
                                <p className="text-3xl font-bold text-orange-900">{stats.offers.total}</p>
                                <p className="text-xs text-orange-500 mt-1">{stats.offers.active} active</p>
                            </div>
                            <div className="bg-green-50 rounded-xl p-5">
                                <p className="text-sm text-green-600 mb-1">Total Savings</p>
                                <p className="text-3xl font-bold text-green-900">₹{(stats.transactions.totalSavings / 1000).toFixed(1)}K</p>
                                <p className="text-xs text-green-500 mt-1">Generated for students</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* MERCHANTS TAB */}
                {activeTab === 'merchants' && (
                    <motion.div
                        key="merchants"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* Top Performing Merchants */}
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                                        <Award className="h-5 w-5 text-yellow-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">Top Performing Merchants</h3>
                                        <p className="text-xs text-gray-500">Ranked by transaction volume</p>
                                    </div>
                                </div>
                                <Link href="/admin/dashboard/merchants" className="text-sm text-purple-600 font-semibold hover:underline flex items-center gap-1">
                                    View all <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Rank</th>
                                            <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Merchant</th>
                                            <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">City</th>
                                            <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Category</th>
                                            <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Transactions</th>
                                            <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Revenue</th>
                                            <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Rating</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {topMerchants.map((merchant, index) => (
                                            <tr key={merchant.merchantId} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-5 py-4">
                                                    <span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                        index === 1 ? 'bg-gray-100 text-gray-600' :
                                                            index === 2 ? 'bg-orange-100 text-orange-700' :
                                                                'bg-gray-50 text-gray-500'
                                                        }`}>
                                                        {index + 1}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="font-semibold text-gray-900">{merchant.businessName}</span>
                                                </td>
                                                <td className="px-5 py-4 text-gray-500 text-sm">{merchant.city}</td>
                                                <td className="px-5 py-4">
                                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-lg text-gray-600">{merchant.category}</span>
                                                </td>
                                                <td className="px-5 py-4 text-right font-semibold text-gray-900">{merchant.transactionCount}</td>
                                                <td className="px-5 py-4 text-right font-semibold text-green-600">₹{merchant.revenue.toLocaleString()}</td>
                                                <td className="px-5 py-4 text-right">
                                                    <span className="flex items-center justify-end gap-1 text-sm">
                                                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                        {merchant.avgRating.toFixed(1)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {topMerchants.length === 0 && (
                                    <div className="text-center py-12 text-gray-500">
                                        No merchant data available yet
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Merchant Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl p-5 border border-gray-100">
                                <p className="text-sm text-gray-500 mb-1">Total Merchants</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.merchants.total}</p>
                            </div>
                            <div className="bg-white rounded-xl p-5 border border-gray-100">
                                <p className="text-sm text-gray-500 mb-1">Approved</p>
                                <p className="text-3xl font-bold text-green-600">{stats.merchants.approved}</p>
                            </div>
                            <div className="bg-white rounded-xl p-5 border border-gray-100">
                                <p className="text-sm text-gray-500 mb-1">Pending</p>
                                <p className="text-3xl font-bold text-yellow-600">{stats.merchants.pending}</p>
                            </div>
                            <div className="bg-white rounded-xl p-5 border border-gray-100">
                                <p className="text-sm text-gray-500 mb-1">Rejected</p>
                                <p className="text-3xl font-bold text-red-600">{stats.merchants.rejected}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
