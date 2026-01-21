"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { authService } from "@/lib/services/auth.service";
import { studentService } from "@/lib/services";
import { favoritesService } from "@/lib/services/favorites.service";

interface FavoritesContextType {
    favorites: Set<string>;
    onlineFavorites: Set<string>;
    isFavorite: (merchantId: string) => boolean;
    isOnlineBrandFavorite: (brandId: string) => boolean;
    toggleFavorite: (merchantId: string) => Promise<void>;
    toggleOnlineBrandFavorite: (brandId: string) => Promise<void>;
    refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType>({
    favorites: new Set(),
    onlineFavorites: new Set(),
    isFavorite: () => false,
    isOnlineBrandFavorite: () => false,
    toggleFavorite: async () => { },
    toggleOnlineBrandFavorite: async () => { },
    refreshFavorites: async () => { },
});

export function useFavorites() {
    return useContext(FavoritesContext);
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [onlineFavorites, setOnlineFavorites] = useState<Set<string>>(new Set());
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

        // Parallel fetch
        const [merchantsRes, brandsRes] = await Promise.all([
            favoritesService.getSavedMerchants(),
            favoritesService.getSavedOnlineBrands()
        ]);

        if (merchantsRes.success && merchantsRes.data) {
            setFavorites(new Set(merchantsRes.data.map((m) => m.id as string || m.merchantId as string)));
        }

        if (brandsRes.success && brandsRes.data) {
            setOnlineFavorites(new Set(brandsRes.data.map((b) => b.onlineBrandId as string)));
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
    const isOnlineBrandFavorite = (brandId: string) => onlineFavorites.has(brandId);

    // Toggle merchant favorite
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
        try {
            await favoritesService.toggleMerchant(merchantId);
        } catch (error) {
            console.error('[FavoritesProvider] Error toggling favorite:', error);
            // Revert optimistic update on error
            setFavorites((prev) => {
                const reverted = new Set(prev);
                if (isCurrentlyFavorite) {
                    reverted.add(merchantId);
                } else {
                    reverted.delete(merchantId);
                }
                return reverted;
            });
        }
    };

    // Toggle online brand favorite
    const toggleOnlineBrandFavorite = async (brandId: string) => {
        const isCurrentlyFavorite = onlineFavorites.has(brandId);

        // Optimistic update
        setOnlineFavorites((prev) => {
            const next = new Set(prev);
            if (isCurrentlyFavorite) {
                next.delete(brandId);
            } else {
                next.add(brandId);
            }
            return next;
        });

        // Server update
        try {
            await favoritesService.toggleOnlineBrand(brandId);
        } catch (error) {
            console.error('[FavoritesProvider] Error toggling online favorite:', error);
            // Revert optimistic update on error
            setOnlineFavorites((prev) => {
                const reverted = new Set(prev);
                if (isCurrentlyFavorite) {
                    reverted.add(brandId);
                } else {
                    reverted.delete(brandId);
                }
                return reverted;
            });
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
                    table: "favorites",
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
        <FavoritesContext.Provider value={{
            favorites,
            onlineFavorites,
            isFavorite,
            isOnlineBrandFavorite,
            toggleFavorite,
            toggleOnlineBrandFavorite,
            refreshFavorites
        }}>
            {children}
        </FavoritesContext.Provider>
    );
}
