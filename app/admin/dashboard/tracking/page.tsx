"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Copy, ExternalLink, CheckCircle, TrendingUp, RefreshCw, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface TrackingStats {
    total: number;
    revealed: number;
    copied: number;
    clicked: number;
    redeemed: number;
}

interface RedemptionRecord {
    id: string;
    student_id: string;
    offer_id: string;
    brand_id: string;
    code_used: string;
    revealed_at: string;
    copied_at: string | null;
    clicked_through_at: string | null;
    redeemed_at: string | null;
    status: string;
    source: string;
    device_type: string;
    students?: { name: string; email: string; college: string };
    online_offers?: { title: string; code: string };
    online_brands?: { name: string; logo_url: string };
}

export default function TrackingDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<TrackingStats | null>(null);
    const [redemptions, setRedemptions] = useState<RedemptionRecord[]>([]);
    const [filter, setFilter] = useState<'all' | 'REVEALED' | 'COPIED' | 'CLICKED' | 'REDEEMED'>('all');

    useEffect(() => {
        loadData();
        // Auto-refresh every 30 seconds
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            const response = await fetch('/api/tracking');
            const result = await response.json();

            if (result.success) {
                setRedemptions(result.data.redemptions || []);
                setStats(result.data.stats || null);
            }
        } catch (error) {
            console.error('Failed to load tracking data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'REVEALED': return 'bg-blue-500/20 text-blue-400';
            case 'COPIED': return 'bg-yellow-500/20 text-yellow-400';
            case 'CLICKED': return 'bg-purple-500/20 text-purple-400';
            case 'REDEEMED': return 'bg-green-500/20 text-green-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'REVEALED': return <Eye className="h-3 w-3" />;
            case 'COPIED': return <Copy className="h-3 w-3" />;
            case 'CLICKED': return <ExternalLink className="h-3 w-3" />;
            case 'REDEEMED': return <CheckCircle className="h-3 w-3" />;
            default: return null;
        }
    };

    const filteredRedemptions = filter === 'all'
        ? redemptions
        : redemptions.filter(r => r.status === filter);

    const conversionRate = stats && stats.revealed > 0
        ? ((stats.redeemed / stats.revealed) * 100).toFixed(1)
        : '0';

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin/dashboard/online-brands">
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Coupon Tracking</h1>
                        <p className="text-muted-foreground text-sm">Real-time reveal & redemption analytics</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Eye className="h-4 w-4 text-blue-400" />
                        </div>
                        <span className="text-xs text-gray-500">Reveals</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats?.revealed || 0}</p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                            <Copy className="h-4 w-4 text-yellow-400" />
                        </div>
                        <span className="text-xs text-gray-500">Copies</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats?.copied || 0}</p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <ExternalLink className="h-4 w-4 text-purple-400" />
                        </div>
                        <span className="text-xs text-gray-500">Clicks</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats?.clicked || 0}</p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                        </div>
                        <span className="text-xs text-gray-500">Redeemed</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats?.redeemed || 0}</p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <TrendingUp className="h-4 w-4 text-emerald-400" />
                        </div>
                        <span className="text-xs text-gray-500">Conversion</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{conversionRate}%</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {['all', 'REVEALED', 'COPIED', 'CLICKED', 'REDEEMED'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === status
                                ? 'bg-green-500 text-black'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        {status === 'all' ? 'All' : status}
                        {status !== 'all' && (
                            <span className="ml-1 opacity-70">
                                ({status === 'REVEALED' ? stats?.revealed :
                                    status === 'COPIED' ? stats?.copied :
                                        status === 'CLICKED' ? stats?.clicked :
                                            stats?.redeemed || 0})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Activity Feed */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800">
                    <h2 className="font-semibold">Recent Activity</h2>
                    <p className="text-xs text-gray-500">Auto-refreshes every 30 seconds</p>
                </div>

                {filteredRedemptions.length === 0 ? (
                    <div className="p-12 text-center">
                        <Eye className="h-12 w-12 text-gray-700 mx-auto mb-3" />
                        <p className="text-gray-500">No tracking data yet</p>
                        <p className="text-xs text-gray-600 mt-1">Reveals will appear here in real-time</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-800">
                        {filteredRedemptions.map((record) => (
                            <div key={record.id} className="p-4 hover:bg-gray-800/50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 min-w-0">
                                        {/* Brand Logo */}
                                        <div className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {record.online_brands?.logo_url ? (
                                                <img
                                                    src={record.online_brands.logo_url}
                                                    alt=""
                                                    className="w-full h-full object-contain p-1"
                                                />
                                            ) : (
                                                <span className="text-xs font-bold text-gray-600">
                                                    {record.online_brands?.name?.[0] || '?'}
                                                </span>
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-medium text-white truncate">
                                                    {record.students?.name || 'Anonymous'}
                                                </span>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${getStatusColor(record.status)}`}>
                                                    {getStatusIcon(record.status)}
                                                    {record.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">
                                                {record.online_offers?.title || 'Offer'} • Code: <span className="font-mono text-gray-400">{record.code_used}</span>
                                            </p>
                                            <p className="text-[10px] text-gray-600 mt-1">
                                                {record.students?.email || 'No email'} • {record.students?.college || 'No college'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right flex-shrink-0">
                                        <p className="text-xs text-gray-500">
                                            {new Date(record.revealed_at).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                        <p className="text-[10px] text-gray-600 mt-1">
                                            {record.device_type} • {record.source}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Info Card */}
            <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-blue-400 mb-2">📊 About Tracking</h3>
                <ul className="text-xs text-gray-400 space-y-1">
                    <li><strong>Revealed:</strong> Student clicked "Reveal Code" and saw the coupon</li>
                    <li><strong>Copied:</strong> Student copied the code to clipboard</li>
                    <li><strong>Clicked:</strong> Student clicked "Go to Brand" button</li>
                    <li><strong>Redeemed:</strong> Student confirmed they used the code (self-reported)</li>
                </ul>
                <p className="text-[10px] text-gray-500 mt-3">
                    Note: Actual redemptions at brand apps (Swiggy, Zomato, etc.) cannot be automatically tracked.
                    Brands may share monthly reports for reconciliation.
                </p>
            </div>
        </div>
    );
}
