"use client";

import { TrendingUp, Tag, IndianRupee, ChevronDown, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { transactionService } from "@/lib/services/transaction.service";
import { merchantService } from "@/lib/services/merchant.service";
import { Transaction } from "@/lib/types";

export default function AnalyticsPage() {
    const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [merchantId, setMerchantId] = useState<string | null>(null);

    // Fetch merchant and transactions
    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);

                // Get current merchant
                const merchantResult = await merchantService.getMyProfile();
                if (merchantResult.success && merchantResult.data) {
                    setMerchantId(merchantResult.data.id);

                    // Fetch transactions for this merchant
                    const txResult = await transactionService.getMerchantTransactions(merchantResult.data.id, 100);
                    if (txResult.success && txResult.data) {
                        setTransactions(txResult.data);
                    }
                }
            } catch (error) {
                console.error("Error fetching analytics:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // Filter transactions by period
    const today = new Date();
    const filterByPeriod = (txs: Transaction[]) => {
        return txs.filter(tx => {
            const txDate = new Date(tx.redeemedAt);
            if (period === 'today') {
                return txDate.toDateString() === today.toDateString();
            } else if (period === 'week') {
                const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                return txDate >= weekAgo;
            } else {
                return txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
            }
        });
    };

    const periodTxs = filterByPeriod(transactions);
    const stats = {
        redemptions: periodTxs.length,
        revenue: periodTxs.reduce((sum, tx) => sum + (tx.originalAmount || 0), 0),
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black pb-32">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
                <div className="px-4 h-14 flex items-center justify-between">
                    <h1 className="font-extrabold text-xl dark:text-white">Analytics</h1>
                    <button className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-xl text-sm font-medium dark:text-gray-200">
                        Export <ChevronDown className="h-4 w-4" />
                    </button>
                </div>
            </header>

            <main className="px-4 pt-6 space-y-6">
                {/* Period Selector */}
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1.5">
                    {(['today', 'week', 'month'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${period === p
                                ? 'bg-white dark:bg-gray-700 shadow-md dark:text-white'
                                : 'text-gray-500 dark:text-gray-400'
                                }`}
                        >
                            {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
                        </button>
                    ))}
                </div>

                {/* Key Metrics - Only Basic Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <motion.div
                        key={`redemptions-${period}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Tag className="h-5 w-5 text-primary" />
                            <span className="text-xs text-primary font-semibold flex items-center">
                                <TrendingUp className="h-3 w-3 mr-1" />
                            </span>
                        </div>
                        <p className="text-2xl font-extrabold dark:text-white">{stats.redemptions}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Redemptions</p>
                    </motion.div>

                    <motion.div
                        key={`revenue-${period}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <IndianRupee className="h-5 w-5 text-blue-500" />
                        </div>
                        <p className="text-2xl font-extrabold dark:text-white">₹{stats.revenue.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Bill Value</p>
                    </motion.div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 space-y-4">
                    <h3 className="font-bold text-sm dark:text-white">Recent Transactions</h3>
                    {periodTxs.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                            No transactions for this period
                        </p>
                    ) : (
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                            {periodTxs.slice(0, 10).map((tx, index) => (
                                <motion.div
                                    key={tx.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white dark:bg-gray-800 rounded-xl p-3 flex items-center justify-between"
                                >
                                    <div>
                                        <p className="font-semibold text-sm dark:text-white">
                                            {tx.studentName || 'Student'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {tx.offerTitle} • {new Date(tx.redeemedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </p>
                                    </div>
                                    <span className="text-primary font-bold">₹{tx.discountAmount || 0}</span>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info Note */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                        💡 Advanced analytics like student demographics, repeat rates, and growth metrics are available in your Backbenchers Partner Dashboard.
                    </p>
                </div>
            </main>
        </div>
    );
}
