"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Building2, User, Mail, Phone, Globe, MapPin, FileText, Save, CheckCircle2 } from "lucide-react";
import { recruiterService, Recruiter, RecruiterOnboardingData } from "@/lib/services/recruiter.service";

export default function RecruiterProfilePage() {
    const [recruiter, setRecruiter] = useState<Recruiter | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [companyName, setCompanyName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [website, setWebsite] = useState('');
    const [linkedin, setLinkedin] = useState('');
    const [description, setDescription] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');

    useEffect(() => {
        recruiterService.getMyProfile().then(res => {
            if (res.success && res.data) {
                const r = res.data;
                setRecruiter(r);
                setCompanyName(r.company_name);
                setContactPerson(r.contact_person);
                setEmail(r.email);
                setPhone(r.phone);
                setWebsite(r.website || '');
                setLinkedin(r.linkedin || '');
                setDescription(r.description || '');
                setCity(r.city || '');
                setState(r.state || '');
            }
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const res = await recruiterService.updateProfile({
            company_name: companyName,
            contact_person: contactPerson,
            email,
            phone,
            website: website || undefined,
            linkedin: linkedin || undefined,
            description: description || undefined,
            city: city || undefined,
            state: state || undefined,
        });
        if (res.success) {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
        setSaving(false);
    };

    if (loading) return <div className="flex justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-white/20 mt-20" /></div>;

    return (
        <div className="max-w-2xl mx-auto pb-32">
            <div className="mb-8">
                <h1 className="text-white text-xl font-bold">Profile Settings</h1>
                <p className="text-white/40 text-xs mt-1">Update your company information</p>
            </div>

            {/* Status Badge */}
            {recruiter && (
                <div className={`mb-6 p-4 rounded-2xl border ${recruiter.status === 'verified' ? 'bg-green-500/10 border-green-500/20' :
                        recruiter.status === 'pending' ? 'bg-amber-500/10 border-amber-500/20' :
                            'bg-red-500/10 border-red-500/20'
                    }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/60 text-xs">Account Status</p>
                            <p className={`text-sm font-bold capitalize ${recruiter.status === 'verified' ? 'text-green-400' :
                                    recruiter.status === 'pending' ? 'text-amber-400' :
                                        'text-red-400'
                                }`}>{recruiter.status}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-white/30 text-xs">BBR ID</p>
                            <p className="text-white/70 text-sm font-mono">{recruiter.bbr_id}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <Field label="Company Name" icon={Building2} value={companyName} onChange={setCompanyName} />
                <Field label="Contact Person" icon={User} value={contactPerson} onChange={setContactPerson} />
                <Field label="Email" icon={Mail} value={email} onChange={setEmail} type="email" />
                <Field label="Phone" icon={Phone} value={phone} onChange={setPhone} type="tel" />
                <Field label="Website" icon={Globe} value={website} onChange={setWebsite} />
                <Field label="LinkedIn" icon={Globe} value={linkedin} onChange={setLinkedin} />
                <div className="grid grid-cols-2 gap-3">
                    <Field label="City" icon={MapPin} value={city} onChange={setCity} />
                    <Field label="State" icon={MapPin} value={state} onChange={setState} />
                </div>
                <div>
                    <label className="text-white/50 text-xs font-semibold mb-1.5 block">About Company</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)}
                        rows={3}
                        className="w-full p-4 rounded-xl text-sm bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-white/30 resize-none focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                </div>
            </div>

            {/* Save Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl pb-[max(env(safe-area-inset-bottom),16px)] border-t border-white/[0.06] z-50">
                <div className="max-w-2xl mx-auto px-5 pt-3">
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full h-12 bg-green-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : saved ? <><CheckCircle2 className="h-5 w-5" /> Saved!</> : <><Save className="h-4 w-4" /> Save Changes</>}
                    </motion.button>
                </div>
            </div>
        </div>
    );
}

function Field({ label, value, onChange, icon: Icon, type = 'text' }: {
    label: string; value: string; onChange: (v: string) => void; icon: any; type?: string;
}) {
    return (
        <div>
            <label className="text-white/50 text-xs font-semibold mb-1.5 block">{label}</label>
            <div className="relative">
                <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                <input type={type} value={value} onChange={e => onChange(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 rounded-xl text-sm bg-white/[0.03] border border-white/[0.06] text-white focus:outline-none focus:ring-2 focus:ring-green-500/30" />
            </div>
        </div>
    );
}
