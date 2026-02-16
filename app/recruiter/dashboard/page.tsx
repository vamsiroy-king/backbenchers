"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Users, ListChecks, Eye, TrendingUp, PlusCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { recruiterService, Recruiter } from "@/lib/services/recruiter.service";

export default function RecruiterDashboardPage() {
    const [recruiter, setRecruiter] = useState<Recruiter | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            recruiterService.getMyProfile(),
            recruiterService.getDashboardStats(),
        ]).then(([profileRes, statsRes]) => {
            if (profileRes.success) setRecruiter(profileRes.data || null);
            if (statsRes.success) setStats(statsRes.data);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-white/20" />
            </div>
        );
    }

    const statCards = [
        { label: 'Total Listings', value: stats?.totalListings || 0, icon: ListChecks, color: 'text-blue-400' },
        { label: 'Active', value: stats?.activeListings || 0, icon: Eye, color: 'text-green-400' },
        { label: 'Pending Review', value: stats?.pendingListings || 0, icon: Briefcase, color: 'text-amber-400' },
        { label: 'Applications', value: stats?.totalApplications || 0, icon: Users, color: 'text-purple-400' },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Welcome Header */}
            <div>
                <h1 className="text-white text-2xl font-bold">
                    Welcome, {recruiter?.contact_person || 'Recruiter'}
                </h1>
                <p className="text-white/40 text-sm mt-1">
                    {recruiter?.company_name} · BBR ID: {recruiter?.bbr_id}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map(({ label, value, icon: Icon, color }) => (
                    <motion.div
                        key={label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4"
                    >
                        <Icon className={`h-6 w-6 ${color} mb-3`} />
                        <p className="text-white text-2xl font-bold">{value}</p>
                        <p className="text-white/40 text-xs mt-0.5">{label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/recruiter/dashboard/post">
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20 rounded-2xl p-6 cursor-pointer group"
                    >
                        <PlusCircle className="h-8 w-8 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
                        <h3 className="text-white font-bold text-lg">Post a New Opportunity</h3>
                        <p className="text-white/40 text-sm mt-1">Create a job listing and reach thousands of students</p>
                    </motion.div>
                </Link>

                <Link href="/recruiter/dashboard/applicants">
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 cursor-pointer group"
                    >
                        <Users className="h-8 w-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                        <h3 className="text-white font-bold text-lg">View Applicants</h3>
                        <p className="text-white/40 text-sm mt-1">Review student profiles, portfolios, and applications</p>
                    </motion.div>
                </Link>
            </div>

            {/* Plan Info */}
            {recruiter && (
                <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/30 text-xs uppercase tracking-widest font-semibold">Current Plan</p>
                            <p className="text-white font-bold text-lg capitalize mt-0.5">{recruiter.plan}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-white/30 text-xs">Total Postings</p>
                            <p className="text-white font-bold">{recruiter.total_postings}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
