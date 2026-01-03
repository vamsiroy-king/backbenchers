// Student Service - Supabase CRUD operations for students

import { supabase } from '../supabase';
import { Student, StudentFilters, ApiResponse } from '../types';

// Map database row to frontend Student type
const mapDbToStudent = (row: any): Student => ({
    id: row.id,
    bbId: row.bb_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    college: row.college,
    city: row.city,
    state: row.state,
    dob: row.dob,
    gender: row.gender,
    profileImage: row.profile_image_url,
    status: row.status,
    totalSavings: Number(row.total_savings) || 0,
    totalRedemptions: row.total_redemptions || 0,
    createdAt: row.created_at,
    verifiedAt: row.verified_at,
    selectedCity: row.selected_city,
});

// Location data for filters
export const LOCATION_DATA = {
    states: ['Karnataka', 'Maharashtra', 'Delhi', 'Telangana', 'Tamil Nadu', 'Gujarat', 'Rajasthan'],
    cities: {
        'Karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubli'],
        'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik'],
        'Delhi': ['Delhi', 'New Delhi'],
        'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad'],
        'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai'],
        'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara'],
        'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur']
    } as Record<string, string[]>,
    colleges: {
        'Bengaluru': ['Alliance University', 'Christ University', 'PES University', 'RV College'],
        'Mumbai': ['IIT Bombay', 'VJTI', 'NMIMS', 'DJ Sanghvi'],
        'Delhi': ['IIT Delhi', 'DTU', 'NSUT', 'IIIT Delhi'],
        'Hyderabad': ['BITS Pilani', 'IIIT Hyderabad', 'Osmania University'],
        'Chennai': ['IIT Madras', 'Anna University', 'SRM', 'VIT'],
        'Pune': ['COEP', 'VIT Pune', 'Symbiosis'],
        'Ahmedabad': ['IIT Gandhinagar', 'DAIICT', 'Nirma University']
    } as Record<string, string[]>
};

export const studentService = {
    // Get all students with filters
    async getAll(filters?: StudentFilters): Promise<ApiResponse<Student[]>> {
        try {
            let query = supabase
                .from('students')
                .select('*')
                .order('created_at', { ascending: false });

            // Apply filters
            if (filters) {
                if (filters.status && filters.status !== 'all') {
                    query = query.eq('status', filters.status);
                }
                if (filters.state) {
                    query = query.eq('state', filters.state);
                }
                if (filters.city) {
                    query = query.eq('city', filters.city);
                }
                if (filters.college) {
                    query = query.eq('college', filters.college);
                }
                if (filters.search) {
                    query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
                }
                if (filters.bbIdSearch) {
                    query = query.ilike('bb_id', `%${filters.bbIdSearch}%`);
                }
            }

            const { data, error } = await query;

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            const students = data.map(mapDbToStudent);
            return { success: true, data: students, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Get single student by ID
    async getById(id: string): Promise<ApiResponse<Student>> {
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: mapDbToStudent(data), error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Get student by BB-ID
    async getByBbId(bbId: string): Promise<ApiResponse<Student>> {
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('bb_id', bbId)
                .single();

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: mapDbToStudent(data), error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Get current user's student profile - checks by user_id first, then by email
    async getMyProfile(): Promise<ApiResponse<Student>> {
        try {
            // DEV MODE flag
            const IS_DEV = process.env.NODE_ENV === 'development';

            // DEV MODE: Check for dev test user in localStorage FIRST
            if (IS_DEV && typeof window !== 'undefined') {
                const devTestUser = localStorage.getItem('dev_test_user');
                if (devTestUser) {
                    try {
                        const studentData = JSON.parse(devTestUser);
                        console.log('DEV MODE: Using dev test user for profile:', studentData.email);
                        return {
                            success: true,
                            data: mapDbToStudent(studentData),
                            error: null
                        };
                    } catch (e) {
                        console.error('Failed to parse dev test user:', e);
                        localStorage.removeItem('dev_test_user');
                    }
                }
            }

            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // First try by user_id
                let { data, error } = await supabase
                    .from('students')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (data) {
                    return { success: true, data: mapDbToStudent(data), error: null };
                }

                // If not found by user_id, try by email (for returning users with mismatched user_id)
                const userEmail = user.email?.toLowerCase();
                if (userEmail) {
                    const { data: studentByEmail, error: emailError } = await supabase
                        .from('students')
                        .select('*')
                        .eq('email', userEmail)
                        .maybeSingle();

                    if (studentByEmail) {
                        // Sync the user_id
                        if (studentByEmail.user_id !== user.id) {
                            await supabase
                                .from('students')
                                .update({ user_id: user.id })
                                .eq('id', studentByEmail.id);
                        }
                        return { success: true, data: mapDbToStudent(studentByEmail), error: null };
                    }
                }
            }

            // DEV MODE: Return mock student data for testing
            if (IS_DEV && typeof window !== 'undefined') {
                let devStudentId = localStorage.getItem('dev_student_id');
                if (!devStudentId) {
                    devStudentId = crypto.randomUUID();
                    localStorage.setItem('dev_student_id', devStudentId);
                }

                console.log('DEV MODE: Using mock student profile');
                const mockStudent: Student = {
                    id: devStudentId,
                    bbId: 'BB-123456',
                    name: 'Test Student',
                    email: 'test@student.edu',
                    phone: '+91 9876543210',
                    college: 'Test University',
                    city: 'Bengaluru',
                    state: 'Karnataka',
                    dob: '2005-06-06',
                    gender: 'Male',
                    profileImage: undefined,
                    status: 'verified',

                    totalRedemptions: 0,
                    totalSavings: 0,
                    createdAt: new Date().toISOString(),
                };
                return { success: true, data: mockStudent, error: null };
            }

            return { success: false, data: null, error: 'No student profile found' };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Update student
    async update(id: string, data: Partial<Student>): Promise<ApiResponse<Student>> {
        try {
            // Map frontend fields to database columns
            const dbData: any = {};
            if (data.name) dbData.name = data.name;
            if (data.phone) dbData.phone = data.phone;
            if (data.profileImage !== undefined) dbData.profile_image_url = data.profileImage;
            if (data.status) dbData.status = data.status;

            const { data: updated, error } = await supabase
                .from('students')
                .update(dbData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: mapDbToStudent(updated), error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Update profile image and generate BB ID if first photo upload
    async updateProfileImage(file: File): Promise<ApiResponse<string>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, data: null, error: 'Not authenticated' };
            }

            // Add timestamp for cache busting
            const timestamp = Date.now();
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/profile_${timestamp}.${fileExt}`;

            console.log('Uploading file to path:', filePath);
            // Upload to storage
            const { error: uploadError } = await supabase.storage
                .from('student-profiles')
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                console.error('Upload Error:', uploadError);
                return { success: false, data: null, error: uploadError.message };
            }

            // Get public URL with cache-busting timestamp
            const { data: urlData } = supabase.storage
                .from('student-profiles')
                .getPublicUrl(filePath);

            const imageUrl = `${urlData.publicUrl}?t=${timestamp}`;

            // Check if student already has a BB ID
            const { data: existingStudent } = await supabase
                .from('students')
                .select('id, bb_id')
                .eq('user_id', user.id)
                .single();

            let newBbId: string | null = null;

            // If no BB ID exists, generate one
            if (existingStudent && !existingStudent.bb_id) {
                console.log('Student has no BB ID, generating one...');

                // Generate unique BB ID (numbers only, like BBM ID)
                const generateUniqueBbId = async (): Promise<string> => {
                    for (let i = 0; i < 10; i++) {
                        // Generate 6-digit number: 100000 to 999999
                        const randomNum = Math.floor(100000 + Math.random() * 900000);
                        const candidateId = `BB-${randomNum}`;
                        const { data: existing } = await supabase
                            .from('students')
                            .select('id')
                            .eq('bb_id', candidateId)
                            .single();
                        if (!existing) {
                            return candidateId;
                        }
                    }
                    // Fallback with timestamp
                    return `BB-${Date.now().toString().slice(-6)}`;
                };

                newBbId = await generateUniqueBbId();
                console.log('Generated new BB ID:', newBbId);
            }

            // Update student record with image URL and BB ID (if generated)
            const updateData: any = { profile_image_url: imageUrl };
            if (newBbId) {
                updateData.bb_id = newBbId;
            }

            console.log('Saving to DB for user:', user.id, updateData);
            const { error: updateError, count } = await supabase
                .from('students')
                .update(updateData)
                .eq('user_id', user.id)
                .select('id');

            if (updateError) {
                console.error('DB Update Error:', updateError);
                return { success: false, data: null, error: updateError.message };
            }

            if (count === 0) {
                console.error('No rows updated! Possible mismatch in user_id or RLS blocking.');
                // Fallback: Try updating by email if user_id failed
                if (user.email) {
                    console.log('Attempting fallback update by email:', user.email);
                    const { error: emailUpdateError, count: emailCount } = await supabase
                        .from('students')
                        .update(updateData)
                        .eq('email', user.email)
                        .select('id');

                    if (emailUpdateError || emailCount === 0) {
                        return { success: false, data: null, error: "Could not link image to student record. Please contact support." };
                    }
                } else {
                    return { success: false, data: null, error: "No student record found for this user." };
                }
            }

            console.log('Profile image saved successfully!' + (newBbId ? ` BB ID generated: ${newBbId}` : ''));
            return { success: true, data: imageUrl, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Suspend student (admin only)
    async suspend(id: string): Promise<ApiResponse<void>> {
        try {
            const { error } = await supabase
                .from('students')
                .update({ status: 'suspended' })
                .eq('id', id);

            if (error) {
                return { success: false, data: undefined, error: error.message };
            }

            return { success: true, data: undefined, error: null };
        } catch (error: any) {
            return { success: false, data: undefined, error: error.message };
        }
    },

    // Reinstate student (admin only)
    async reinstate(id: string): Promise<ApiResponse<void>> {
        try {
            const { error } = await supabase
                .from('students')
                .update({ status: 'verified' })
                .eq('id', id);

            if (error) {
                return { success: false, data: undefined, error: error.message };
            }

            return { success: true, data: undefined, error: null };
        } catch (error: any) {
            return { success: false, data: undefined, error: error.message };
        }
    },

    // Update student status (admin only)
    async updateStatus(id: string, status: 'verified' | 'pending' | 'suspended'): Promise<ApiResponse<void>> {
        try {

            // Use .select() to verify the update actually happened
            const { data, error, count } = await supabase
                .from('students')
                .update({ status })
                .eq('id', id)
                .select('id, status');

            if (error) {
                console.error('Error updating student status:', error);
                return { success: false, data: undefined, error: error.message };
            }

            // Check if any rows were actually updated
            if (!data || data.length === 0) {
                console.error('Update returned no rows - RLS policy may be blocking update');
                return {
                    success: false,
                    data: undefined,
                    error: 'Update failed - you may not have permission to update this student. Check if you are logged in as admin.'
                };
            }

            // Verify the status was actually changed
            if (data[0].status !== status) {
                console.error('Status not updated correctly. Expected:', status, 'Got:', data[0].status);
                return { success: false, data: undefined, error: 'Status was not updated correctly' };
            }

            return { success: true, data: undefined, error: null };
        } catch (error: any) {
            console.error('Exception updating student status:', error);
            return { success: false, data: undefined, error: error.message };
        }
    },

    // Delete student (admin only) - Uses RLS policies for authorization
    async delete(id: string): Promise<ApiResponse<void>> {
        try {
            // Delete related transactions first (RLS allows admin delete)
            await supabase
                .from('transactions')
                .delete()
                .eq('student_id', id);

            // Delete favorites
            await supabase
                .from('favorites')
                .delete()
                .eq('student_id', id);

            // Delete the student (RLS policy allows admin delete)
            const { error } = await supabase
                .from('students')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Delete student error:', error);
                return { success: false, data: undefined, error: error.message };
            }

            return { success: true, data: undefined, error: null };
        } catch (error: any) {
            console.error('Delete student exception:', error);
            return { success: false, data: undefined, error: error.message };
        }
    },

    // Get stats (admin dashboard)
    async getStats(): Promise<{
        total: number;
        verified: number;
        pending: number;
        suspended: number;
    }> {
        try {
            const { count: total } = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true });

            const { count: verified } = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'verified');

            const { count: pending } = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            const { count: suspended } = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'suspended');

            return {
                total: total || 0,
                verified: verified || 0,
                pending: pending || 0,
                suspended: suspended || 0
            };
        } catch (error) {
            return { total: 0, verified: 0, pending: 0, suspended: 0 };
        }
    },

    // Get student's transaction history with savings
    async getTransactionHistory(studentId: string): Promise<ApiResponse<any[]>> {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('student_id', studentId)
                .order('redeemed_at', { ascending: false });

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: data || [], error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    }
};
