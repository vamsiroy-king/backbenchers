"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Building2, User, Mail, Phone, Globe, MapPin, FileText,
    ArrowRight, Loader2, Briefcase, ChevronDown
} from "lucide-react";
import { recruiterService } from "@/lib/services/recruiter.service";

const COMPANY_TYPES = [
    { value: 'startup', label: 'Startup' },
    { value: 'agency', label: 'Agency' },
    { value: 'corporate', label: 'Corporate' },
    { value: 'freelancer', label: 'Freelancer / Individual' },
    { value: 'ngo', label: 'NGO / Non-Profit' },
];

const INDUSTRIES = [
    'Technology', 'Media & Entertainment', 'Marketing & Advertising',
    'Education', 'E-commerce', 'Healthcare', 'Finance & Banking',
    'Real Estate', 'Food & Beverage', 'Fashion & Retail',
    'Sports & Fitness', 'Travel & Tourism', 'Consulting', 'Others'
];

const STATES = [
    'Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu', 'Kerala',
    'Maharashtra', 'Delhi', 'Uttar Pradesh', 'Gujarat', 'Rajasthan',
    'West Bengal', 'Madhya Pradesh', 'Bihar', 'Punjab', 'Haryana',
    'Odisha', 'Jharkhand', 'Assam', 'Chhattisgarh', 'Uttarakhand',
    'Goa', 'Others'
];

export default function RecruiterOnboardingCompanyPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [companyName, setCompanyName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [companyType, setCompanyType] = useState('');
    const [industry, setIndustry] = useState('');
    const [website, setWebsite] = useState('');
    const [linkedin, setLinkedin] = useState('');
    const [description, setDescription] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [address, setAddress] = useState('');
    const [panNumber, setPanNumber] = useState('');
    const [gstNumber, setGstNumber] = useState('');

    const isValid = companyName && contactPerson && email && phone && companyType && industry && address && panNumber;

    const handleSubmit = async () => {
        if (!isValid) return;
        setLoading(true);
        setError('');

        const res = await recruiterService.register({
            company_name: companyName,
            contact_person: contactPerson,
            email,
            phone,
            company_type: companyType,
            industry,
            website: website || undefined,
            linkedin: linkedin || undefined,
            description: description || undefined,
            city: city || undefined,
            state: state || undefined,
            address: address || undefined,
            gst_number: gstNumber || undefined,
            pan_number: panNumber || undefined,
        });

        if (res.success) {
            router.replace('/recruiter/onboarding/pending');
        } else {
            setError(res.error || 'Registration failed');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-black pt-6 pb-32 px-5">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="h-14 w-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="h-7 w-7 text-white" />
                    </div>
                    <h1 className="text-white text-xl font-bold">Company Details</h1>
                    <p className="text-white/40 text-sm mt-1">Tell us about your organization</p>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    {/* Company Name */}
                    <InputField label="Company / Agency Name" required icon={Building2}
                        value={companyName} onChange={setCompanyName} placeholder="e.g. TechCorp India" />

                    {/* Contact Person */}
                    <InputField label="Contact Person" required icon={User}
                        value={contactPerson} onChange={setContactPerson} placeholder="Full Name" />

                    {/* Email */}
                    <InputField label="Business Email" required icon={Mail} type="email"
                        value={email} onChange={setEmail} placeholder="hr@company.com" />

                    {/* Phone */}
                    <InputField label="Phone Number" required icon={Phone} type="tel"
                        value={phone} onChange={setPhone} placeholder="+91 98765 43210" />

                    {/* Company Type */}
                    <SelectField label="Company Type" required
                        value={companyType} onChange={setCompanyType}
                        options={COMPANY_TYPES.map(t => ({ value: t.value, label: t.label }))}
                        placeholder="Select type" />

                    {/* Industry */}
                    <SelectField label="Industry" required
                        value={industry} onChange={setIndustry}
                        options={INDUSTRIES.map(i => ({ value: i, label: i }))}
                        placeholder="Select industry" />

                    {/* Location */}
                    <div className="grid grid-cols-2 gap-3">
                        <InputField label="City" icon={MapPin}
                            value={city} onChange={setCity} placeholder="e.g. Hyderabad" />
                        <SelectField label="State"
                            value={state} onChange={setState}
                            options={STATES.map(s => ({ value: s, label: s }))}
                            placeholder="Select" />
                    </div>

                    {/* Website */}
                    <InputField label="Company Website" icon={Globe}
                        value={website} onChange={setWebsite} placeholder="https://company.com" />

                    {/* LinkedIn */}
                    <InputField label="LinkedIn Company Page" icon={Globe}
                        value={linkedin} onChange={setLinkedin} placeholder="https://linkedin.com/company/..." />

                    {/* Address */}
                    <div className="col-span-2">
                        <label className="text-white/50 text-xs font-semibold mb-1.5 block">Registered Address *</label>
                        <textarea
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            placeholder="Complete street address..."
                            rows={2}
                            className="w-full p-4 rounded-xl text-sm bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-white/30 resize-none focus:outline-none focus:ring-2 focus:ring-green-500/30"
                        />
                    </div>

                    {/* GST & PAN */}
                    <div className="grid grid-cols-2 gap-3">
                        <InputField label="PAN Number" required icon={FileText}
                            value={panNumber} onChange={setPanNumber} placeholder="ABCDE1234F" />
                        <InputField label="GST Number (Optional)" icon={FileText}
                            value={gstNumber} onChange={setGstNumber} placeholder="22AAAAA0000A1Z5" />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-white/50 text-xs font-semibold mb-1.5 block">About Company</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Brief description of what your company does..."
                            rows={3}
                            className="w-full p-4 rounded-xl text-sm bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-white/30 resize-none focus:outline-none focus:ring-2 focus:ring-green-500/30"
                        />
                    </div>

                    {error && (
                        <p className="text-red-400 text-xs bg-red-500/10 p-3 rounded-xl">{error}</p>
                    )}
                </div>

                {/* Submit */}
                <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl pb-[max(env(safe-area-inset-bottom),16px)] border-t border-white/[0.06]">
                    <div className="max-w-lg mx-auto px-5 pt-3">
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={handleSubmit}
                            disabled={!isValid || loading}
                            className="w-full h-14 bg-green-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 hover:bg-green-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    Submit for Verification
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </motion.button>
                        <p className="text-white/20 text-[10px] text-center mt-2">
                            Your details will be verified by our team within 24 hours
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Reusable input field
function InputField({ label, value, onChange, placeholder, icon: Icon, required, type = 'text' }: {
    label: string; value: string; onChange: (v: string) => void; placeholder: string;
    icon?: any; required?: boolean; type?: string;
}) {
    return (
        <div>
            <label className="text-white/50 text-xs font-semibold mb-1.5 flex items-center gap-1">
                {label}
                {required && <span className="text-green-500">*</span>}
            </label>
            <div className="relative">
                {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />}
                <input
                    type={type}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full h-12 ${Icon ? 'pl-11' : 'pl-4'} pr-4 rounded-xl text-sm bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-green-500/30`}
                />
            </div>
        </div>
    );
}

// Reusable select field
function SelectField({ label, value, onChange, options, placeholder, required }: {
    label: string; value: string; onChange: (v: string) => void;
    options: { value: string; label: string }[]; placeholder: string; required?: boolean;
}) {
    return (
        <div>
            <label className="text-white/50 text-xs font-semibold mb-1.5 flex items-center gap-1">
                {label}
                {required && <span className="text-green-500">*</span>}
            </label>
            <div className="relative">
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl text-sm bg-white/[0.03] border border-white/[0.06] text-white appearance-none focus:outline-none focus:ring-2 focus:ring-green-500/30"
                >
                    <option value="" disabled className="bg-gray-900">{placeholder}</option>
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value} className="bg-gray-900">{opt.label}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 pointer-events-none" />
            </div>
        </div>
    );
}
