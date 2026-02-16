import { supabase } from '@/lib/supabase';

// =============================================
// Types
// =============================================

export interface Recruiter {
    id: string;
    user_id: string;
    bbr_id: string;
    company_name: string;
    contact_person: string;
    email: string;
    phone: string;
    company_type: 'startup' | 'agency' | 'corporate' | 'freelancer' | 'ngo';
    industry: string;
    website: string | null;
    linkedin: string | null;
    logo_url: string | null;
    description: string | null;
    city: string | null;
    state: string | null;
    gst_number: string | null;
    status: 'pending' | 'verified' | 'rejected' | 'suspended';
    rejected_reason: string | null;
    plan: 'free' | 'starter' | 'pro' | 'enterprise';
    plan_expires_at: string | null;
    total_postings: number;
    created_at: string;
    verified_at: string | null;
}

export interface RecruiterOnboardingData {
    company_name: string;
    contact_person: string;
    email: string;
    phone: string;
    company_type: string;
    industry: string;
    website?: string;
    linkedin?: string;
    description?: string;
    city?: string;
    state?: string;
    gst_number?: string;
    logo_url?: string;
}

export interface PostOpportunityData {
    category_id: string;
    title: string;
    description: string;
    type: string;
    work_mode: string;
    experience_level: string;
    compensation?: string;
    compensation_type: string;
    skills_required: string[];
    vacancies: number;
    duration?: string;
    city?: string;
    is_pan_india: boolean;
    terms?: string;
    apply_method: string;
    apply_link?: string;
    expires_at?: string;
}

// =============================================
// Service
// =============================================

export const recruiterService = {

    // -------------------------------------------
    // Auth & Profile
    // -------------------------------------------
    async getMyProfile(): Promise<{ success: boolean; data?: Recruiter | null; error?: string }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, error: 'Not authenticated' };

            const { data, error } = await supabase
                .from('recruiters')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) throw error;
            return { success: true, data: data || null };
        } catch (error: any) {
            console.error('Error fetching recruiter profile:', error);
            return { success: false, error: error.message };
        }
    },

    async register(data: RecruiterOnboardingData): Promise<{ success: boolean; data?: Recruiter; error?: string }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, error: 'Not authenticated' };

            const { data: recruiter, error } = await supabase
                .from('recruiters')
                .insert({
                    user_id: user.id,
                    ...data,
                })
                .select()
                .single();

            if (error) throw error;
            return { success: true, data: recruiter };
        } catch (error: any) {
            console.error('Error registering recruiter:', error);
            return { success: false, error: error.message };
        }
    },

    async updateProfile(updates: Partial<RecruiterOnboardingData>): Promise<{ success: boolean; error?: string }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, error: 'Not authenticated' };

            const { error } = await supabase
                .from('recruiters')
                .update(updates)
                .eq('user_id', user.id);

            if (error) throw error;
            return { success: true };
        } catch (error: any) {
            console.error('Error updating recruiter:', error);
            return { success: false, error: error.message };
        }
    },

    // -------------------------------------------
    // Opportunities Management
    // -------------------------------------------
    async postOpportunity(data: PostOpportunityData): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, error: 'Not authenticated' };

            // Get recruiter ID
            const { data: recruiter } = await supabase
                .from('recruiters')
                .select('id, status, plan')
                .eq('user_id', user.id)
                .single();

            if (!recruiter) return { success: false, error: 'Recruiter profile not found' };
            if (recruiter.status !== 'verified') return { success: false, error: 'Your account is not verified yet' };

            const { data: opportunity, error } = await supabase
                .from('opportunities')
                .insert({
                    recruiter_id: recruiter.id,
                    ...data,
                    status: 'pending_review', // Always pending until admin approves
                })
                .select()
                .single();

            if (error) throw error;

            // Increment total_postings
            await supabase
                .from('recruiters')
                .update({ total_postings: (recruiter as any).total_postings + 1 })
                .eq('id', recruiter.id);

            return { success: true, data: opportunity };
        } catch (error: any) {
            console.error('Error posting opportunity:', error);
            return { success: false, error: error.message };
        }
    },

    async getMyListings(): Promise<{ success: boolean; data?: any[]; error?: string }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, error: 'Not authenticated' };

            const { data: recruiter } = await supabase
                .from('recruiters')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!recruiter) return { success: true, data: [] };

            const { data, error } = await supabase
                .from('opportunities')
                .select(`
                    *,
                    category:opportunity_categories!category_id (name, icon)
                `)
                .eq('recruiter_id', recruiter.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error: any) {
            console.error('Error fetching listings:', error);
            return { success: false, error: error.message };
        }
    },

    async updateOpportunity(id: string, updates: Partial<PostOpportunityData>): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabase
                .from('opportunities')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error: any) {
            console.error('Error updating opportunity:', error);
            return { success: false, error: error.message };
        }
    },

    async deleteOpportunity(id: string): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabase
                .from('opportunities')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error: any) {
            console.error('Error deleting opportunity:', error);
            return { success: false, error: error.message };
        }
    },

    // -------------------------------------------
    // Applicants
    // -------------------------------------------
    async getApplicantsForOpportunity(opportunityId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
        try {
            const { data, error } = await supabase
                .from('opportunity_applications')
                .select(`
                    *,
                    student:students!student_id (
                        id,
                        name,
                        email,
                        bb_id,
                        college,
                        city,
                        profile_image_url
                    ),
                    hustle_profile:hustle_profiles!hustle_profile_id (
                        headline,
                        bio,
                        skills,
                        experience_level,
                        portfolio_links,
                        resume_url,
                        is_available
                    )
                `)
                .eq('opportunity_id', opportunityId)
                .order('applied_at', { ascending: false });

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error: any) {
            console.error('Error fetching applicants:', error);
            return { success: false, error: error.message };
        }
    },

    async getAllApplicants(): Promise<{ success: boolean; data?: any[]; error?: string }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, error: 'Not authenticated' };

            const { data: recruiter } = await supabase
                .from('recruiters')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!recruiter) return { success: true, data: [] };

            const { data, error } = await supabase
                .from('opportunity_applications')
                .select(`
                    *,
                    opportunity:opportunities!opportunity_id (
                        title,
                        type,
                        recruiter_id
                    ),
                    student:students!student_id (
                        id,
                        name,
                        email,
                        bb_id,
                        college,
                        city,
                        profile_image_url
                    ),
                    hustle_profile:hustle_profiles!hustle_profile_id (
                        headline,
                        skills,
                        experience_level,
                        portfolio_links
                    )
                `)
                .order('applied_at', { ascending: false });

            if (error) throw error;

            // Filter to only show applicants for this recruiter's opportunities
            const filtered = (data || []).filter((app: any) =>
                app.opportunity?.recruiter_id === recruiter.id
            );

            return { success: true, data: filtered };
        } catch (error: any) {
            console.error('Error fetching all applicants:', error);
            return { success: false, error: error.message };
        }
    },

    async updateApplicationStatus(applicationId: string, status: string, notes?: string): Promise<{ success: boolean; error?: string }> {
        try {
            const updates: any = { status };
            if (notes !== undefined) updates.recruiter_notes = notes;

            const { error } = await supabase
                .from('opportunity_applications')
                .update(updates)
                .eq('id', applicationId);

            if (error) throw error;
            return { success: true };
        } catch (error: any) {
            console.error('Error updating application:', error);
            return { success: false, error: error.message };
        }
    },

    // -------------------------------------------
    // Dashboard Stats
    // -------------------------------------------
    async getDashboardStats(): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, error: 'Not authenticated' };

            const { data: recruiter } = await supabase
                .from('recruiters')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!recruiter) return { success: true, data: null };

            // Get listing counts
            const { data: listings } = await supabase
                .from('opportunities')
                .select('id, status, total_applications')
                .eq('recruiter_id', recruiter.id);

            const activeListings = (listings || []).filter(l => l.status === 'active').length;
            const pendingListings = (listings || []).filter(l => l.status === 'pending_review').length;
            const totalApplications = (listings || []).reduce((sum, l) => sum + (l.total_applications || 0), 0);

            return {
                success: true,
                data: {
                    totalListings: listings?.length || 0,
                    activeListings,
                    pendingListings,
                    totalApplications,
                }
            };
        } catch (error: any) {
            console.error('Error fetching dashboard stats:', error);
            return { success: false, error: error.message };
        }
    },
};
