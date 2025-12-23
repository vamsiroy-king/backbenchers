"use client";

import { TrendingUp, Search, ArrowLeft, Loader2, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { transactionService } from "@/lib/services/transaction.service";
import { Transaction } from "@/lib/types";

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [studentIdSearch, setStudentIdSearch] = useState("");
    const [merchantIdSearch, setMerchantIdSearch] = useState("");
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
    const [customDate, setCustomDate] = useState("");

    // Fetch real transactions from Supabase
    useEffect(() => {
        async function fetchTransactions() {
            try {
                setLoading(true);
                const result = await transactionService.getAll();
                if (result.success && result.data) {
                    setTransactions(result.data);
                }
            } catch (error) {
                console.error("Error fetching transactions:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchTransactions();
    }, []);

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
    const isCustomDate = (date: string) => {
        if (!customDate) return true;
        return new Date(date).toDateString() === new Date(customDate).toDateString();
    };

    // Filter transactions
    const filteredTransactions = transactions.filter(t => {
        const matchesSearch =
            (t.studentName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (t.merchantName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (t.offerTitle?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const matchesStudentId = studentIdSearch === "" ||
            (t.studentBbId?.toLowerCase() || '').includes(("bb-" + studentIdSearch).toLowerCase());
        const matchesMerchantId = merchantIdSearch === "" ||
            (t.merchantBbmId?.toLowerCase() || '').includes(("bbm-" + merchantIdSearch).toLowerCase());

        let matchesDate = true;
        if (customDate) {
            matchesDate = isCustomDate(t.redeemedAt);
        } else {
            matchesDate = dateFilter === 'all' ||
                (dateFilter === 'today' && isToday(t.redeemedAt)) ||
                (dateFilter === 'week' && isThisWeek(t.redeemedAt)) ||
                (dateFilter === 'month' && isThisMonth(t.redeemedAt));
        }

        return matchesSearch && matchesStudentId && matchesMerchantId && matchesDate;
    }).sort((a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime());

    // Calculate totals
    const totalToday = transactions.filter(t => isToday(t.redeemedAt)).reduce((sum, t) => sum + (t.discountAmount || 0), 0);
    const redemptionsToday = transactions.filter(t => isToday(t.redeemedAt)).length;
    const totalAmount = filteredTransactions.reduce((sum, t) => sum + (t.discountAmount || 0), 0);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/admin/dashboard">
                        <button className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <TrendingUp className="h-7 w-7 text-primary" />
                            Transactions
                        </h1>
                        <p className="text-sm text-gray-500">{transactions.length} total redemptions</p>
                    </div>
                </div>
            </div>

            {/* Today's Stats */}
            <div className="bg-gradient-to-r from-primary to-emerald-500 rounded-2xl p-5 text-white">
                <div className="flex items-center gap-3 mb-3">
                    <TrendingUp className="h-6 w-6" />
                    <span className="text-sm font-medium opacity-80">Today's Savings</span>
                </div>
                <p className="text-3xl font-extrabold">₹{totalToday.toLocaleString()}</p>
                <p className="text-sm opacity-80 mt-1">{redemptionsToday} redemptions today</p>
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

            {/* Search and Date Picker */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search transactions..."
                        className="w-full h-12 bg-gray-100 rounded-xl pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>
                {/* Calendar Date Picker */}
                <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    <input
                        type="date"
                        value={customDate}
                        onChange={(e) => {
                            setCustomDate(e.target.value);
                            if (e.target.value) setDateFilter('all'); // Reset date filter when custom date selected
                        }}
                        className="h-12 pl-10 pr-3 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>
            </div>

            {/* Date Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                {(['all', 'today', 'week', 'month'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => { setDateFilter(f); setCustomDate(""); }}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${dateFilter === f && !customDate ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
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
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Merchant</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Offer</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Saved</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredTransactions.map((tx) => (
                                <motion.tr
                                    key={tx.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-4 py-4">
                                        <div>
                                            <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">
                                                {tx.studentBbId || 'N/A'}
                                            </span>
                                            <p className="font-medium text-sm mt-1">{tx.studentName || 'Student'}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div>
                                            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">
                                                {tx.merchantBbmId || 'N/A'}
                                            </span>
                                            <p className="text-sm text-gray-600 mt-1">{tx.merchantName || 'Merchant'}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="text-sm text-gray-700">{tx.offerTitle || 'Offer'}</p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-primary font-bold">₹{tx.discountAmount || 0}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="text-xs text-gray-500">
                                            {new Date(tx.redeemedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                        <p className="text-[10px] text-gray-400">
                                            {new Date(tx.redeemedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredTransactions.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p className="text-sm">No transactions found</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
