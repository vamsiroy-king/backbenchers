import { supabase } from '@/lib/supabase';

// =============================================
// Types
// =============================================

export interface OpportunityCategory {
    id: string;
    name: string;
    icon: string;
    description: string;
    display_order: number;
    is_active: boolean;
}

export interface Opportunity {
    id: string;
    recruiter_id: string;
    category_id: string;
    title: string;
    description: string;
    type: 'freelance' | 'internship' | 'part_time' | 'full_time' | 'contract';
    work_mode: 'remote' | 'onsite' | 'hybrid';
    experience_level: 'beginner' | 'intermediate' | 'expert' | 'any';
    compensation: string | null;
    compensation_type: 'paid' | 'unpaid' | 'stipend' | 'commission';
    skills_required: string[];
    vacancies: number;
    duration: string | null;
    city: string | null;
    is_pan_india: boolean;
    terms: string | null;
    apply_method: 'in_app' | 'whatsapp' | 'email' | 'external';
    apply_link: string | null;
    status: string;
    total_applications: number;
    expires_at: string | null;
    created_at: string;
    // Joined fields
    recruiter?: {
        company_name: string;
        logo_url: string | null;
        industry: string;
        bbr_id: string;
    };
    category?: {
        name: string;
        icon: string;
    };
}

export interface HustleProfile {
    id: string;
    student_id: string;
    headline: string | null;
    bio: string | null;
    skills: string[];
    experience_level: 'beginner' | 'intermediate' | 'expert';
    portfolio_links: { title: string; url: string; type: string }[];
    resume_url: string | null;
    is_available: boolean;
    preferred_work_mode: string;
    preferred_types: string[];
    created_at: string;
    updated_at: string;
}

export interface OpportunityApplication {
    id: string;
    opportunity_id: string;
    student_id: string;
    hustle_profile_id: string | null;
    cover_note: string | null;
    status: 'applied' | 'viewed' | 'shortlisted' | 'hired' | 'rejected';
    applied_at: string;
}

// =============================================
// Filters
// =============================================

export interface OpportunityFilters {
    category_id?: string;
    type?: string;
    work_mode?: string;
    experience_level?: string;
    city?: string;
    search?: string;
    limit?: number;
    offset?: number;
}

// =============================================
// Service
// =============================================

export const hustleService = {

    // -------------------------------------------
    // Categories
    // -------------------------------------------
    async getCategories(): Promise<{ success: boolean; data?: OpportunityCategory[]; error?: string }> {
        try {
            const { data, error } = await supabase
                .from('opportunity_categories')
                .select('*')
                .eq('is_active', true)
                .order('display_order');

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error: any) {
            console.error('Error fetching opportunity categories:', error);
            return { success: false, error: error.message };
        }
    },

    // -------------------------------------------
    // Opportunities (Browse)
    // -------------------------------------------
    async getOpportunities(filters: OpportunityFilters = {}): Promise<{ success: boolean; data?: Opportunity[]; error?: string; count?: number }> {
        try {
            let query = supabase
                .from('opportunities')
                .select(`
                    *,
                    recruiter:recruiters!recruiter_id (
                        company_name,
                        logo_url,
                        industry,
                        bbr_id
                    ),
                    category:opportunity_categories!category_id (
                        name,
                        icon
                    )
                `, { count: 'exact' })
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            // Apply filters
            if (filters.category_id) {
                query = query.eq('category_id', filters.category_id);
            }
            if (filters.type) {
                query = query.eq('type', filters.type);
            }
            if (filters.work_mode) {
                query = query.eq('work_mode', filters.work_mode);
            }
            if (filters.experience_level) {
                query = query.eq('experience_level', filters.experience_level);
            }
            if (filters.city) {
                // Show opportunities for the selected city OR pan-India
                query = query.or(`city.ilike.%${filters.city}%,is_pan_india.eq.true`);
            }
            if (filters.search) {
                query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
            }

            // Pagination
            const limit = filters.limit || 20;
            const offset = filters.offset || 0;
            query = query.range(offset, offset + limit - 1);

            const { data, error, count } = await query;
            if (error) throw error;

            return { success: true, data: data || [], count: count || 0 };
        } catch (error: any) {
            console.error('Error fetching opportunities:', error);
            return { success: false, error: error.message };
        }
    },

    // -------------------------------------------
    // Single Opportunity Detail
    // -------------------------------------------
    async getOpportunityById(id: string): Promise<{ success: boolean; data?: Opportunity; error?: string }> {
        try {
            const { data, error } = await supabase
                .from('opportunities')
                .select(`
                    *,
                    recruiter:recruiters!recruiter_id (
                        company_name,
                        logo_url,
                        industry,
                        bbr_id,
                        city,
                        website,
                        linkedin,
                        description
                    ),
                    category:opportunity_categories!category_id (
                        name,
                        icon
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error: any) {
            console.error('Error fetching opportunity:', error);
            return { success: false, error: error.message };
        }
    },

    // -------------------------------------------
    // Hustle Profile (Student)
    // -------------------------------------------
    async getMyProfile(): Promise<{ success: boolean; data?: HustleProfile | null; error?: string }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, error: 'Not authenticated' };

            // Get student ID first
            const { data: student } = await supabase
                .from('students')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!student) return { success: true, data: null };

            const { data, error } = await supabase
                .from('hustle_profiles')
                .select('*')
                .eq('student_id', student.id)
                .maybeSingle();

            if (error) throw error;
            return { success: true, data: data || null };
        } catch (error: any) {
            console.error('Error fetching hustle profile:', error);
            return { success: false, error: error.message };
        }
    },

    async createOrUpdateProfile(profileData: Partial<HustleProfile>): Promise<{ success: boolean; data?: HustleProfile; error?: string }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, error: 'Not authenticated' };

            const { data: student } = await supabase
                .from('students')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!student) return { success: false, error: 'Student not found' };

            // Upsert profile
            const { data, error } = await supabase
                .from('hustle_profiles')
                .upsert({
                    student_id: student.id,
                    ...profileData,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'student_id' })
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error: any) {
            console.error('Error saving hustle profile:', error);
            return { success: false, error: error.message };
        }
    },

    // -------------------------------------------
    // Applications
    // -------------------------------------------
    async applyToOpportunity(opportunityId: string, coverNote?: string): Promise<{ success: boolean; error?: string }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, error: 'Not authenticated' };

            const { data: student } = await supabase
                .from('students')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!student) return { success: false, error: 'Student not found' };

            // Get hustle profile ID (optional)
            const { data: profile } = await supabase
                .from('hustle_profiles')
                .select('id')
                .eq('student_id', student.id)
                .maybeSingle();

            const { error } = await supabase
                .from('opportunity_applications')
                .insert({
                    opportunity_id: opportunityId,
                    student_id: student.id,
                    hustle_profile_id: profile?.id || null,
                    cover_note: coverNote || null,
                });

            if (error) {
                if (error.code === '23505') {
                    return { success: false, error: 'You have already applied to this opportunity' };
                }
                throw error;
            }
            return { success: true };
        } catch (error: any) {
            console.error('Error applying to opportunity:', error);
            return { success: false, error: error.message };
        }
    },

    async getMyApplications(): Promise<{ success: boolean; data?: any[]; error?: string }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, error: 'Not authenticated' };

            const { data: student } = await supabase
                .from('students')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!student) return { success: true, data: [] };

            const { data, error } = await supabase
                .from('opportunity_applications')
                .select(`
                    *,
                    opportunity:opportunities!opportunity_id (
                        title,
                        type,
                        compensation,
                        status,
                        recruiter:recruiters!recruiter_id (
                            company_name,
                            logo_url
                        )
                    )
                `)
                .eq('student_id', student.id)
                .order('applied_at', { ascending: false });

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error: any) {
            console.error('Error fetching applications:', error);
            return { success: false, error: error.message };
        }
    },

    async hasApplied(opportunityId: string): Promise<boolean> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            const { data: student } = await supabase
                .from('students')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!student) return false;

            const { data } = await supabase
                .from('opportunity_applications')
                .select('id')
                .eq('opportunity_id', opportunityId)
                .eq('student_id', student.id)
                .maybeSingle();

            return !!data;
        } catch {
            return false;
        }
    },
};
