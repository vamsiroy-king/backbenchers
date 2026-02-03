// Analytics Service - Fetches data for Admin Dashboard insights

import { supabase } from '../supabase';

export interface DashboardStats {
    totalStudents: number;
    verifiedStudents: number;
    pendingStudents: number;
    totalMerchants: number;
    approvedMerchants: number;
    pendingMerchants: number;
    totalOffers: number;
    activeOffers: number;
    totalTransactions: number;
    todayTransactions: number;
    weekTransactions: number;
    totalRevenue: number;
    totalSavings: number;
    todayRevenue: number;
    todaySavings: number;
}

export interface RevenueDataPoint {
    date: string;
    transactionsCount: number;
    revenue: number;
    savings: number;
}

export interface TopMerchant {
    merchantId: string;
    businessName: string;
    city: string;
    category: string;
    transactionCount: number;
    revenue: number;
    avgRating: number;
}

export interface CityDistribution {
    city: string;
    studentsCount: number;
    merchantsCount: number;
    transactionsCount: number;
}

export interface CategoryPerformance {
    category: string;
    merchantsCount: number;
    offersCount: number;
    transactionsCount: number;
    revenue: number;
}

export const analyticsService = {
    // Get dashboard overview stats using server-side API (bypasses RLS for accurate data)
    async getDashboardStats(): Promise<DashboardStats> {
        try {
            // Use server-side API with service role key for accurate transaction data
            const response = await fetch('/api/admin/stats');
            const result = await response.json();

            if (result.success && result.data) {
                return result.data;
            }

            // Fallback to RPC if API fails
            console.warn('[Analytics] API failed, trying RPC fallback');
            const { data, error } = await supabase.rpc('get_admin_dashboard_stats');

            if (error) {
                console.error('Error fetching dashboard stats:', error);
                return getDefaultStats();
            }

            if (data && data.length > 0) {
                const row = data[0];
                return {
                    totalStudents: row.total_students || 0,
                    verifiedStudents: row.verified_students || 0,
                    pendingStudents: row.pending_students || 0,
                    totalMerchants: row.total_merchants || 0,
                    approvedMerchants: row.approved_merchants || 0,
                    pendingMerchants: row.pending_merchants || 0,
                    totalOffers: row.total_offers || 0,
                    activeOffers: row.active_offers || 0,
                    totalTransactions: row.total_transactions || 0,
                    todayTransactions: row.today_transactions || 0,
                    weekTransactions: row.week_transactions || 0,
                    totalRevenue: parseFloat(row.total_revenue) || 0,
                    totalSavings: parseFloat(row.total_savings) || 0,
                    todayRevenue: parseFloat(row.today_revenue) || 0,
                    todaySavings: parseFloat(row.today_savings) || 0,
                };
            }

            return getDefaultStats();
        } catch (error) {
            console.error('Analytics error:', error);
            return getDefaultStats();
        }
    },

    // Get revenue data for chart
    async getRevenueByDateRange(startDate: string, endDate: string): Promise<RevenueDataPoint[]> {
        try {
            const { data, error } = await supabase.rpc('get_revenue_by_date_range', {
                start_date: startDate,
                end_date: endDate
            });

            if (error) {
                console.error('Error fetching revenue data:', error);
                return [];
            }

            return (data || []).map((row: any) => ({
                date: row.date,
                transactionsCount: row.transactions_count || 0,
                revenue: parseFloat(row.revenue) || 0,
                savings: parseFloat(row.savings) || 0,
            }));
        } catch (error) {
            console.error('Revenue analytics error:', error);
            return [];
        }
    },

    // Get top performing merchants
    async getTopMerchants(limit: number = 10): Promise<TopMerchant[]> {
        try {
            const { data, error } = await supabase.rpc('get_top_merchants', {
                limit_count: limit
            });

            if (error) {
                console.error('Error fetching top merchants:', error);
                return [];
            }

            return (data || []).map((row: any) => ({
                merchantId: row.merchant_id,
                businessName: row.business_name,
                city: row.city,
                category: row.category,
                transactionCount: row.transaction_count || 0,
                revenue: parseFloat(row.revenue) || 0,
                avgRating: parseFloat(row.avg_rating) || 0,
            }));
        } catch (error) {
            console.error('Top merchants error:', error);
            return [];
        }
    },

    // Get city distribution
    async getCityDistribution(): Promise<CityDistribution[]> {
        try {
            const { data, error } = await supabase.rpc('get_city_distribution');

            if (error) {
                console.error('Error fetching city distribution:', error);
                return [];
            }

            return (data || []).map((row: any) => ({
                city: row.city || 'Unknown',
                studentsCount: row.students_count || 0,
                merchantsCount: row.merchants_count || 0,
                transactionsCount: row.transactions_count || 0,
            }));
        } catch (error) {
            console.error('City distribution error:', error);
            return [];
        }
    },

    // Get category performance
    async getCategoryPerformance(): Promise<CategoryPerformance[]> {
        try {
            const { data, error } = await supabase.rpc('get_category_performance');

            if (error) {
                console.error('Error fetching category performance:', error);
                return [];
            }

            return (data || []).map((row: any) => ({
                category: row.category || 'Other',
                merchantsCount: row.merchants_count || 0,
                offersCount: row.offers_count || 0,
                transactionsCount: row.transactions_count || 0,
                revenue: parseFloat(row.revenue) || 0,
            }));
        } catch (error) {
            console.error('Category performance error:', error);
            return [];
        }
    },

    // Get quick stats for header cards (fallback if RPC fails)
    async getQuickStats(): Promise<{
        students: { total: number; verified: number; pending: number };
        merchants: { total: number; approved: number; pending: number };
        transactions: { total: number; today: number; week: number };
        revenue: { total: number; today: number; savings: number };
    }> {
        try {
            // Parallel queries for speed
            const [studentsRes, merchantsRes, todayTxRes, weekTxRes, allTxRes] = await Promise.all([
                supabase.from('students').select('status', { count: 'exact', head: false }),
                supabase.from('merchants').select('status', { count: 'exact', head: false }),
                supabase.from('transactions').select('final_amount, discount_amount').gte('redeemed_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
                supabase.from('transactions').select('final_amount').gte('redeemed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
                supabase.from('transactions').select('final_amount, discount_amount'),
            ]);

            const students = studentsRes.data || [];
            const merchants = merchantsRes.data || [];
            const todayTx = todayTxRes.data || [];
            const weekTx = weekTxRes.data || [];
            const allTx = allTxRes.data || [];

            return {
                students: {
                    total: students.length,
                    verified: students.filter(s => s.status === 'verified').length,
                    pending: students.filter(s => s.status === 'pending').length,
                },
                merchants: {
                    total: merchants.length,
                    approved: merchants.filter(m => m.status === 'approved').length,
                    pending: merchants.filter(m => m.status === 'pending').length,
                },
                transactions: {
                    total: allTx.length,
                    today: todayTx.length,
                    week: weekTx.length,
                },
                revenue: {
                    total: allTx.reduce((sum, t) => sum + (parseFloat(t.final_amount) || 0), 0),
                    today: todayTx.reduce((sum, t) => sum + (parseFloat(t.final_amount) || 0), 0),
                    savings: allTx.reduce((sum, t) => sum + (parseFloat(t.discount_amount) || 0), 0),
                },
            };
        } catch (error) {
            console.error('Quick stats error:', error);
            return {
                students: { total: 0, verified: 0, pending: 0 },
                merchants: { total: 0, approved: 0, pending: 0 },
                transactions: { total: 0, today: 0, week: 0 },
                revenue: { total: 0, today: 0, savings: 0 },
            };
        }
    }
};

// Default stats when errors occur
function getDefaultStats(): DashboardStats {
    return {
        totalStudents: 0,
        verifiedStudents: 0,
        pendingStudents: 0,
        totalMerchants: 0,
        approvedMerchants: 0,
        pendingMerchants: 0,
        totalOffers: 0,
        activeOffers: 0,
        totalTransactions: 0,
        todayTransactions: 0,
        weekTransactions: 0,
        totalRevenue: 0,
        totalSavings: 0,
        todayRevenue: 0,
        todaySavings: 0,
    };
}
