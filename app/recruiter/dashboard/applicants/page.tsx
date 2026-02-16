"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, User, Mail, MapPin, ExternalLink, Check, X, ChevronDown, Briefcase } from "lucide-react";
import Image from "next/image";
import { recruiterService } from "@/lib/services/recruiter.service";

const STATUS_ACTIONS: Record<string, { label: string; color: string }> = {
    applied: { label: 'New', color: 'text-blue-400' },
    shortlisted: { label: 'Shortlist', color: 'text-green-400' },
    interviewed: { label: 'Interviewed', color: 'text-purple-400' },
    hired: { label: 'Hired', color: 'text-emerald-400' },
    rejected: { label: 'Reject', color: 'text-red-400' },
};

export default function RecruiterApplicantsPage() {
    const [applicants, setApplicants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        recruiterService.getAllApplicants().then(res => {
            if (res.success) setApplicants(res.data || []);
            setLoading(false);
        });
    }, []);

    const handleStatusChange = async (appId: string, newStatus: string) => {
        await recruiterService.updateApplicationStatus(appId, newStatus);
        setApplicants(prev => prev.map(a =>
            a.id === appId ? { ...a, status: newStatus } : a
        ));
    };

    const filtered = filterStatus === 'all'
        ? applicants
        : applicants.filter(a => a.status === filterStatus);

    if (loading) return <div className="flex justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-white/20 mt-20" /></div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-white text-xl font-bold">Applicants</h1>
                    <p className="text-white/40 text-xs mt-1">{applicants.length} total applications</p>
                </div>
            </div>

            {/* Status Filter */}
            <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-6 -mx-2 px-2">
                {['all', 'applied', 'shortlisted', 'interviewed', 'hired', 'rejected'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border flex-shrink-0 capitalize ${filterStatus === status
                            ? 'bg-green-500 text-white border-green-500'
                            : 'bg-white/[0.03] text-white/40 border-white/[0.06]'
                            }`}
                    >
                        {status}
                        {status !== 'all' && ` (${applicants.filter(a => a.status === status).length})`}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-16">
                    <User className="h-12 w-12 text-white/15 mx-auto mb-3" />
                    <p className="text-white/40 text-sm">No applicants {filterStatus !== 'all' ? `with status "${filterStatus}"` : 'yet'}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((app, i) => (
                        <motion.div
                            key={app.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4"
                        >
                            <div className="flex items-start gap-3">
                                {/* Avatar */}
                                <div className="h-11 w-11 rounded-xl bg-white/[0.04] flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/[0.06]">
                                    {app.student?.profile_image_url ? (
                                        <Image src={app.student.profile_image_url} alt={app.student.name} width={44} height={44} className="object-cover" />
                                    ) : (
                                        <User className="h-5 w-5 text-white/20" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-white font-bold text-sm truncate">{app.student?.name || 'Student'}</h3>
                                        <span className="text-white/20 text-[10px]">{app.student?.bb_id}</span>
                                    </div>
                                    <p className="text-white/40 text-xs truncate">
                                        {app.student?.college || 'College not specified'}
                                        {app.student?.city && ` · ${app.student.city}`}
                                    </p>

                                    {/* Hustle Profile snippet */}
                                    {app.hustle_profile && (
                                        <div className="mt-2 space-y-1">
                                            {app.hustle_profile.headline && (
                                                <p className="text-white/50 text-[11px] font-medium">{app.hustle_profile.headline}</p>
                                            )}
                                            {app.hustle_profile.skills && (
                                                <div className="flex flex-wrap gap-1">
                                                    {(app.hustle_profile.skills as string[]).slice(0, 4).map((s: string) => (
                                                        <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/30">{s}</span>
                                                    ))}
                                                </div>
                                            )}
                                            {/* Portfolio links */}
                                            {app.hustle_profile.portfolio_links && (app.hustle_profile.portfolio_links as any[]).length > 0 && (
                                                <div className="flex gap-1 mt-1">
                                                    {(app.hustle_profile.portfolio_links as any[]).slice(0, 3).map((link: any, j: number) => (
                                                        <a key={j} href={link.url} target="_blank" rel="noopener noreferrer"
                                                            className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 flex items-center gap-0.5">
                                                            <ExternalLink className="h-2.5 w-2.5" /> {link.title || link.type}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Applied For */}
                                    {app.opportunity && (
                                        <p className="text-white/20 text-[10px] mt-2 flex items-center gap-1">
                                            <Briefcase className="h-2.5 w-2.5" /> {app.opportunity.title}
                                        </p>
                                    )}

                                    {/* Cover Note */}
                                    {app.cover_note && (
                                        <p className="text-white/30 text-[10px] mt-1 italic">"{app.cover_note}"</p>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.04]">
                                {['shortlisted', 'interviewed', 'hired', 'rejected'].map(status => {
                                    const info = STATUS_ACTIONS[status];
                                    const isActive = app.status === status;
                                    return (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusChange(app.id, status)}
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all border ${isActive
                                                ? `${info.color} bg-current/10 border-current`
                                                : 'text-white/30 bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]'
                                                }`}
                                        >
                                            {info.label}
                                        </button>
                                    );
                                })}
                                <span className="ml-auto text-white/15 text-[9px]">
                                    {new Date(app.applied_at).toLocaleDateString()}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
