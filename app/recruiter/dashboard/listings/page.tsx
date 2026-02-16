"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Eye, Users, Clock, MoreVertical, Trash2, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { recruiterService } from "@/lib/services/recruiter.service";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    pending_review: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Pending Review' },
    active: { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Active' },
    paused: { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'Paused' },
    expired: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Expired' },
    rejected: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Rejected' },
};

export default function RecruiterListingsPage() {
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        recruiterService.getMyListings().then(res => {
            if (res.success) setListings(res.data || []);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="flex justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-white/20 mt-20" /></div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-white text-xl font-bold">My Listings</h1>
                    <p className="text-white/40 text-xs mt-1">{listings.length} total opportunities</p>
                </div>
                <Link href="/recruiter/dashboard/post"
                    className="px-4 py-2 bg-green-500 text-white text-xs font-bold rounded-xl hover:bg-green-600 transition-colors">
                    + New Post
                </Link>
            </div>

            {listings.length === 0 ? (
                <div className="text-center py-16">
                    <div className="h-16 w-16 bg-white/[0.03] rounded-2xl mx-auto mb-4 flex items-center justify-center">
                        <Eye className="h-8 w-8 text-white/15" />
                    </div>
                    <p className="text-white/40 text-sm">No listings yet. Create your first opportunity!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {listings.map((listing, i) => {
                        const status = STATUS_STYLES[listing.status] || STATUS_STYLES.pending_review;
                        return (
                            <motion.div
                                key={listing.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-white font-bold text-sm">{listing.title}</h3>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${status.bg} ${status.text}`}>
                                                {status.label}
                                            </span>
                                        </div>
                                        <p className="text-white/40 text-xs">
                                            {listing.category?.name && `${listing.category.icon} ${listing.category.name} · `}
                                            {listing.type} · {listing.work_mode}
                                            {listing.city && ` · ${listing.city}`}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.04]">
                                    <span className="text-white/30 text-[10px] flex items-center gap-1">
                                        <Users className="h-3 w-3" /> {listing.total_applications || 0} apps
                                    </span>
                                    <span className="text-white/30 text-[10px] flex items-center gap-1">
                                        <Eye className="h-3 w-3" /> {listing.views || 0} views
                                    </span>
                                    <span className="text-white/30 text-[10px] flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> {new Date(listing.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
