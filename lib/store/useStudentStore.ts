import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Offer } from '@/lib/types';
import { Category } from '@/lib/services/category.service';
import { HeroBanner } from '@/lib/services/heroBanner.service';
import { NewMerchant } from '@/lib/services/newMerchant.service';

interface CachedData<T> {
    data: T;
    timestamp: number;
    city?: string; // If city-dependent
}

interface StudentState {
    // Data State
    offers: CachedData<Offer[]> | null;
    trendingOffline: CachedData<Offer[]> | null;
    trendingOnline: CachedData<Offer[]> | null;
    topBrands: CachedData<any[]> | null;
    newMerchants: CachedData<NewMerchant[]> | null;
    heroBanners: CachedData<HeroBanner[]> | null;
    categories: CachedData<Category[]> | null;
    favoriteIds: string[]; // Just list of IDs

    // Explore page cache (prevents refetch on tab switch)
    exploreOffers: CachedData<Offer[]> | null;
    exploreBrands: CachedData<any[]> | null;

    // Hydration flag (prevents flash of empty content from localStorage)
    isHydrated: boolean;

    // Actions to set data
    setOffers: (data: Offer[], city?: string) => void;
    setTrendingOffline: (data: Offer[], city?: string) => void;
    setTrendingOnline: (data: Offer[]) => void;
    setTopBrands: (data: any[]) => void;
    setNewMerchants: (data: NewMerchant[], city?: string) => void;
    setHeroBanners: (data: HeroBanner[], city?: string) => void;
    setCategories: (data: Category[]) => void;
    setFavoriteIds: (ids: string[]) => void;
    toggleFavoriteId: (id: string, isFav: boolean) => void;
    setExploreOffers: (data: Offer[], city?: string) => void;
    setExploreBrands: (data: any[]) => void;
    setHydrated: () => void;

    // Helpers
    clearCityData: () => void;
    clearAll: () => void;
}

const CACHE_EXPIRY = 15 * 60 * 1000; // 15 Minutes (Increased from 5)

export const useStudentStore = create<StudentState>()(
    persist(
        (set, get) => ({
            offers: null,
            trendingOffline: null,
            trendingOnline: null,
            topBrands: null,
            newMerchants: null,
            heroBanners: null,
            categories: null,
            favoriteIds: [],
            exploreOffers: null,
            exploreBrands: null,
            isHydrated: false,

            setOffers: (data, city) => set({ offers: { data, timestamp: Date.now(), city } }),
            setTrendingOffline: (data, city) => set({ trendingOffline: { data, timestamp: Date.now(), city } }),
            setTrendingOnline: (data) => set({ trendingOnline: { data, timestamp: Date.now() } }),
            setTopBrands: (data) => set({ topBrands: { data, timestamp: Date.now() } }),
            setNewMerchants: (data, city) => set({ newMerchants: { data, timestamp: Date.now(), city } }),
            setHeroBanners: (data, city) => set({ heroBanners: { data, timestamp: Date.now(), city } }),
            setCategories: (data) => set({ categories: { data, timestamp: Date.now() } }),

            setFavoriteIds: (ids) => set({ favoriteIds: ids }),
            toggleFavoriteId: (id, isFav) => set((state) => {
                const current = state.favoriteIds;
                if (isFav && !current.includes(id)) return { favoriteIds: [...current, id] };
                if (!isFav && current.includes(id)) return { favoriteIds: current.filter(i => i !== id) };
                return {};
            }),

            setExploreOffers: (data, city) => set({ exploreOffers: { data, timestamp: Date.now(), city } }),
            setExploreBrands: (data) => set({ exploreBrands: { data, timestamp: Date.now() } }),
            setHydrated: () => set({ isHydrated: true }),

            clearCityData: () => set({
                offers: null,
                trendingOffline: null,
                newMerchants: null,
                heroBanners: null, // Banners are also city dependent
                exploreOffers: null, // Explore is city dependent too
            }),

            clearAll: () => set({
                offers: null,
                trendingOffline: null,
                trendingOnline: null,
                topBrands: null,
                newMerchants: null,
                heroBanners: null,
                favoriteIds: [],
                exploreOffers: null,
                exploreBrands: null,
            })
        }),
        {
            name: 'student-storage', // unique name
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                // Persist everything including categories which are heavy but static
                offers: state.offers,
                trendingOffline: state.trendingOffline,
                trendingOnline: state.trendingOnline,
                topBrands: state.topBrands,
                newMerchants: state.newMerchants,
                heroBanners: state.heroBanners,
                categories: state.categories,
                favoriteIds: state.favoriteIds,
                exploreOffers: state.exploreOffers,
                exploreBrands: state.exploreBrands,
            }),
            onRehydrateStorage: () => (state) => {
                // Mark hydration complete after localStorage data is loaded
                state?.setHydrated();
            },
        }
    )
);

// Helper to check validity (can be used inside components)
export const isCacheValid = (cached: CachedData<any> | null, currentCity?: string) => {
    if (!cached) return false;
    const now = Date.now();
    if (now - cached.timestamp > CACHE_EXPIRY) return false;
    if (currentCity && cached.city && cached.city !== currentCity) return false;
    return true;
};
