"use client";

import { TrendingUp, Search, ArrowLeft, Filter, Calendar, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

// Mock transactions data
const ALL_TRANSACTIONS = [
    { id: 1, studentBbId: "BB-536339", studentName: "Rahul Kumar", merchantBbmId: "BBM-183945", merchantName: "Starbucks", offer: "Buy 1 Get 1", amount: 150, date: "2024-12-11T10:30:00" },
    { id: 2, studentBbId: "BB-428751", studentName: "Priya Sharma", merchantBbmId: "BBM-482910", merchantName: "Cafe Delights", offer: "15% off", amount: 45, date: "2024-12-11T09:15:00" },
    { id: 3, studentBbId: "BB-756231", studentName: "Vikram Singh", merchantBbmId: "BBM-629173", merchantName: "Nike Store", offer: "20% Student Special", amount: 580, date: "2024-12-11T08:45:00" },
    { id: 4, studentBbId: "BB-617892", studentName: "Amit Patel", merchantBbmId: "BBM-183945", merchantName: "Starbucks", offer: "₹100 off Premium", amount: 100, date: "2024-12-10T16:20:00" },
    { id: 5, studentBbId: "BB-536339", studentName: "Rahul Kumar", merchantBbmId: "BBM-629173", merchantName: "Nike Store", offer: "30% on Shoes", amount: 890, date: "2024-12-10T14:10:00" },
    { id: 6, studentBbId: "BB-629173", studentName: "Meera Nair", merchantBbmId: "BBM-482910", merchantName: "Cafe Delights", offer: "Free Dessert", amount: 0, date: "2024-12-10T12:00:00" },
    { id: 7, studentBbId: "BB-482910", studentName: "Ravi Shankar", merchantBbmId: "BBM-183945", merchantName: "Starbucks", offer: "Buy 1 Get 1", amount: 200, date: "2024-12-09T18:30:00" },
    { id: 8, studentBbId: "BB-293847", studentName: "Neha Gupta", merchantBbmId: "BBM-482910", merchantName: "Cafe Delights", offer: "₹50 off", amount: 50, date: "2024-12-09T11:45:00" },
];

export default function TransactionsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [studentIdSearch, setStudentIdSearch] = useState("");
    const [merchantIdSearch, setMerchantIdSearch] = useState("");
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

    // Get today's date for filtering
    const today = new Date();
    const isToday = (date: string) => new Date(date).toDateString() === today.toDateString();
    const isThisWeek = (date: string) => {
        const txDate = new Date(date);
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return txDate >= weekAgo;
    };
    const isThisMonth = (date: string) => {
        const txDate = new Date(date);
        return txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
    };

    // Filter transactions
    const filteredTransactions = ALL_TRANSACTIONS.filter(t => {
        const matchesSearch = t.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.offer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStudentId = studentIdSearch === "" || t.studentBbId.toLowerCase().includes(("bb-" + studentIdSearch).toLowerCase());
        const matchesMerchantId = merchantIdSearch === "" || t.merchantBbmId.toLowerCase().includes(("bbm-" + merchantIdSearch).toLowerCase());
        const matchesDate = dateFilter === 'all' ||
            (dateFilter === 'today' && isToday(t.date)) ||
            (dateFilter === 'week' && isThisWeek(t.date)) ||
            (dateFilter === 'month' && isThisMonth(t.date));
        return matchesSearch && matchesStudentId && matchesMerchantId && matchesDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Newest first

    // Calculate totals
    const totalToday = ALL_TRANSACTIONS.filter(t => isToday(t.date)).reduce((sum, t) => sum + t.amount, 0);
    const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className="min-h-screen bg-white pb-32 pt-12">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100">
                <div className="px-4 h-14 flex items-center gap-3">
                    <Link href="/admin/dashboard">
                        <button className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="font-extrabold text-lg">Transactions</h1>
                        <p className="text-xs text-gray-500">{ALL_TRANSACTIONS.length} redemptions</p>
                    </div>
                </div>
            </header>

            <main className="px-4 pt-4 space-y-4">
                {/* Today's Stats */}
                <div className="bg-gradient-to-r from-primary to-emerald-500 rounded-2xl p-5 text-white">
                    <div className="flex items-center gap-3 mb-3">
                        <TrendingUp className="h-6 w-6" />
                        <span className="text-sm font-medium opacity-80">Today's Savings</span>
                    </div>
                    <p className="text-3xl font-extrabold">₹{totalToday.toLocaleString()}</p>
                    <p className="text-sm opacity-80 mt-1">{ALL_TRANSACTIONS.filter(t => isToday(t.date)).length} redemptions today</p>
                </div>

                {/* ID Searches */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Student ID */}
                    <div className="bg-blue-50 rounded-xl p-3">
                        <label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">Student ID</label>
                        <div className="flex items-center bg-white rounded-lg border border-blue-200 overflow-hidden">
                            <span className="px-2 text-blue-600 font-mono text-xs font-bold">BB-</span>
                            <input
                                type="text"
                                value={studentIdSearch}
                                onChange={(e) => setStudentIdSearch(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="ID"
                                className="flex-1 h-9 px-1 text-xs font-mono outline-none w-full"
                                maxLength={6}
                            />
                        </div>
                    </div>

                    {/* Merchant ID */}
                    <div className="bg-primary/5 rounded-xl p-3">
                        <label className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-1">Merchant ID</label>
                        <div className="flex items-center bg-white rounded-lg border border-primary/20 overflow-hidden">
                            <span className="px-2 text-primary font-mono text-xs font-bold">BBM-</span>
                            <input
                                type="text"
                                value={merchantIdSearch}
                                onChange={(e) => setMerchantIdSearch(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="ID"
                                className="flex-1 h-9 px-1 text-xs font-mono outline-none w-full"
                                maxLength={6}
                            />
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search transactions..."
                        className="w-full h-12 bg-gray-100 rounded-xl pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>

                {/* Date Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                    {(['all', 'today', 'week', 'month'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setDateFilter(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${dateFilter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                            {f === 'all' ? 'All Time' : f === 'today' ? '📅 Today' : f === 'week' ? '📆 This Week' : '🗓 This Month'}
                        </button>
                    ))}
                </div>

                {/* Filtered Stats */}
                <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500">Filtered Results</p>
                        <p className="text-lg font-bold">{filteredTransactions.length} transactions</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500">Total Saved</p>
                        <p className="text-lg font-bold text-primary">₹{totalAmount.toLocaleString()}</p>
                    </div>
                </div>

                {/* Transactions List */}
                <div className="space-y-2">
                    {filteredTransactions.map((tx, index) => (
                        <motion.div
                            key={tx.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="bg-gray-50 rounded-xl p-4"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">
                                        {tx.studentBbId}
                                    </span>
                                    <span className="font-semibold text-sm">{tx.studentName}</span>
                                </div>
                                <span className="text-primary font-bold">₹{tx.amount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-600">{tx.offer}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">
                                            {tx.merchantBbmId}
                                        </span>
                                        <span className="text-xs text-gray-500">{tx.merchantName}</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400">
                                    {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    {' '}
                                    {new Date(tx.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </motion.div>
                    ))}

                    {filteredTransactions.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p className="text-sm">No transactions found</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
