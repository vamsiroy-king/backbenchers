"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { authService } from "@/lib/services/auth.service";
import { studentService } from "@/lib/services";
import { favoritesService } from "@/lib/services/favorites.service";

interface FavoritesContextType {
    favorites: Set<string>;
    isFavorite: (merchantId: string) => boolean;
    toggleFavorite: (merchantId: string) => Promise<void>;
    refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType>({
    favorites: new Set(),
    isFavorite: () => false,
    toggleFavorite: async () => { },
    refreshFavorites: async () => { },
});

export function useFavorites() {
    return useContext(FavoritesContext);
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [studentId, setStudentId] = useState<string | null>(null);

    // Get student ID on mount
    useEffect(() => {
        async function init() {
            const hasSession = await authService.hasActiveSession();
            if (hasSession) {
                const profile = await studentService.getMyProfile();
                if (profile.success && profile.data) {
                    setStudentId(profile.data.id);
                }
            }
        }
        init();
    }, []);

    // Fetch favorites
    const refreshFavorites = useCallback(async () => {
        if (!studentId) return;
        const result = await favoritesService.getSavedMerchants();
        if (result.success && result.data) {
            setFavorites(new Set(result.data.map((m) => m.id)));
        }
    }, [studentId]);

    // Fetch on mount
    useEffect(() => {
        if (studentId) {
            refreshFavorites();
        }
    }, [studentId, refreshFavorites]);

    // Check if favorite
    const isFavorite = (merchantId: string) => favorites.has(merchantId);

    // Toggle favorite
    const toggleFavorite = async (merchantId: string) => {
        const isCurrentlyFavorite = favorites.has(merchantId);

        // Optimistic update
        setFavorites((prev) => {
            const next = new Set(prev);
            if (isCurrentlyFavorite) {
                next.delete(merchantId);
            } else {
                next.add(merchantId);
            }
            return next;
        });

        // Server update
        if (isCurrentlyFavorite) {
            await favoritesService.unsaveMerchant(merchantId);
        } else {
            await favoritesService.saveMerchant(merchantId);
        }
    };

    // 🔥 REAL-TIME: Subscribe to favorites changes
    useEffect(() => {
        if (!studentId) return;

        const channel = supabase
            .channel(`favorites-${studentId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "saved_merchants",
                    filter: `student_id=eq.${studentId}`,
                },
                (payload) => {
                    console.log("[Favorites] 🔥 Change detected:", payload);
                    // Refresh favorites on any change
                    refreshFavorites();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [studentId, refreshFavorites]);

    return (
        <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite, refreshFavorites }}>
            {children}
        </FavoritesContext.Provider>
    );
}
