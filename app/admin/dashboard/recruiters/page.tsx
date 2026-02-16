"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Briefcase, Search, Loader2, Eye, Check, X, Building2, Globe, MapPin, Mail, Phone, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-700' },
    verified: { bg: 'bg-green-100', text: 'text-green-700' },
    rejected: { bg: 'bg-red-100', text: 'text-red-700' },
    suspended: { bg: 'bg-gray-100', text: 'text-gray-700' },
};

export default function AdminRecruitersPage() {
    const [recruiters, setRecruiters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedRecruiter, setSelectedRecruiter] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

    useEffect(() => {
        fetchRecruiters();
    }, [filter, search]);

    const fetchRecruiters = async () => {
        setLoading(true);
        let query = supabase.from('recruiters').select('*').order('created_at', { ascending: false });

        if (filter !== 'all') query = query.eq('status', filter);
        if (search) query = query.or(`company_name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%,bbr_id.ilike.%${search}%`);

        const { data } = await query;
        setRecruiters(data || []);
        setLoading(false);
    };

    const handleVerify = async (id: string) => {
        setActionLoading(id);
        await supabase.from('recruiters').update({ status: 'verified', verified_at: new Date().toISOString() }).eq('id', id);
        setRecruiters(prev => prev.map(r => r.id === id ? { ...r, status: 'verified', verified_at: new Date().toISOString() } : r));
        setActionLoading(null);
    };

    const handleReject = async (id: string) => {
        setActionLoading(id);
        await supabase.from('recruiters').update({ status: 'rejected', rejected_reason: rejectReason }).eq('id', id);
        setRecruiters(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected', rejected_reason: rejectReason } : r));
        setActionLoading(null);
        setShowRejectModal(null);
        setRejectReason('');
    };

    const handleSuspend = async (id: string) => {
        setActionLoading(id);
        await supabase.from('recruiters').update({ status: 'suspended' }).eq('id', id);
        setRecruiters(prev => prev.map(r => r.id === id ? { ...r, status: 'suspended' } : r));
        setActionLoading(null);
    };

    const stats = {
        total: recruiters.length,
        pending: recruiters.filter(r => r.status === 'pending').length,
        verified: recruiters.filter(r => r.status === 'verified').length,
        rejected: recruiters.filter(r => r.status === 'rejected').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Briefcase className="h-7 w-7 text-green-500" />
                        Recruiters
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Verify and manage recruiter accounts</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: stats.total, bg: 'bg-gray-100', color: 'text-gray-900' },
                    { label: 'Pending', value: stats.pending, bg: 'bg-amber-50', color: 'text-amber-600' },
                    { label: 'Verified', value: stats.verified, bg: 'bg-green-50', color: 'text-green-600' },
                    { label: 'Rejected', value: stats.rejected, bg: 'bg-red-50', color: 'text-red-600' },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
                        <p className="text-sm text-gray-500">{s.label}</p>
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search by company, contact, email, or BBR ID..."
                        className="w-full h-11 pl-12 pr-4 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500/20" />
                </div>
                <select value={filter} onChange={e => setFilter(e.target.value)}
                    className="h-11 px-4 bg-gray-100 rounded-xl text-sm font-medium outline-none">
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                    <option value="suspended">Suspended</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Company</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">BBR ID</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Location</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {recruiters.map(rec => {
                                const status = STATUS_STYLES[rec.status] || STATUS_STYLES.pending;
                                return (
                                    <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                                                    {rec.company_name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm">{rec.company_name}</p>
                                                    <p className="text-xs text-gray-500">{rec.industry}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-sm">{rec.contact_person}</p>
                                            <p className="text-xs text-gray-400">{rec.email}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="font-mono text-sm text-gray-600">{rec.bbr_id}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm text-gray-600 capitalize">{rec.company_type}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm text-gray-600">{rec.city ? `${rec.city}, ${rec.state}` : '—'}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${status.bg} ${status.text}`}>
                                                {rec.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* View Detail Button */}
                                                <button
                                                    onClick={() => setSelectedRecruiter(selectedRecruiter?.id === rec.id ? null : rec)}
                                                    className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4 text-gray-500" />
                                                </button>

                                                {rec.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => handleVerify(rec.id)} disabled={actionLoading === rec.id}
                                                            className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors disabled:opacity-50" title="Verify">
                                                            {actionLoading === rec.id ? <Loader2 className="h-4 w-4 animate-spin text-green-600" /> : <Check className="h-4 w-4 text-green-600" />}
                                                        </button>
                                                        <button onClick={() => setShowRejectModal(rec.id)}
                                                            className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center hover:bg-red-200 transition-colors" title="Reject">
                                                            <X className="h-4 w-4 text-red-600" />
                                                        </button>
                                                    </>
                                                )}

                                                {rec.status === 'verified' && (
                                                    <button onClick={() => handleSuspend(rec.id)} disabled={actionLoading === rec.id}
                                                        className="h-8 w-8 rounded-lg bg-yellow-100 flex items-center justify-center hover:bg-yellow-200 transition-colors disabled:opacity-50" title="Suspend">
                                                        <X className="h-4 w-4 text-yellow-600" />
                                                    </button>
                                                )}

                                                {rec.status === 'rejected' && (
                                                    <button onClick={() => handleVerify(rec.id)} disabled={actionLoading === rec.id}
                                                        className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors disabled:opacity-50" title="Re-verify">
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

                {!loading && recruiters.length === 0 && (
                    <div className="py-20 text-center">
                        <Briefcase className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500">No recruiters found</p>
                    </div>
                )}
            </div>

            {/* Detail Drawer */}
            {selectedRecruiter && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-lg">{selectedRecruiter.company_name}</h2>
                        <button onClick={() => setSelectedRecruiter(null)} className="text-gray-400 hover:text-gray-600">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <Info label="Contact Person" value={selectedRecruiter.contact_person} />
                        <Info label="Email" value={selectedRecruiter.email} />
                        <Info label="Phone" value={selectedRecruiter.phone} />
                        <Info label="Company Type" value={selectedRecruiter.company_type} />
                        <Info label="Industry" value={selectedRecruiter.industry} />
                        <Info label="Location" value={selectedRecruiter.city ? `${selectedRecruiter.city}, ${selectedRecruiter.state}` : '—'} />
                        <Info label="Website" value={selectedRecruiter.website || '—'} isLink />
                        <Info label="LinkedIn" value={selectedRecruiter.linkedin || '—'} isLink />
                        <Info label="GST Number" value={selectedRecruiter.gst_number || '—'} />
                        <Info label="BBR ID" value={selectedRecruiter.bbr_id} />
                        <Info label="Plan" value={selectedRecruiter.plan} />
                        <Info label="Total Postings" value={String(selectedRecruiter.total_postings)} />
                    </div>
                    {selectedRecruiter.description && (
                        <div>
                            <p className="text-xs text-gray-400 font-semibold mb-1">Description</p>
                            <p className="text-sm text-gray-600">{selectedRecruiter.description}</p>
                        </div>
                    )}
                    {selectedRecruiter.rejected_reason && (
                        <div className="bg-red-50 p-3 rounded-xl">
                            <p className="text-xs text-red-400 font-semibold mb-1">Rejection Reason</p>
                            <p className="text-sm text-red-600">{selectedRecruiter.rejected_reason}</p>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setShowRejectModal(null)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-lg mb-4">Reject Recruiter</h3>
                        <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection..."
                            rows={3}
                            className="w-full p-3 rounded-xl bg-gray-100 text-sm resize-none outline-none focus:ring-2 focus:ring-red-500/20" />
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => setShowRejectModal(null)}
                                className="flex-1 h-10 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">Cancel</button>
                            <button onClick={() => handleReject(showRejectModal)}
                                className="flex-1 h-10 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600">Reject</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Info({ label, value, isLink }: { label: string; value: string; isLink?: boolean }) {
    return (
        <div>
            <p className="text-xs text-gray-400 font-semibold">{label}</p>
            {isLink && value !== '—' ? (
                <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">{value}</a>
            ) : (
                <p className="text-gray-700 capitalize">{value}</p>
            )}
        </div>
    );
}
