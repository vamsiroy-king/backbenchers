"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ArrowLeft, User, Plus, X, Save, Loader2, Link as LinkIcon,
    FileText, Eye, Briefcase, CheckCircle2, Globe, Building2, Laptop,
    Trash2, ExternalLink
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { hustleService, HustleProfile } from "@/lib/services/hustle.service";
import { vibrate } from "@/lib/haptics";

const SKILL_SUGGESTIONS = [
    'Video Editing', 'Videography', 'Premiere Pro', 'Final Cut Pro', 'DaVinci Resolve',
    'After Effects', 'Photoshop', 'Figma', 'Canva', 'Illustrator',
    'React', 'Next.js', 'Node.js', 'Python', 'JavaScript', 'TypeScript',
    'Flutter', 'React Native', 'Swift', 'Kotlin',
    'Content Writing', 'Copywriting', 'SEO', 'Blog Writing',
    'Instagram Reels', 'YouTube', 'TikTok', 'Social Media Marketing',
    'Photography', 'Product Photography', 'Event Photography',
    'Data Entry', 'Excel', 'Google Sheets', 'Research',
    'Public Speaking', 'Tutoring', 'Mentoring',
];

const PORTFOLIO_TYPES = [
    { value: 'github', label: 'GitHub' },
    { value: 'behance', label: 'Behance' },
    { value: 'dribbble', label: 'Dribbble' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'website', label: 'Personal Website' },
    { value: 'other', label: 'Other' },
];

export default function HustleProfilePage() {
    const router = useRouter();
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Form state
    const [headline, setHeadline] = useState('');
    const [bio, setBio] = useState('');
    const [skills, setSkills] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState('');
    const [experienceLevel, setExperienceLevel] = useState('beginner');
    const [isAvailable, setIsAvailable] = useState(true);
    const [preferredWorkMode, setPreferredWorkMode] = useState('any');
    const [preferredTypes, setPreferredTypes] = useState<string[]>([]);
    const [portfolioLinks, setPortfolioLinks] = useState<{ title: string; url: string; type: string }[]>([]);

    // Skill suggestions
    const [showSuggestions, setShowSuggestions] = useState(false);
    const filteredSuggestions = SKILL_SUGGESTIONS.filter(
        s => s.toLowerCase().includes(skillInput.toLowerCase()) && !skills.includes(s)
    ).slice(0, 8);

    useEffect(() => {
        hustleService.getMyProfile().then(res => {
            if (res.success && res.data) {
                const p = res.data;
                setHeadline(p.headline || '');
                setBio(p.bio || '');
                setSkills(p.skills || []);
                setExperienceLevel(p.experience_level || 'beginner');
                setIsAvailable(p.is_available ?? true);
                setPreferredWorkMode(p.preferred_work_mode || 'any');
                setPreferredTypes(p.preferred_types || []);
                setPortfolioLinks(p.portfolio_links || []);
            }
            setLoading(false);
        });
    }, []);

    const addSkill = (skill: string) => {
        const s = skill.trim();
        if (s && !skills.includes(s)) {
            setSkills([...skills, s]);
        }
        setSkillInput('');
        setShowSuggestions(false);
    };

    const removeSkill = (skill: string) => {
        setSkills(skills.filter(s => s !== skill));
    };

    const addPortfolioLink = () => {
        setPortfolioLinks([...portfolioLinks, { title: '', url: '', type: 'website' }]);
    };

    const updatePortfolioLink = (index: number, field: string, value: string) => {
        const updated = [...portfolioLinks];
        (updated[index] as any)[field] = value;
        setPortfolioLinks(updated);
    };

    const removePortfolioLink = (index: number) => {
        setPortfolioLinks(portfolioLinks.filter((_, i) => i !== index));
    };

    const togglePreferredType = (type: string) => {
        if (preferredTypes.includes(type)) {
            setPreferredTypes(preferredTypes.filter(t => t !== type));
        } else {
            setPreferredTypes([...preferredTypes, type]);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        const res = await hustleService.createOrUpdateProfile({
            headline,
            bio,
            skills,
            experience_level: experienceLevel as any,
            is_available: isAvailable,
            preferred_work_mode: preferredWorkMode as any,
            preferred_types: preferredTypes,
            portfolio_links: portfolioLinks.filter(l => l.url.trim()),
        });

        if (res.success) {
            vibrate('success');
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isLight ? 'bg-gray-50' : 'bg-black'}`}>
                <Loader2 className={`h-8 w-8 animate-spin ${isLight ? 'text-gray-400' : 'text-white/30'}`} />
            </div>
        );
    }

    return (
        <div className={`min-h-screen pb-32 ${isLight ? 'bg-gray-50' : 'bg-black'}`}>
            {/* Header */}
            <header className={`sticky top-0 z-40 backdrop-blur-xl ${isLight ? 'bg-white/90' : 'bg-black/90'} border-b ${isLight ? 'border-gray-100' : 'border-white/[0.04]'}`}>
                <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()}>
                            <ArrowLeft className={`h-5 w-5 ${isLight ? 'text-gray-600' : 'text-white/60'}`} />
                        </button>
                        <span className={`font-semibold text-sm ${isLight ? 'text-gray-900' : 'text-white'}`}>
                            Hustle Profile
                        </span>
                    </div>
                    {/* Availability Toggle */}
                    <button
                        onClick={() => setIsAvailable(!isAvailable)}
                        className={`flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold transition-all border ${isAvailable
                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                            : isLight ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white/[0.04] text-white/30 border-white/[0.06]'
                            }`}
                    >
                        <div className={`h-2 w-2 rounded-full ${isAvailable ? 'bg-green-500' : isLight ? 'bg-gray-300' : 'bg-white/20'}`} />
                        {isAvailable ? 'Available' : 'Unavailable'}
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-5 pt-6 space-y-5">

                {/* Headline */}
                <FormSection title="Your Headline" subtitle="What do you do?" isLight={isLight}>
                    <input
                        type="text"
                        value={headline}
                        onChange={e => setHeadline(e.target.value)}
                        placeholder='e.g. "iPhone Videographer | Premiere Pro Editor"'
                        maxLength={150}
                        className={`w-full h-12 px-4 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-green-500/30 ${isLight
                            ? 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
                            : 'bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/30'
                            }`}
                    />
                    <span className={`text-[10px] mt-1 block text-right ${isLight ? 'text-gray-400' : 'text-white/20'}`}>
                        {headline.length}/150
                    </span>
                </FormSection>

                {/* Bio */}
                <FormSection title="About You" subtitle="Brief intro about your experience" isLight={isLight}>
                    <textarea
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        placeholder="Tell recruiters about yourself, your experience, and what you're looking for..."
                        rows={4}
                        className={`w-full p-4 rounded-xl text-sm resize-none border focus:outline-none focus:ring-2 focus:ring-green-500/30 ${isLight
                            ? 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
                            : 'bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/30'
                            }`}
                    />
                </FormSection>

                {/* Skills */}
                <FormSection title="Skills" subtitle="Add skills to match with opportunities" isLight={isLight}>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {skills.map(skill => (
                            <span
                                key={skill}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${isLight ? 'bg-green-50 text-green-700' : 'bg-green-500/10 text-green-400'}`}
                            >
                                {skill}
                                <button onClick={() => removeSkill(skill)}>
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            value={skillInput}
                            onChange={e => {
                                setSkillInput(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addSkill(skillInput);
                                }
                            }}
                            placeholder="Type a skill and press Enter..."
                            className={`w-full h-10 px-4 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-green-500/30 ${isLight
                                ? 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
                                : 'bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/30'
                                }`}
                        />
                        {showSuggestions && filteredSuggestions.length > 0 && skillInput && (
                            <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl border overflow-hidden z-10 ${isLight ? 'bg-white border-gray-200 shadow-lg' : 'bg-gray-900 border-white/10'}`}>
                                {filteredSuggestions.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => addSkill(s)}
                                        className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors ${isLight ? 'hover:bg-gray-50 text-gray-700' : 'hover:bg-white/[0.04] text-white/70'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </FormSection>

                {/* Experience Level */}
                <FormSection title="Experience Level" subtitle="Your overall experience" isLight={isLight}>
                    <div className="flex gap-2">
                        {['beginner', 'intermediate', 'expert'].map(level => (
                            <button
                                key={level}
                                onClick={() => setExperienceLevel(level)}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all border ${experienceLevel === level
                                    ? 'bg-green-500 text-white border-green-500'
                                    : isLight ? 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50' : 'bg-white/[0.03] text-white/50 border-white/[0.06] hover:bg-white/[0.05]'
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </FormSection>

                {/* Preferred Work Mode */}
                <FormSection title="Preferred Work Mode" isLight={isLight}>
                    <div className="flex gap-2">
                        {[
                            { value: 'remote', icon: Globe, label: 'Remote' },
                            { value: 'onsite', icon: Building2, label: 'On-site' },
                            { value: 'hybrid', icon: Laptop, label: 'Hybrid' },
                            { value: 'any', icon: Briefcase, label: 'Any' },
                        ].map(({ value, icon: Icon, label }) => (
                            <button
                                key={value}
                                onClick={() => setPreferredWorkMode(value)}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all border flex items-center justify-center gap-1.5 ${preferredWorkMode === value
                                    ? 'bg-green-500 text-white border-green-500'
                                    : isLight ? 'bg-white text-gray-600 border-gray-200' : 'bg-white/[0.03] text-white/50 border-white/[0.06]'
                                    }`}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {label}
                            </button>
                        ))}
                    </div>
                </FormSection>

                {/* Preferred Job Types */}
                <FormSection title="Preferred Job Types" subtitle="Select all that interest you" isLight={isLight}>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { value: 'freelance', label: 'Freelance' },
                            { value: 'internship', label: 'Internship' },
                            { value: 'part_time', label: 'Part Time' },
                            { value: 'full_time', label: 'Full Time' },
                            { value: 'contract', label: 'Contract' },
                        ].map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => togglePreferredType(value)}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${preferredTypes.includes(value)
                                    ? 'bg-green-500 text-white border-green-500'
                                    : isLight ? 'bg-white text-gray-600 border-gray-200' : 'bg-white/[0.03] text-white/50 border-white/[0.06]'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </FormSection>

                {/* Portfolio Links */}
                <FormSection title="Portfolio & Links" subtitle="Add your work portfolio" isLight={isLight}>
                    <div className="space-y-3">
                        {portfolioLinks.map((link, i) => (
                            <div key={i} className={`rounded-xl p-3 border space-y-2 ${isLight ? 'bg-gray-50 border-gray-100' : 'bg-white/[0.02] border-white/[0.04]'}`}>
                                <div className="flex gap-2">
                                    <select
                                        value={link.type}
                                        onChange={e => updatePortfolioLink(i, 'type', e.target.value)}
                                        className={`h-9 px-3 rounded-lg text-xs border focus:outline-none ${isLight
                                            ? 'bg-white border-gray-200 text-gray-700'
                                            : 'bg-white/[0.03] border-white/[0.06] text-white/70'
                                            }`}
                                    >
                                        {PORTFOLIO_TYPES.map(pt => (
                                            <option key={pt.value} value={pt.value}>{pt.label}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => removePortfolioLink(i)}
                                        className="h-9 w-9 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={link.title}
                                    onChange={e => updatePortfolioLink(i, 'title', e.target.value)}
                                    placeholder="Label (e.g. 'My YouTube Channel')"
                                    className={`w-full h-9 px-3 rounded-lg text-xs border focus:outline-none ${isLight
                                        ? 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
                                        : 'bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/30'
                                        }`}
                                />
                                <input
                                    type="url"
                                    value={link.url}
                                    onChange={e => updatePortfolioLink(i, 'url', e.target.value)}
                                    placeholder="https://..."
                                    className={`w-full h-9 px-3 rounded-lg text-xs border focus:outline-none ${isLight
                                        ? 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
                                        : 'bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/30'
                                        }`}
                                />
                            </div>
                        ))}
                        <button
                            onClick={addPortfolioLink}
                            className={`w-full py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-dashed transition-colors ${isLight
                                ? 'border-gray-300 text-gray-500 hover:bg-gray-50'
                                : 'border-white/10 text-white/40 hover:bg-white/[0.03]'
                                }`}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add Link
                        </button>
                    </div>
                </FormSection>
            </main>

            {/* Fixed Save Bar */}
            <div className={`fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl pb-[max(env(safe-area-inset-bottom),16px)] ${isLight ? 'bg-white/95 border-t border-gray-200' : 'bg-black/95 border-t border-white/[0.06]'}`}>
                <div className="max-w-7xl mx-auto px-5 pt-3">
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleSave}
                        disabled={saving}
                        className={`w-full h-12 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors ${saved
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-green-500 text-white shadow-lg shadow-green-500/25 hover:bg-green-600'
                            } disabled:opacity-60`}
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : saved ? (
                            <>
                                <CheckCircle2 className="h-4 w-4" />
                                Saved!
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Save Profile
                            </>
                        )}
                    </motion.button>
                </div>
            </div>
        </div>
    );
}

// Reusable form section
function FormSection({ title, subtitle, children, isLight }: { title: string; subtitle?: string; children: React.ReactNode; isLight: boolean }) {
    return (
        <div className={`rounded-2xl p-5 border ${isLight ? 'bg-white border-gray-100' : 'bg-white/[0.02] border-white/[0.04]'}`}>
            <h3 className={`font-bold text-sm mb-0.5 ${isLight ? 'text-gray-800' : 'text-white/80'}`}>{title}</h3>
            {subtitle && <p className={`text-[11px] mb-3 ${isLight ? 'text-gray-400' : 'text-white/30'}`}>{subtitle}</p>}
            {children}
        </div>
    );
}
