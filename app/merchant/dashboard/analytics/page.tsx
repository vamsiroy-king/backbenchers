"use client";

import { TrendingUp, TrendingDown, Users, Tag, IndianRupee, Calendar, ChevronDown } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

// Mock analytics data
const PERIOD_STATS = {
    today: { redemptions: 23, revenue: 8200, discount: 1640, students: 21 },
    week: { redemptions: 156, revenue: 52400, discount: 10480, students: 132 },
    month: { redemptions: 543, revenue: 182500, discount: 36500, students: 412 },
};

const POPULAR_OFFERS = [
    { name: "20% OFF Lunch", redemptions: 234, percentage: 45 },
    { name: "Buy 1 Get 1 Coffee", redemptions: 189, percentage: 36 },
    { name: "15% Weekend Deal", redemptions: 98, percentage: 19 },
];

const PEAK_HOURS = [
    { hour: "12PM", value: 85 },
    { hour: "1PM", value: 95 },
    { hour: "2PM", value: 70 },
    { hour: "6PM", value: 60 },
    { hour: "7PM", value: 80 },
    { hour: "8PM", value: 90 },
];

const COLLEGE_STATS = [
    { name: "IIT Bengaluru", students: 145, percentage: 35 },
    { name: "Christ University", students: 98, percentage: 24 },
    { name: "PES University", students: 87, percentage: 21 },
    { name: "Others", students: 82, percentage: 20 },
];

export default function AnalyticsPage() {
    const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');
    const stats = PERIOD_STATS[period];

    return (
        <div className="min-h-screen bg-white pb-32 pt-12">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100">
                <div className="px-4 h-14 flex items-center justify-between">
                    <h1 className="font-extrabold text-xl">Analytics</h1>
                    <button className="flex items-center gap-1 bg-gray-100 px-3 py-2 rounded-xl text-sm font-medium">
                        Export <ChevronDown className="h-4 w-4" />
                    </button>
                </div>
            </header>

            <main className="px-4 pt-6 space-y-6">
                {/* Period Selector */}
                <div className="flex bg-gray-100 rounded-2xl p-1.5">
                    {(['today', 'week', 'month'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${period === p ? 'bg-white shadow-md' : 'text-gray-500'
                                }`}
                        >
                            {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
                        </button>
                    ))}
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3">
                    <motion.div
                        key={`redemptions-${period}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Tag className="h-5 w-5 text-primary" />
                            <span className="text-xs text-primary font-semibold flex items-center">
                                <TrendingUp className="h-3 w-3 mr-1" /> +12%
                            </span>
                        </div>
                        <p className="text-2xl font-extrabold">{stats.redemptions}</p>
                        <p className="text-xs text-gray-500">Redemptions</p>
                    </motion.div>

                    <motion.div
                        key={`revenue-${period}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <IndianRupee className="h-5 w-5 text-blue-500" />
                            <span className="text-xs text-primary font-semibold flex items-center">
                                <TrendingUp className="h-3 w-3 mr-1" /> +8%
                            </span>
                        </div>
                        <p className="text-2xl font-extrabold">₹{(stats.revenue / 1000).toFixed(1)}K</p>
                        <p className="text-xs text-gray-500">Bill Value</p>
                    </motion.div>

                    <motion.div
                        key={`discount-${period}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-lg">💸</span>
                        </div>
                        <p className="text-2xl font-extrabold">₹{(stats.discount / 1000).toFixed(1)}K</p>
                        <p className="text-xs text-gray-500">Discount Given</p>
                    </motion.div>

                    <motion.div
                        key={`students-${period}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Users className="h-5 w-5 text-purple-500" />
                        </div>
                        <p className="text-2xl font-extrabold">{stats.students}</p>
                        <p className="text-xs text-gray-500">Unique Students</p>
                    </motion.div>
                </div>

                {/* Popular Offers */}
                <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
                    <h3 className="font-bold text-sm">Popular Offers</h3>
                    {POPULAR_OFFERS.map((offer, index) => (
                        <div key={index} className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">{offer.name}</span>
                                <span className="text-gray-500">{offer.redemptions} uses</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${offer.percentage}%` }}
                                    transition={{ delay: index * 0.1, duration: 0.5 }}
                                    className="h-full bg-primary rounded-full"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Peak Hours */}
                <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
                    <h3 className="font-bold text-sm">Peak Hours</h3>
                    <div className="flex items-end justify-between h-32 gap-2">
                        {PEAK_HOURS.map((hour, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${hour.value}%` }}
                                    transition={{ delay: index * 0.1, duration: 0.5 }}
                                    className={`w-full rounded-t-lg ${hour.value >= 90 ? 'bg-primary' : 'bg-primary/40'}`}
                                />
                                <span className="text-[10px] text-gray-500 mt-2">{hour.hour}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* College Demographics */}
                <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
                    <h3 className="font-bold text-sm">Student Demographics</h3>
                    <div className="space-y-3">
                        {COLLEGE_STATS.map((college, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                    <span className="text-sm">🎓</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-sm">{college.name}</p>
                                    <p className="text-xs text-gray-500">{college.students} students</p>
                                </div>
                                <span className="text-sm font-bold text-primary">{college.percentage}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Insights */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-purple-50 rounded-2xl p-4">
                        <p className="text-xs text-purple-600 font-semibold mb-1">Most Popular</p>
                        <p className="font-bold text-sm">20% OFF Lunch</p>
                        <p className="text-xs text-gray-500">234 redemptions</p>
                    </div>
                    <div className="bg-blue-50 rounded-2xl p-4">
                        <p className="text-xs text-blue-600 font-semibold mb-1">Avg. Discount</p>
                        <p className="font-bold text-sm">₹67</p>
                        <p className="text-xs text-gray-500">per transaction</p>
                    </div>
                    <div className="bg-green-50 rounded-2xl p-4">
                        <p className="text-xs text-green-600 font-semibold mb-1">Repeat Rate</p>
                        <p className="font-bold text-sm">34%</p>
                        <p className="text-xs text-gray-500">return customers</p>
                    </div>
                    <div className="bg-orange-50 rounded-2xl p-4">
                        <p className="text-xs text-orange-600 font-semibold mb-1">Growth</p>
                        <p className="font-bold text-sm flex items-center">
                            +18% <TrendingUp className="h-4 w-4 ml-1" />
                        </p>
                        <p className="text-xs text-gray-500">vs last period</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
