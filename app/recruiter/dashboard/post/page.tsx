"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ArrowLeft, Plus, ChevronDown, Loader2, CheckCircle2,
    Briefcase, MapPin, Clock, Tag, Code, DollarSign, Users
} from "lucide-react";
import { recruiterService, PostOpportunityData } from "@/lib/services/recruiter.service";
import { hustleService, OpportunityCategory } from "@/lib/services/hustle.service";

const JOB_TYPES = [
    { value: 'freelance', label: 'Freelance' },
    { value: 'internship', label: 'Internship' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'full_time', label: 'Full Time' },
    { value: 'contract', label: 'Contract' },
];

const WORK_MODES = [
    { value: 'remote', label: 'Remote' },
    { value: 'onsite', label: 'On-site' },
    { value: 'hybrid', label: 'Hybrid' },
];

const EXP_LEVELS = [
    { value: 'beginner', label: 'Beginner Friendly' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'expert', label: 'Expert' },
    { value: 'any', label: 'Any Level' },
];

const COMPENSATION_TYPES = [
    { value: 'paid', label: 'Paid' },
    { value: 'equity', label: 'Equity' },
    { value: 'unpaid', label: 'Unpaid / Volunteer' },
    { value: 'stipend', label: 'Stipend' },
];

const APPLY_METHODS = [
    { value: 'in_app', label: 'In-App Application' },
    { value: 'external_link', label: 'External Link' },
    { value: 'email', label: 'Email' },
    { value: 'whatsapp', label: 'WhatsApp' },
];

export default function PostOpportunityPage() {
    const router = useRouter();
    const [categories, setCategories] = useState<OpportunityCategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Form
    const [categoryId, setCategoryId] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('');
    const [workMode, setWorkMode] = useState('');
    const [expLevel, setExpLevel] = useState('beginner');
    const [compensation, setCompensation] = useState('');
    const [compensationType, setCompensationType] = useState('paid');
    const [skillsStr, setSkillsStr] = useState('');
    const [vacancies, setVacancies] = useState('1');
    const [duration, setDuration] = useState('');
    const [city, setCity] = useState('');
    const [isPanIndia, setIsPanIndia] = useState(false);
    const [terms, setTerms] = useState('');
    const [applyMethod, setApplyMethod] = useState('in_app');
    const [applyLink, setApplyLink] = useState('');

    useEffect(() => {
        hustleService.getCategories().then(res => {
            if (res.success && res.data) setCategories(res.data);
        });
    }, []);

    const isValid = title && description && type && workMode && categoryId;

    const handlePost = async () => {
        if (!isValid) return;
        setLoading(true);
        setError('');

        const data: PostOpportunityData = {
            category_id: categoryId,
            title,
            description,
            type,
            work_mode: workMode,
            experience_level: expLevel,
            compensation: compensation || undefined,
            compensation_type: compensationType,
            skills_required: skillsStr.split(',').map(s => s.trim()).filter(Boolean),
            vacancies: parseInt(vacancies) || 1,
            duration: duration || undefined,
            city: isPanIndia ? undefined : city || undefined,
            is_pan_india: isPanIndia,
            terms: terms || undefined,
            apply_method: applyMethod,
            apply_link: applyLink || undefined,
        };

        const res = await recruiterService.postOpportunity(data);
        if (res.success) {
            setSuccess(true);
            setTimeout(() => router.push('/recruiter/dashboard/listings'), 2000);
        } else {
            setError(res.error || 'Failed to post');
        }
        setLoading(false);
    };

    if (success) {
        return (
            <div className="flex items-center justify-center h-[70vh]">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                    <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-white text-xl font-bold">Opportunity Posted!</h2>
                    <p className="text-white/40 text-sm mt-2">Your listing is pending admin review. Redirecting...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto pb-32">
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5 text-white/60" />
                </button>
                <div>
                    <h1 className="text-white text-xl font-bold">Post Opportunity</h1>
                    <p className="text-white/40 text-xs">Fill in the details to create a job listing</p>
                </div>
            </div>

            <div className="space-y-5">
                {/* Category */}
                <Field label="Category" required>
                    <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl text-sm bg-white/[0.03] border border-white/[0.06] text-white appearance-none focus:outline-none focus:ring-2 focus:ring-green-500/30">
                        <option value="" disabled className="bg-gray-900">Select category</option>
                        {categories.map(c => <option key={c.id} value={c.id} className="bg-gray-900">{c.icon} {c.name}</option>)}
                    </select>
                </Field>

                {/* Title */}
                <Field label="Job Title" required>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                        placeholder="e.g. Video Editor for YouTube Channel"
                        className="w-full h-12 px-4 rounded-xl text-sm bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                </Field>

                {/* Description */}
                <Field label="Description" required>
                    <textarea value={description} onChange={e => setDescription(e.target.value)}
                        placeholder="Describe the role, responsibilities, and what you're looking for..."
                        rows={5}
                        className="w-full p-4 rounded-xl text-sm bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-white/30 resize-none focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                </Field>

                {/* Type + Work Mode */}
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Job Type" required>
                        <div className="flex flex-wrap gap-2">
                            {JOB_TYPES.map(t => (
                                <button key={t.value} onClick={() => setType(t.value)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${type === t.value ? 'bg-green-500 text-white border-green-500' : 'bg-white/[0.03] text-white/40 border-white/[0.06]'}`}>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </Field>
                    <Field label="Work Mode" required>
                        <div className="flex flex-wrap gap-2">
                            {WORK_MODES.map(w => (
                                <button key={w.value} onClick={() => setWorkMode(w.value)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${workMode === w.value ? 'bg-green-500 text-white border-green-500' : 'bg-white/[0.03] text-white/40 border-white/[0.06]'}`}>
                                    {w.label}
                                </button>
                            ))}
                        </div>
                    </Field>
                </div>

                {/* Experience Level */}
                <Field label="Experience Level">
                    <div className="flex flex-wrap gap-2">
                        {EXP_LEVELS.map(e => (
                            <button key={e.value} onClick={() => setExpLevel(e.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${expLevel === e.value ? 'bg-green-500 text-white border-green-500' : 'bg-white/[0.03] text-white/40 border-white/[0.06]'}`}>
                                {e.label}
                            </button>
                        ))}
                    </div>
                </Field>

                {/* Compensation */}
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Compensation Type">
                        <select value={compensationType} onChange={e => setCompensationType(e.target.value)}
                            className="w-full h-10 px-4 rounded-xl text-sm bg-white/[0.03] border border-white/[0.06] text-white appearance-none focus:outline-none">
                            {COMPENSATION_TYPES.map(c => <option key={c.value} value={c.value} className="bg-gray-900">{c.label}</option>)}
                        </select>
                    </Field>
                    <Field label="Amount / Range">
                        <input type="text" value={compensation} onChange={e => setCompensation(e.target.value)}
                            placeholder="e.g. ₹5,000 - ₹10,000/mo"
                            className="w-full h-10 px-4 rounded-xl text-sm bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-white/30 focus:outline-none" />
                    </Field>
                </div>

                {/* Skills */}
                <Field label="Required Skills" subtitle="Comma separated">
                    <input type="text" value={skillsStr} onChange={e => setSkillsStr(e.target.value)}
                        placeholder="e.g. Premiere Pro, After Effects, Color Grading"
                        className="w-full h-10 px-4 rounded-xl text-sm bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-white/30 focus:outline-none" />
                </Field>

                {/* Location */}
                <div className="grid grid-cols-2 gap-3">
                    <Field label="City">
                        <input type="text" value={city} onChange={e => setCity(e.target.value)}
                            disabled={isPanIndia}
                            placeholder="e.g. Hyderabad"
                            className="w-full h-10 px-4 rounded-xl text-sm bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-white/30 focus:outline-none disabled:opacity-30" />
                    </Field>
                    <Field label="Pan India?">
                        <button onClick={() => setIsPanIndia(!isPanIndia)}
                            className={`w-full h-10 rounded-xl text-xs font-semibold transition-all border ${isPanIndia ? 'bg-green-500 text-white border-green-500' : 'bg-white/[0.03] text-white/40 border-white/[0.06]'}`}>
                            {isPanIndia ? 'Yes — Open to all cities' : 'No — City specific'}
                        </button>
                    </Field>
                </div>

                {/* Vacancies + Duration */}
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Vacancies">
                        <input type="number" value={vacancies} onChange={e => setVacancies(e.target.value)} min="1"
                            className="w-full h-10 px-4 rounded-xl text-sm bg-white/[0.03] border border-white/[0.06] text-white focus:outline-none" />
                    </Field>
                    <Field label="Duration">
                        <input type="text" value={duration} onChange={e => setDuration(e.target.value)}
                            placeholder="e.g. 3 months"
                            className="w-full h-10 px-4 rounded-xl text-sm bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-white/30 focus:outline-none" />
                    </Field>
                </div>

                {/* Apply Method */}
                <Field label="Application Method">
                    <div className="flex flex-wrap gap-2">
                        {APPLY_METHODS.map(m => (
                            <button key={m.value} onClick={() => setApplyMethod(m.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${applyMethod === m.value ? 'bg-green-500 text-white border-green-500' : 'bg-white/[0.03] text-white/40 border-white/[0.06]'}`}>
                                {m.label}
                            </button>
                        ))}
                    </div>
                    {applyMethod !== 'in_app' && (
                        <input type="text" value={applyLink} onChange={e => setApplyLink(e.target.value)}
                            placeholder={applyMethod === 'email' ? 'hr@company.com' : applyMethod === 'whatsapp' ? '+91 98765 43210' : 'https://...'}
                            className="w-full h-10 px-4 rounded-xl text-sm bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-white/30 focus:outline-none mt-2" />
                    )}
                </Field>

                {/* Terms */}
                <Field label="Terms & Conditions (Optional)">
                    <textarea value={terms} onChange={e => setTerms(e.target.value)}
                        placeholder="Any specific terms or conditions..."
                        rows={3}
                        className="w-full p-4 rounded-xl text-sm bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-white/30 resize-none focus:outline-none" />
                </Field>

                {error && <p className="text-red-400 text-xs bg-red-500/10 p-3 rounded-xl">{error}</p>}
            </div>

            {/* Submit */}
            <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl pb-[max(env(safe-area-inset-bottom),16px)] border-t border-white/[0.06] z-50">
                <div className="max-w-2xl mx-auto px-5 pt-3">
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handlePost}
                        disabled={!isValid || loading}
                        className="w-full h-12 bg-green-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 hover:bg-green-600 transition-colors disabled:opacity-40"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Post for Review <Plus className="h-4 w-4" /></>}
                    </motion.button>
                </div>
            </div>
        </div>
    );
}

function Field({ label, required, subtitle, children }: { label: string; required?: boolean; subtitle?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="text-white/50 text-xs font-semibold mb-1.5 flex items-center gap-1">
                {label} {required && <span className="text-green-500">*</span>}
                {subtitle && <span className="text-white/20 font-normal">({subtitle})</span>}
            </label>
            {children}
        </div>
    );
}
