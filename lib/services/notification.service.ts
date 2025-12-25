// Notification Service - CRUD operations for notifications

import { supabase } from '../supabase';
import { ApiResponse } from '../types';

export interface Notification {
    id: string;
    userId: string;
    userType: 'student' | 'merchant' | 'admin';
    type: string;
    title: string;
    body?: string;
    data?: Record<string, any>;
    isRead: boolean;
    createdAt: string;
}

// Map database row to Notification type
function mapDbToNotification(row: any): Notification {
    return {
        id: row.id,
        userId: row.user_id,
        userType: row.user_type,
        type: row.type,
        title: row.title,
        body: row.body,
        data: row.data,
        isRead: row.is_read,
        createdAt: row.created_at,
    };
}

export const notificationService = {
    // Get all notifications for current user
    async getMyNotifications(limit = 50): Promise<ApiResponse<Notification[]>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, data: null, error: 'Not authenticated' };
            }

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            // Deduplicate notifications with same title+type within 24 hours
            // This prevents duplicate "New Deal" notifications for same offer
            const notifications = data?.map(mapDbToNotification) || [];
            const seen = new Map<string, Date>();
            const dedupedNotifications = notifications.filter(notif => {
                // Create a unique key based on title + type + offer/merchant ID
                const offerId = notif.data?.offerId || '';
                const merchantId = notif.data?.merchantId || '';
                const key = `${notif.title}-${notif.type}-${offerId}-${merchantId}`;
                const notifDate = new Date(notif.createdAt);

                // Check if we've seen this before
                const lastSeen = seen.get(key);
                if (lastSeen) {
                    // If within 24 hours, it's a duplicate
                    const diffHours = (notifDate.getTime() - lastSeen.getTime()) / (1000 * 60 * 60);
                    if (Math.abs(diffHours) < 24) {
                        return false; // Skip this duplicate
                    }
                }

                // Mark as seen
                seen.set(key, notifDate);
                return true;
            });

            return {
                success: true,
                data: dedupedNotifications,
                error: null
            };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Get unread count
    async getUnreadCount(): Promise<number> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return 0;

            const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            return count || 0;
        } catch {
            return 0;
        }
    },

    // Mark notification as read
    async markAsRead(id: string): Promise<ApiResponse<void>> {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: null, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Mark all notifications as read
    async markAllAsRead(): Promise<ApiResponse<void>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, data: null, error: 'Not authenticated' };
            }

            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: null, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Subscribe to real-time notifications
    subscribeToNotifications(callback: (notification: Notification) => void) {
        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                },
                (payload) => {
                    callback(mapDbToNotification(payload.new));
                }
            )
            .subscribe();

        // Return unsubscribe function
        return () => {
            supabase.removeChannel(channel);
        };
    },

    // Create notification (admin function)
    async createForUser(
        userId: string,
        userType: 'student' | 'merchant' | 'admin',
        type: string,
        title: string,
        body?: string,
        data?: Record<string, any>
    ): Promise<ApiResponse<Notification>> {
        try {
            const { data: result, error } = await supabase
                .from('notifications')
                .insert({
                    user_id: userId,
                    user_type: userType,
                    type,
                    title,
                    body,
                    data: data || {}
                })
                .select()
                .single();

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: mapDbToNotification(result), error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Create notification for all students in a city
    async notifyStudentsInCity(
        city: string,
        type: string,
        title: string,
        body?: string,
        data?: Record<string, any>
    ): Promise<ApiResponse<{ count: number }>> {
        try {
            // Get all student user_ids in the city
            const { data: students } = await supabase
                .from('students')
                .select('user_id')
                .eq('city', city);

            if (!students || students.length === 0) {
                return { success: true, data: { count: 0 }, error: null };
            }

            // Create notifications for all students
            const notifications = students.map(s => ({
                user_id: s.user_id,
                user_type: 'student',
                type,
                title,
                body,
                data: data || {}
            }));

            const { error } = await supabase
                .from('notifications')
                .insert(notifications);

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: { count: students.length }, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    }
};
