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
import { analyticsService, TopMerchant, CityDistribution, CategoryPerformance, DashboardStats } from "@/lib/services/analytics.service";
import { Merchant } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function AdminDashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    // Data State
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [pendingMerchants, setPendingMerchants] = useState<Merchant[]>([]);
    const [topMerchants, setTopMerchants] = useState<TopMerchant[]>([]);
    const [cityDistribution, setCityDistribution] = useState<CityDistribution[]>([]);
    const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformance[]>([]);

    const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'merchants'>('overview');
    const [dateRange, setDateRange] = useState('7');

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);

                // Parallel Data Fetching
                const [
                    dashboardStats,
                    pendingResult,
                    topMerchantsData,
                    cityData,
                    categoryData
                ] = await Promise.all([
                    analyticsService.getDashboardStats(),
                    merchantService.getAll({ status: 'pending' }),
                    analyticsService.getTopMerchants(10),
                    analyticsService.getCityDistribution(),
                    analyticsService.getCategoryPerformance()
                ]);

                setStats(dashboardStats);

                if (pendingResult.success && pendingResult.data) {
                    setPendingMerchants(pendingResult.data.slice(0, 5));
                }

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

    // Helpers
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-8 pb-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
                    <p className="text-gray-400 mt-1">Real-time overview of the Backbenchers ecosystem</p>
                </div>

                <div className="flex items-center gap-3 bg-gray-900/50 p-1 rounded-xl border border-gray-800">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-transparent text-sm text-white font-medium px-3 py-1.5 outline-none cursor-pointer"
                    >
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="365">This Year</option>
                    </select>
                </div>
            </div>

            {/* Main Content Tabs */}
            <div className="space-y-6">
                {/* Custom Tab Switcher */}
                <div className="flex p-1 bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 w-fit">
                    {[
                        { id: 'overview', label: 'Overview', icon: BarChart3 },
                        { id: 'analytics', label: 'Analytics', icon: PieChart },
                        { id: 'merchants', label: 'Merchants', icon: Store }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                activeTab === tab.id
                                    ? "bg-primary text-black shadow-lg shadow-primary/20"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            {/* Hero Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatsCard
                                    label="Total Revenue"
                                    value={stats ? formatCurrency(stats.totalRevenue) : null}
                                    subValue="+12.5% vs last period"
                                    icon={DollarSign}
                                    color="green"
                                    loading={loading}
                                />
                                <StatsCard
                                    label="Student Savings"
                                    value={stats ? formatCurrency(stats.totalSavings) : null}
                                    subValue={`${stats?.totalTransactions} transactions`}
                                    icon={PiggyBank}
                                    color="blue"
                                    loading={loading}
                                />
                                <StatsCard
                                    label="Active Students"
                                    value={stats ? stats.totalStudents.toLocaleString() : null}
                                    subValue={`${stats?.verifiedStudents} verified`}
                                    icon={Users}
                                    color="purple"
                                    loading={loading}
                                />
                                <StatsCard
                                    label="Today's Activity"
                                    value={stats ? stats.todayTransactions.toString() : null}
                                    subValue="Redemptions today"
                                    icon={Activity}
                                    color="orange"
                                    loading={loading}
                                />
                            </div>

                            {/* Alert Section (Only if needed) */}
                            {(!loading && (pendingMerchants.length > 0 || (stats?.pendingStudents || 0) > 0)) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {pendingMerchants.length > 0 && (
                                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-500">
                                                    <Store className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-yellow-500">Pending Merchants</h3>
                                                    <p className="text-xs text-yellow-500/80">{pendingMerchants.length} requests waiting review</p>
                                                </div>
                                            </div>
                                            <Link href="/admin/dashboard/merchants">
                                                <button className="bg-yellow-500 text-black text-xs font-bold px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors">
                                                    Review
                                                </button>
                                            </Link>
                                        </div>
                                    )}
                                    {(stats?.pendingStudents || 0) > 0 && (
                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-500">
                                                    <Users className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-blue-500">Pending Students</h3>
                                                    <p className="text-xs text-blue-500/80">{stats?.pendingStudents} ID cards waiting</p>
                                                </div>
                                            </div>
                                            <Link href="/admin/dashboard/students">
                                                <button className="bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                                                    Verify
                                                </button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Secondary Stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <MiniStatCard
                                    label="Verified Students"
                                    value={stats?.verifiedStudents}
                                    total={stats?.totalStudents}
                                    icon={UserCheck}
                                    color="blue"
                                    loading={loading}
                                />
                                <MiniStatCard
                                    label="Active Merchants"
                                    value={stats?.approvedMerchants}
                                    total={stats?.totalMerchants}
                                    icon={Store}
                                    color="purple"
                                    loading={loading}
                                />
                                <MiniStatCard
                                    label="Live Offers"
                                    value={stats?.activeOffers}
                                    total={stats?.totalOffers}
                                    icon={Tag}
                                    color="orange"
                                    loading={loading}
                                />
                                <MiniStatCard
                                    label="Transactions"
                                    value={stats?.totalTransactions}
                                    subLabel="Lifetime"
                                    icon={Wallet}
                                    color="green"
                                    loading={loading}
                                />
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'analytics' && (
                        <motion.div
                            key="analytics"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* City Distribution */}
                                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                                    <div className="p-5 border-b border-gray-800">
                                        <h3 className="font-bold text-white flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-primary" />
                                            Geographic Distribution
                                        </h3>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        {loading ? (
                                            [1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full bg-gray-800" />)
                                        ) : cityDistribution.length > 0 ? (
                                            cityDistribution.slice(0, 6).map((item, idx) => (
                                                <div key={item.city} className="flex items-center gap-4">
                                                    <span className="text-xs font-mono text-gray-500 w-4">0{idx + 1}</span>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between text-sm mb-1.5">
                                                            <span className="text-white font-medium">{item.city}</span>
                                                            <span className="text-gray-400 text-xs">{item.studentsCount} students</span>
                                                        </div>
                                                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary"
                                                                style={{ width: `${(item.studentsCount / (stats?.totalStudents || 1)) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-10 text-gray-500">No geo data available</div>
                                        )}
                                    </div>
                                </div>

                                {/* Category Performance */}
                                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                                    <div className="p-5 border-b border-gray-800">
                                        <h3 className="font-bold text-white flex items-center gap-2">
                                            <PieChart className="h-4 w-4 text-orange-500" />
                                            Category Performance
                                        </h3>
                                    </div>
                                    <div className="p-5 grid gap-4">
                                        {loading ? (
                                            [1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full bg-gray-800" />)
                                        ) : categoryPerformance.length > 0 ? (
                                            categoryPerformance.slice(0, 4).map((cat) => (
                                                <div key={cat.category} className="bg-gray-800/50 p-4 rounded-xl flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-bold text-white text-sm">{cat.category}</h4>
                                                        <p className="text-xs text-gray-400 mt-1">{cat.transactionsCount} transactions</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-mono text-green-400 font-bold">{formatCurrency(cat.revenue)}</p>
                                                        <p className="text-xs text-gray-500">Revenue</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-10 text-gray-500">No category data available</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'merchants' && (
                        <motion.div
                            key="merchants"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                                <div className="p-5 border-b border-gray-800 flex justify-between items-center">
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        <Award className="h-4 w-4 text-yellow-500" />
                                        Leaderboard
                                    </h3>
                                    <Link href="/admin/dashboard/merchants" className="text-xs text-primary hover:underline">
                                        View All Merchants
                                    </Link>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-800/50 text-gray-400 font-medium">
                                            <tr>
                                                <th className="px-6 py-3">Rank</th>
                                                <th className="px-6 py-3">Merchant</th>
                                                <th className="px-6 py-3">City</th>
                                                <th className="px-6 py-3 text-right">Revenue</th>
                                                <th className="px-6 py-3 text-right">Rating</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {loading ? (
                                                [1, 2, 3, 4, 5].map(i => (
                                                    <tr key={i}>
                                                        <td colSpan={5} className="px-6 py-4"><Skeleton className="h-8 w-full bg-gray-800" /></td>
                                                    </tr>
                                                ))
                                            ) : topMerchants.length > 0 ? (
                                                topMerchants.map((m, idx) => (
                                                    <tr key={m.merchantId} className="hover:bg-gray-800/30 transition-colors">
                                                        <td className="px-6 py-4 font-mono text-gray-500">#{idx + 1}</td>
                                                        <td className="px-6 py-4 font-medium text-white">{m.businessName}</td>
                                                        <td className="px-6 py-4 text-gray-400">{m.city}</td>
                                                        <td className="px-6 py-4 text-right text-green-400 font-mono">{formatCurrency(m.revenue)}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="inline-flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded text-xs font-bold">
                                                                {m.avgRating.toFixed(1)} <Star className="h-3 w-3 fill-current" />
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No data found</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Stats Card Components
function StatsCard({ label, value, subValue, icon: Icon, color, loading }: any) {
    const colorStyles = {
        green: "from-green-500/20 to-emerald-500/5 border-green-500/20 text-green-500",
        blue: "from-blue-500/20 to-indigo-500/5 border-blue-500/20 text-blue-500",
        purple: "from-purple-500/20 to-pink-500/5 border-purple-500/20 text-purple-500",
        orange: "from-orange-500/20 to-red-500/5 border-orange-500/20 text-orange-500",
    };

    return (
        <div className={cn(
            "relative overflow-hidden rounded-2xl p-6 border bg-gradient-to-br backdrop-blur-xl transition-all hover:scale-[1.02]",
            // @ts-ignore
            colorStyles[color] || colorStyles.green
        )}>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={cn("p-3 rounded-xl bg-white/5")}>
                        <Icon className="h-6 w-6" />
                    </div>
                    {/* Decorative trend indicator could go here */}
                </div>
                <div>
                    <p className="text-sm font-medium opacity-70 mb-1">{label}</p>
                    {loading ? (
                        <Skeleton className="h-8 w-24 bg-white/10 mb-2" />
                    ) : (
                        <h3 className="text-3xl font-bold tracking-tight text-white mb-1">{value || '0'}</h3>
                    )}
                    <p className="text-xs opacity-50">{subValue}</p>
                </div>
            </div>
        </div>
    );
}

function MiniStatCard({ label, value, total, subLabel, icon: Icon, color, loading }: any) {
    return (
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl hover:border-gray-700 transition-colors">
            <div className="flex items-center gap-3 mb-3">
                <Icon className={cn("h-4 w-4",
                    color === 'blue' ? "text-blue-500" :
                        color === 'purple' ? "text-purple-500" :
                            color === 'orange' ? "text-orange-500" : "text-green-500"
                )} />
                <span className="text-sm text-gray-400 font-medium">{label}</span>
            </div>
            {loading ? (
                <Skeleton className="h-8 w-20 bg-gray-800" />
            ) : (
                <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-white">{value?.toLocaleString() || '0'}</span>
                    <span className="text-xs text-gray-500 mb-1">
                        {subLabel || (total ? `${Math.round(((value || 0) / total) * 100)}%` : '')}
                    </span>
                </div>
            )}
            {total && !loading && (
                <div className="h-1 bg-gray-800 rounded-full mt-3 overflow-hidden">
                    <div
                        className={cn("h-full rounded-full",
                            color === 'blue' ? "bg-blue-500" :
                                color === 'purple' ? "bg-purple-500" :
                                    color === 'orange' ? "bg-orange-500" : "bg-green-500"
                        )}
                        style={{ width: `${Math.min(((value || 0) / total) * 100, 100)}%` }}
                    />
                </div>
            )}
        </div>
    );
}
