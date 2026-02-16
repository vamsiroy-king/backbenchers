"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    ArrowLeft, MapPin, Clock, Building2, Globe, Laptop, Users,
    Briefcase, CheckCircle2, ExternalLink, Mail, Phone,
    Loader2, AlertCircle, ShieldCheck, MessageCircle
} from "lucide-react";
import Image from "next/image";
import { useTheme } from "@/components/ThemeProvider";
import { hustleService, Opportunity } from "@/lib/services/hustle.service";
import { studentService } from "@/lib/services/student.service";

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
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        if (!oppId) return;

        Promise.all([
            hustleService.getOpportunityById(oppId),
            studentService.getMyProfile(),
        ]).then(([oppRes, profileRes]) => {
            if (oppRes.success && oppRes.data) setOpportunity(oppRes.data);
            if (profileRes.success && profileRes.data) {
                setIsVerified(profileRes.data.status === 'verified');
            }
            setLoading(false);
        });
    }, [oppId]);

    // Direct Contact — open external link based on apply method
    const handleApply = () => {
        if (!opportunity) return;

        const method = opportunity.apply_method;
        const link = opportunity.apply_link;

        if (method === 'whatsapp' && link) {
            // Ensure proper WhatsApp URL
            const phone = link.replace(/\D/g, '');
            window.open(`https://wa.me/${phone}?text=Hi, I'm interested in the "${opportunity.title}" opportunity listed on BackBenchers.`, '_blank');
        } else if (method === 'email' && link) {
            window.open(`mailto:${link}?subject=Application for ${opportunity.title}&body=Hi,%0A%0AI'm interested in the "${opportunity.title}" opportunity listed on BackBenchers.%0A%0AThanks`, '_blank');
        } else if (link) {
            window.open(link, '_blank');
        }
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

    // Determine apply button label and icon
    const getApplyInfo = () => {
        const method = opportunity.apply_method;
        if (method === 'whatsapp') return { icon: MessageCircle, label: 'Apply via WhatsApp' };
        if (method === 'email') return { icon: Mail, label: 'Apply via Email' };
        return { icon: ExternalLink, label: 'Apply Now' };
    };
    const applyInfo = getApplyInfo();
    const ApplyIcon = applyInfo.icon;

    return (
        <div className={`min-h-screen pb-40 ${isLight ? 'bg-gray-50' : 'bg-black'}`}>
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

            {/* Fixed Apply Bar — positioned above mobile nav */}
            <div className={`fixed bottom-[72px] left-0 right-0 z-40 backdrop-blur-xl pb-2 pt-3 px-5 ${isLight ? 'bg-white/95 border-t border-gray-200' : 'bg-black/95 border-t border-white/[0.06]'}`}>
                <div className="max-w-7xl mx-auto">
                    {isVerified ? (
                        <button
                            onClick={handleApply}
                            className="w-full h-12 bg-green-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 hover:bg-green-600 transition-colors active:bg-green-700"
                        >
                            <ApplyIcon className="h-4 w-4" />
                            {applyInfo.label}
                        </button>
                    ) : (
                        <button
                            onClick={() => router.push('/dashboard')}
                            className={`w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${isLight
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}
                        >
                            <ShieldCheck className="h-4 w-4" />
                            Get Verified to Apply
                        </button>
                    )}
                </div>
            </div>
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
