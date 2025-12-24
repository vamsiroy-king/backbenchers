"use client";

import { useState, useEffect, useCallback } from 'react';
import { notificationService, Notification } from '@/lib/services/notification.service';
import { supabase } from '@/lib/supabase';

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Fetch initial notifications
    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        const result = await notificationService.getMyNotifications();
        if (result.success && result.data) {
            setNotifications(result.data);
            setUnreadCount(result.data.filter(n => !n.isRead).length);
        }
        setLoading(false);
    }, []);

    // Subscribe to real-time notifications
    useEffect(() => {
        // Initial fetch
        fetchNotifications();

        // Get current user for subscription filter
        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Subscribe to new notifications for this user
            const channel = supabase
                .channel('notifications-realtime')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`,
                    },
                    (payload) => {
                        // New notification received!
                        const newNotification: Notification = {
                            id: payload.new.id,
                            userId: payload.new.user_id,
                            userType: payload.new.user_type,
                            type: payload.new.type,
                            title: payload.new.title,
                            body: payload.new.body,
                            data: payload.new.data,
                            isRead: payload.new.is_read,
                            createdAt: payload.new.created_at,
                        };

                        // Add to list and increment count
                        setNotifications(prev => [newNotification, ...prev]);
                        setUnreadCount(prev => prev + 1);
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`,
                    },
                    (payload) => {
                        // Notification updated (marked as read)
                        setNotifications(prev =>
                            prev.map(n =>
                                n.id === payload.new.id
                                    ? { ...n, isRead: payload.new.is_read }
                                    : n
                            )
                        );
                        // Recalculate unread count
                        setNotifications(prev => {
                            setUnreadCount(prev.filter(n => !n.isRead).length);
                            return prev;
                        });
                    }
                )
                .subscribe();

            // Cleanup on unmount
            return () => {
                supabase.removeChannel(channel);
            };
        };

        const cleanup = setupRealtime();

        return () => {
            cleanup.then(fn => fn && fn());
        };
    }, [fetchNotifications]);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        const result = await notificationService.markAllAsRead();
        if (result.success) {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        }
        return result.success;
    }, []);

    // Refresh notifications
    const refresh = useCallback(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    return {
        notifications,
        unreadCount,
        loading,
        markAllAsRead,
        refresh,
    };
}
