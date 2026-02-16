"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Search, Loader2, Eye, Check, X, Building2, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
    pending_review: { bg: 'bg-amber-100', text: 'text-amber-700' },
    active: { bg: 'bg-green-100', text: 'text-green-700' },
    paused: { bg: 'bg-gray-100', text: 'text-gray-700' },
    expired: { bg: 'bg-red-100', text: 'text-red-700' },
    rejected: { bg: 'bg-red-100', text: 'text-red-700' },
};

const STATUS_LABELS: Record<string, string> = {
    pending_review: 'Pending Review',
    active: 'Active',
    paused: 'Paused',
    expired: 'Expired',
    rejected: 'Rejected',
};

export default function AdminOpportunitiesPage() {
    const [opportunities, setOpportunities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchOpportunities();
    }, [filter, search]);

    const fetchOpportunities = async () => {
        setLoading(true);
        let query = supabase.from('opportunities').select(`
            *,
            recruiter:recruiters!recruiter_id (company_name, contact_person, bbr_id),
            category:opportunity_categories!category_id (name, icon)
        `).order('created_at', { ascending: false });

        if (filter !== 'all') query = query.eq('status', filter);
        if (search) query = query.ilike('title', `%${search}%`);

        const { data } = await query;
        setOpportunities(data || []);
        setLoading(false);
    };

    const handleApprove = async (id: string) => {
        setActionLoading(id);
        await supabase.from('opportunities').update({ status: 'active' }).eq('id', id);
        setOpportunities(prev => prev.map(o => o.id === id ? { ...o, status: 'active' } : o));
        setActionLoading(null);
    };

    const handleReject = async (id: string) => {
        setActionLoading(id);
        await supabase.from('opportunities').update({ status: 'rejected' }).eq('id', id);
        setOpportunities(prev => prev.map(o => o.id === id ? { ...o, status: 'rejected' } : o));
        setActionLoading(null);
    };

    const handlePause = async (id: string) => {
        setActionLoading(id);
        await supabase.from('opportunities').update({ status: 'paused' }).eq('id', id);
        setOpportunities(prev => prev.map(o => o.id === id ? { ...o, status: 'paused' } : o));
        setActionLoading(null);
    };

    const stats = {
        total: opportunities.length,
        pending: opportunities.filter(o => o.status === 'pending_review').length,
        active: opportunities.filter(o => o.status === 'active').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <ClipboardList className="h-7 w-7 text-blue-500" />
                    Opportunities
                </h1>
                <p className="text-sm text-gray-500 mt-1">Review and moderate job postings</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-100 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Pending Review</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Active</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search by job title..."
                        className="w-full h-11 pl-12 pr-4 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <select value={filter} onChange={e => setFilter(e.target.value)}
                    className="h-11 px-4 bg-gray-100 rounded-xl text-sm font-medium outline-none">
                    <option value="all">All Status</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="expired">Expired</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Opportunity</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Company</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Location</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Applications</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {opportunities.map(opp => {
                                const status = STATUS_STYLES[opp.status] || STATUS_STYLES.pending_review;
                                return (
                                    <tr key={opp.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-4">
                                            <div>
                                                <p className="font-semibold text-sm">{opp.title}</p>
                                                {opp.category && <p className="text-xs text-gray-400">{opp.category.icon} {opp.category.name}</p>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-sm text-gray-700">{opp.recruiter?.company_name || '—'}</p>
                                            <p className="text-xs text-gray-400">{opp.recruiter?.bbr_id}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm text-gray-600 capitalize">{opp.type?.replace('_', ' ')}</span>
                                            <p className="text-xs text-gray-400 capitalize">{opp.work_mode}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm text-gray-600">{opp.is_pan_india ? 'Pan India' : opp.city || '—'}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm font-medium text-gray-700">{opp.total_applications || 0}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                                                {STATUS_LABELS[opp.status] || opp.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {opp.status === 'pending_review' && (
                                                    <>
                                                        <button onClick={() => handleApprove(opp.id)} disabled={actionLoading === opp.id}
                                                            className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors disabled:opacity-50" title="Approve">
                                                            {actionLoading === opp.id ? <Loader2 className="h-4 w-4 animate-spin text-green-600" /> : <Check className="h-4 w-4 text-green-600" />}
                                                        </button>
                                                        <button onClick={() => handleReject(opp.id)}
                                                            className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center hover:bg-red-200 transition-colors" title="Reject">
                                                            <X className="h-4 w-4 text-red-600" />
                                                        </button>
                                                    </>
                                                )}
                                                {opp.status === 'active' && (
                                                    <button onClick={() => handlePause(opp.id)} disabled={actionLoading === opp.id}
                                                        className="h-8 w-8 rounded-lg bg-yellow-100 flex items-center justify-center hover:bg-yellow-200 transition-colors disabled:opacity-50" title="Pause">
                                                        <X className="h-4 w-4 text-yellow-600" />
                                                    </button>
                                                )}
                                                {opp.status === 'rejected' && (
                                                    <button onClick={() => handleApprove(opp.id)} disabled={actionLoading === opp.id}
                                                        className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors disabled:opacity-50" title="Re-approve">
                                                        <Check className="h-4 w-4 text-green-600" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}

                {!loading && opportunities.length === 0 && (
                    <div className="py-20 text-center">
                        <ClipboardList className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500">No opportunities found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
