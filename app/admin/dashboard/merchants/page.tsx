"use client";

import { Store, Search, Check, Clock, X, Eye, Trash2, Loader2, Filter, Download, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { merchantService } from "@/lib/services/merchant.service";
import { Merchant } from "@/lib/types";
import { LOCATION_DATA } from "@/lib/services/student.service";

export default function MerchantsListPage() {
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedState, setSelectedState] = useState("All States");
    const [selectedCity, setSelectedCity] = useState("All Cities");
    const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        async function fetchMerchants() {
            setLoading(true);
            try {
                const result = await merchantService.getAll({
                    status: filter === 'all' ? undefined : filter,
                    state: selectedState === 'All States' ? undefined : selectedState,
                    city: selectedCity === 'All Cities' ? undefined : selectedCity,
                    search: searchQuery || undefined
                });

                if (result.success && result.data) {
                    setMerchants(result.data);
                }

                const statsData = await merchantService.getStats();
                setStats(statsData);
            } catch (error) {
                console.error('Error fetching merchants:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchMerchants();
    }, [filter, searchQuery, selectedState, selectedCity]);

    const availableCities = selectedState === "All States"
        ? ["All Cities"]
        : ["All Cities", ...(LOCATION_DATA.cities[selectedState] || [])];

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-700',
            approved: 'bg-green-100 text-green-700',
            rejected: 'bg-red-100 text-red-700'
        };
        const icons: Record<string, React.ReactNode> = {
            pending: <Clock className="h-3 w-3" />,
            approved: <Check className="h-3 w-3" />,
            rejected: <X className="h-3 w-3" />
        };
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
                {icons[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === merchants.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(merchants.map(m => m.id));
        }
    };

    const handleBulkApprove = async () => {
        setActionLoading('bulk');
        for (const id of selectedIds) {
            await merchantService.approve(id);
        }
        setSelectedIds([]);
        setActionLoading(null);
        // Refresh
        window.location.reload();
    };

    const handleBulkReject = async () => {
        setActionLoading('bulk');
        for (const id of selectedIds) {
            await merchantService.reject(id, 'Bulk rejected by admin');
        }
        setSelectedIds([]);
        setActionLoading(null);
        window.location.reload();
    };

    const handleQuickApprove = async (id: string) => {
        setActionLoading(id);
        await merchantService.approve(id);
        setMerchants(prev => prev.map(m => m.id === id ? { ...m, status: 'approved' } : m));
        setActionLoading(null);
    };

    const handleQuickReject = async (id: string) => {
        setActionLoading(id);
        await merchantService.reject(id, 'Rejected by admin');
        setMerchants(prev => prev.map(m => m.id === id ? { ...m, status: 'rejected' } : m));
        setActionLoading(null);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Store className="h-7 w-7 text-purple-500" />
                        Merchants
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Manage all merchant accounts and approvals</p>
                </div>
                <button className="h-10 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium flex items-center gap-2 transition-colors">
                    <Download className="h-4 w-4" /> Export CSV
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: stats.total, color: 'text-gray-900', bg: 'bg-gray-100' },
                    { label: 'Approved', value: stats.approved, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Pending', value: stats.pending, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                    { label: 'Rejected', value: stats.rejected, color: 'text-red-600', bg: 'bg-red-50' },
                ].map((stat) => (
                    <div key={stat.label} className={`${stat.bg} rounded-xl p-4`}>
                        <p className="text-sm text-gray-500">{stat.label}</p>
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Search */}
                    <div className="flex-1 min-w-[300px]">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, BBM-ID, or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-11 pl-12 pr-4 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as any)}
                        className="h-11 px-4 bg-gray-100 rounded-xl text-sm font-medium outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>

                    {/* State Filter */}
                    <select
                        value={selectedState}
                        onChange={(e) => { setSelectedState(e.target.value); setSelectedCity("All Cities"); }}
                        className="h-11 px-4 bg-gray-100 rounded-xl text-sm font-medium outline-none"
                    >
                        <option>All States</option>
                        {LOCATION_DATA.states.map(state => (
                            <option key={state} value={state}>{state}</option>
                        ))}
                    </select>

                    {/* City Filter */}
                    <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="h-11 px-4 bg-gray-100 rounded-xl text-sm font-medium outline-none"
                    >
                        {availableCities.map(city => (
                            <option key={city} value={city}>{city}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-purple-50 rounded-xl p-4 flex items-center justify-between"
                >
                    <span className="text-sm font-medium text-purple-700">
                        {selectedIds.length} merchant{selectedIds.length > 1 ? 's' : ''} selected
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleBulkApprove}
                            disabled={actionLoading === 'bulk'}
                            className="h-9 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                            {actionLoading === 'bulk' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            Approve All
                        </button>
                        <button
                            onClick={handleBulkReject}
                            disabled={actionLoading === 'bulk'}
                            className="h-9 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                            <X className="h-4 w-4" /> Reject All
                        </button>
                        <button
                            onClick={() => setSelectedIds([])}
                            className="h-9 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Data Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="w-12 px-4 py-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === merchants.length && merchants.length > 0}
                                        onChange={toggleSelectAll}
                                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    />
                                </th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Merchant</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">BBM-ID</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Location</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {merchants.map((merchant) => (
                                <tr key={merchant.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(merchant.id)}
                                            onChange={() => toggleSelect(merchant.id)}
                                            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                        />
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                                                {merchant.logo ? (
                                                    <img src={merchant.logo} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Store className="h-5 w-5 text-gray-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">{merchant.businessName}</p>
                                                <p className="text-xs text-gray-500">{merchant.ownerPhone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="font-mono text-sm text-gray-600">{merchant.bbmId || '-'}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-sm text-gray-600">{merchant.category}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-sm text-gray-600">{merchant.city}, {merchant.state}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        {getStatusBadge(merchant.status)}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/admin/dashboard/merchants/${merchant.id}`}>
                                                <button className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
                                                    <Eye className="h-4 w-4 text-gray-500" />
                                                </button>
                                            </Link>
                                            {merchant.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleQuickApprove(merchant.id)}
                                                        disabled={actionLoading === merchant.id}
                                                        className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors disabled:opacity-50"
                                                    >
                                                        {actionLoading === merchant.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                                                        ) : (
                                                            <Check className="h-4 w-4 text-green-600" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleQuickReject(merchant.id)}
                                                        disabled={actionLoading === merchant.id}
                                                        className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center hover:bg-red-200 transition-colors disabled:opacity-50"
                                                    >
                                                        <X className="h-4 w-4 text-red-600" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {!loading && merchants.length === 0 && (
                    <div className="py-20 text-center">
                        <Store className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500">No merchants found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
