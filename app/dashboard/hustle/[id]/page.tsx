"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
    ArrowLeft, MapPin, Clock, Building2, Globe, Laptop, Users,
    Briefcase, CheckCircle2, ExternalLink, Mail, Phone,
    Loader2, Send, ChevronRight, AlertCircle
} from "lucide-react";
import Image from "next/image";
import { useTheme } from "@/components/ThemeProvider";
import { hustleService, Opportunity } from "@/lib/services/hustle.service";
import { vibrate } from "@/lib/haptics";

const TYPE_LABELS: Record<string, string> = {
    freelance: 'Freelance', internship: 'Internship',
    part_time: 'Part Time', full_time: 'Full Time', contract: 'Contract',
};

const WORK_MODE_MAP: Record<string, { icon: any; label: string }> = {
    remote: { icon: Globe, label: 'Remote' },
    onsite: { icon: Building2, label: 'On-site' },
    hybrid: { icon: Laptop, label: 'Hybrid' },
};

const EXP_LABELS: Record<string, string> = {
    beginner: 'Beginner Friendly', intermediate: 'Intermediate',
    expert: 'Expert Level', any: 'Any Experience',
};

export default function OpportunityDetailPage() {
    const router = useRouter();
    const params = useParams();
    const oppId = params.id as string;
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [coverNote, setCoverNote] = useState('');
    const [applyError, setApplyError] = useState('');

    useEffect(() => {
        if (!oppId) return;

        Promise.all([
            hustleService.getOpportunityById(oppId),
            hustleService.hasApplied(oppId),
        ]).then(([oppRes, applied]) => {
            if (oppRes.success && oppRes.data) setOpportunity(oppRes.data);
            setHasApplied(applied);
            setLoading(false);
        });
    }, [oppId]);

    const handleApply = async () => {
        if (opportunity?.apply_method !== 'in_app') {
            // External apply
            if (opportunity?.apply_link) {
                window.open(opportunity.apply_link, '_blank');
            }
            return;
        }

        setApplying(true);
        setApplyError('');
        const res = await hustleService.applyToOpportunity(oppId, coverNote);
        if (res.success) {
            vibrate('success');
            setHasApplied(true);
            setShowApplyModal(false);
        } else {
            setApplyError(res.error || 'Failed to apply');
        }
        setApplying(false);
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isLight ? 'bg-gray-50' : 'bg-black'}`}>
                <Loader2 className={`h-8 w-8 animate-spin ${isLight ? 'text-gray-400' : 'text-white/30'}`} />
            </div>
        );
    }

    if (!opportunity) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isLight ? 'bg-gray-50' : 'bg-black'}`}>
                <div className="text-center">
                    <AlertCircle className={`h-12 w-12 mx-auto mb-3 ${isLight ? 'text-gray-300' : 'text-white/20'}`} />
                    <p className={`font-medium ${isLight ? 'text-gray-600' : 'text-white/60'}`}>Opportunity not found</p>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const rec = opportunity.recruiter as any;
    const WMInfo = WORK_MODE_MAP[opportunity.work_mode] || WORK_MODE_MAP.remote;
    const WMIcon = WMInfo.icon;

    return (
        <div className={`min-h-screen pb-36 ${isLight ? 'bg-gray-50' : 'bg-black'}`}>
            {/* Header */}
            <header className={`sticky top-0 z-40 backdrop-blur-xl ${isLight ? 'bg-white/90' : 'bg-black/90'} border-b ${isLight ? 'border-gray-100' : 'border-white/[0.04]'}`}>
                <div className="max-w-7xl mx-auto px-5 h-14 flex items-center gap-4">
                    <button onClick={() => router.back()}>
                        <ArrowLeft className={`h-5 w-5 ${isLight ? 'text-gray-600' : 'text-white/60'}`} />
                    </button>
                    <span className={`font-semibold text-sm truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>
                        Opportunity Details
                    </span>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-5 pt-6 space-y-6">
                {/* Company Card */}
                <div className={`rounded-2xl p-5 border ${isLight ? 'bg-white border-gray-100' : 'bg-white/[0.02] border-white/[0.04]'}`}>
                    <div className="flex items-start gap-4">
                        <div className={`h-14 w-14 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border ${isLight ? 'bg-gray-50 border-gray-100' : 'bg-white/[0.04] border-white/[0.06]'}`}>
                            {rec?.logo_url ? (
                                <Image src={rec.logo_url} alt={rec.company_name} width={56} height={56} className="object-contain p-1" />
                            ) : (
                                <span className={`text-2xl font-bold ${isLight ? 'text-gray-300' : 'text-white/20'}`}>
                                    {rec?.company_name?.charAt(0) || '?'}
                                </span>
                            )}
                        </div>
                        <div className="flex-1">
                            <h1 className={`font-bold text-xl leading-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                {opportunity.title}
                            </h1>
                            <p className={`text-sm mt-1 ${isLight ? 'text-gray-500' : 'text-white/50'}`}>
                                {rec?.company_name}
                                {rec?.industry && ` · ${rec.industry}`}
                            </p>
                        </div>
                    </div>

                    {/* Quick Info Chips */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-green-500/10 text-green-500`}>
                            {TYPE_LABELS[opportunity.type] || opportunity.type}
                        </span>
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${isLight ? 'bg-gray-100 text-gray-600' : 'bg-white/[0.04] text-white/50'}`}>
                            <WMIcon className="h-3.5 w-3.5" />
                            {WMInfo.label}
                        </span>
                        {opportunity.compensation && (
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                {opportunity.compensation}
                            </span>
                        )}
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${isLight ? 'bg-gray-100 text-gray-500' : 'bg-white/[0.04] text-white/40'}`}>
                            <MapPin className="h-3.5 w-3.5" />
                            {opportunity.is_pan_india ? 'Pan India' : opportunity.city || 'Not specified'}
                        </span>
                    </div>
                </div>

                {/* Details Sections */}
                <div className="space-y-4">
                    {/* Description */}
                    <Section title="About this opportunity" isLight={isLight}>
                        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isLight ? 'text-gray-600' : 'text-white/60'}`}>
                            {opportunity.description}
                        </p>
                    </Section>

                    {/* Key Details */}
                    <Section title="Details" isLight={isLight}>
                        <div className="grid grid-cols-2 gap-3">
                            <DetailItem label="Experience" value={EXP_LABELS[opportunity.experience_level] || 'Any'} isLight={isLight} />
                            <DetailItem label="Duration" value={opportunity.duration || 'Not specified'} isLight={isLight} />
                            <DetailItem label="Vacancies" value={`${opportunity.vacancies} position${opportunity.vacancies > 1 ? 's' : ''}`} isLight={isLight} />
                            <DetailItem label="Compensation" value={opportunity.compensation_type === 'unpaid' ? 'Unpaid' : opportunity.compensation || 'Not specified'} isLight={isLight} />
                        </div>
                    </Section>

                    {/* Skills */}
                    {opportunity.skills_required && opportunity.skills_required.length > 0 && (
                        <Section title="Skills Required" isLight={isLight}>
                            <div className="flex flex-wrap gap-2">
                                {opportunity.skills_required.map(skill => (
                                    <span
                                        key={skill}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400'}`}
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* Terms */}
                    {opportunity.terms && (
                        <Section title="Terms & Conditions" isLight={isLight}>
                            <p className={`text-xs leading-relaxed whitespace-pre-wrap ${isLight ? 'text-gray-500' : 'text-white/40'}`}>
                                {opportunity.terms}
                            </p>
                        </Section>
                    )}

                    {/* Company Info */}
                    {rec && (
                        <Section title="About the Company" isLight={isLight}>
                            <p className={`text-sm mb-3 ${isLight ? 'text-gray-600' : 'text-white/60'}`}>
                                {rec.description || `${rec.company_name} is looking for talented students.`}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {rec.website && (
                                    <a href={rec.website} target="_blank" rel="noopener noreferrer"
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.06]'}`}
                                    >
                                        <Globe className="h-3 w-3" /> Website
                                    </a>
                                )}
                                {rec.linkedin && (
                                    <a href={rec.linkedin} target="_blank" rel="noopener noreferrer"
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${isLight ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/15'}`}
                                    >
                                        <ExternalLink className="h-3 w-3" /> LinkedIn
                                    </a>
                                )}
                            </div>
                        </Section>
                    )}
                </div>
            </main>

            {/* Fixed Apply Bar */}
            <div className={`fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl pb-[max(env(safe-area-inset-bottom),16px)] ${isLight ? 'bg-white/95 border-t border-gray-200' : 'bg-black/95 border-t border-white/[0.06]'}`}>
                <div className="max-w-7xl mx-auto px-5 pt-3 flex items-center gap-3">
                    {hasApplied ? (
                        <div className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-xl font-semibold text-sm ${isLight ? 'bg-green-50 text-green-600' : 'bg-green-500/10 text-green-400'}`}>
                            <CheckCircle2 className="h-5 w-5" />
                            Applied Successfully
                        </div>
                    ) : opportunity.apply_method === 'in_app' ? (
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                                vibrate('medium');
                                setShowApplyModal(true);
                            }}
                            className="flex-1 h-12 bg-green-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 hover:bg-green-600 transition-colors"
                        >
                            <Send className="h-4 w-4" />
                            Apply Now
                        </motion.button>
                    ) : (
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={handleApply}
                            className="flex-1 h-12 bg-green-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 hover:bg-green-600 transition-colors"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Apply via {opportunity.apply_method === 'whatsapp' ? 'WhatsApp' : opportunity.apply_method === 'email' ? 'Email' : 'Link'}
                        </motion.button>
                    )}
                </div>
            </div>

            {/* Apply Modal */}
            {showApplyModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end justify-center"
                    onClick={() => setShowApplyModal(false)}
                >
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        transition={{ type: 'spring', damping: 28 }}
                        onClick={e => e.stopPropagation()}
                        className={`w-full max-w-lg rounded-t-3xl p-6 ${isLight ? 'bg-white' : 'bg-gray-900'}`}
                    >
                        <div className={`h-1 w-10 rounded-full mx-auto mb-6 ${isLight ? 'bg-gray-300' : 'bg-white/20'}`} />

                        <h3 className={`font-bold text-lg mb-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                            Apply to {opportunity.title}
                        </h3>
                        <p className={`text-xs mb-5 ${isLight ? 'text-gray-500' : 'text-white/40'}`}>
                            Your hustle profile will be shared with the recruiter
                        </p>

                        <textarea
                            value={coverNote}
                            onChange={e => setCoverNote(e.target.value)}
                            placeholder="Add a cover note (optional) — Tell them why you're a great fit..."
                            rows={4}
                            className={`w-full p-4 rounded-xl text-sm resize-none border focus:outline-none focus:ring-2 focus:ring-green-500/30 ${isLight
                                ? 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
                                : 'bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/30'
                                }`}
                        />

                        {applyError && (
                            <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> {applyError}
                            </p>
                        )}

                        <button
                            onClick={handleApply}
                            disabled={applying}
                            className="w-full h-12 bg-green-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 mt-4 shadow-lg shadow-green-500/25 hover:bg-green-600 transition-colors disabled:opacity-60"
                        >
                            {applying ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Submit Application
                                </>
                            )}
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}

// Reusable section wrapper
function Section({ title, children, isLight }: { title: string; children: React.ReactNode; isLight: boolean }) {
    return (
        <div className={`rounded-2xl p-5 border ${isLight ? 'bg-white border-gray-100' : 'bg-white/[0.02] border-white/[0.04]'}`}>
            <h2 className={`font-bold text-sm uppercase tracking-wider mb-3 ${isLight ? 'text-gray-800' : 'text-white/80'}`}>
                {title}
            </h2>
            {children}
        </div>
    );
}

// Detail item
function DetailItem({ label, value, isLight }: { label: string; value: string; isLight: boolean }) {
    return (
        <div>
            <span className={`text-[10px] uppercase tracking-widest font-semibold ${isLight ? 'text-gray-400' : 'text-white/25'}`}>{label}</span>
            <p className={`text-sm font-medium mt-0.5 ${isLight ? 'text-gray-800' : 'text-white/70'}`}>{value}</p>
        </div>
    );
}
