// Dashboard Data Cache Service
// Caches data in memory to prevent refetching on navigation

interface CachedData<T> {
    data: T;
    timestamp: number;
    city?: string;
    version?: string;
}

interface DashboardCache {
    offers: CachedData<any[]> | null;
    trendingOffline: CachedData<any[]> | null;
    trendingOnline: CachedData<any[]> | null;
    topBrands: CachedData<any[]> | null;
    newMerchants: CachedData<any[]> | null;
    heroBanners: CachedData<any[]> | null;
    favoriteIds: CachedData<string[]> | null;
}

// Cache expiry time (5 minutes)
const CACHE_EXPIRY = 5 * 60 * 1000;

// In-memory cache
let cache: DashboardCache = {
    offers: null,
    trendingOffline: null,
    trendingOnline: null,
    topBrands: null,
    newMerchants: null,
    heroBanners: null,
    favoriteIds: null,
};

// Cache version - increment this to invalidate all client caches
const CACHE_KEY = 'dashboard_data';
const CACHE_VERSION = 'v3'; // Increment to force fresh fetch

// Check if cache is valid
function isValid<T>(cached: CachedData<T> | null, currentCity?: string): boolean {
    if (!cached) return false;
    const now = Date.now();

    // Check version
    if (cached.version !== CACHE_VERSION) return false;

    if (now - cached.timestamp > CACHE_EXPIRY) return false;
    if (currentCity && cached.city && cached.city !== currentCity) return false;
    return true;
}

export const dashboardCache = {
    // Get cached data or return null
    getOffers(city?: string): any[] | null {
        return isValid(cache.offers, city) ? cache.offers!.data : null;
    },

    setOffers(data: any[], city?: string): void {
        cache.offers = { data, timestamp: Date.now(), city, version: CACHE_VERSION };
    },

    getTrendingOffline(city?: string): any[] | null {
        return isValid(cache.trendingOffline, city) ? cache.trendingOffline!.data : null;
    },

    setTrendingOffline(data: any[], city?: string): void {
        cache.trendingOffline = { data, timestamp: Date.now(), city, version: CACHE_VERSION };
    },

    getTrendingOnline(): any[] | null {
        return isValid(cache.trendingOnline) ? cache.trendingOnline!.data : null;
    },

    setTrendingOnline(data: any[]): void {
        cache.trendingOnline = { data, timestamp: Date.now(), version: CACHE_VERSION };
    },

    getTopBrands(): any[] | null {
        return isValid(cache.topBrands) ? cache.topBrands!.data : null;
    },

    setTopBrands(data: any[]): void {
        cache.topBrands = { data, timestamp: Date.now(), version: CACHE_VERSION };
    },

    getNewMerchants(city?: string): any[] | null {
        return isValid(cache.newMerchants, city) ? cache.newMerchants!.data : null;
    },

    setNewMerchants(data: any[], city?: string): void {
        cache.newMerchants = { data, timestamp: Date.now(), city, version: CACHE_VERSION };
    },

    getHeroBanners(city?: string): any[] | null {
        return isValid(cache.heroBanners, city) ? cache.heroBanners!.data : null;
    },

    setHeroBanners(data: any[], city?: string): void {
        cache.heroBanners = { data, timestamp: Date.now(), city, version: CACHE_VERSION };
    },

    getFavoriteIds(): string[] | null {
        return isValid(cache.favoriteIds) ? cache.favoriteIds!.data : null;
    },

    setFavoriteIds(data: string[]): void {
        cache.favoriteIds = { data, timestamp: Date.now(), version: CACHE_VERSION };
    },

    updateFavoriteIds(offerId: string, isFavorite: boolean): void {
        if (cache.favoriteIds) {
            if (isFavorite) {
                cache.favoriteIds.data = [...cache.favoriteIds.data, offerId];
            } else {
                cache.favoriteIds.data = cache.favoriteIds.data.filter(id => id !== offerId);
            }
        }
    },

    // Clear all cache (on logout, city change, etc.)
    clearAll(): void {
        cache = {
            offers: null,
            trendingOffline: null,
            trendingOnline: null,
            topBrands: null,
            newMerchants: null,
            heroBanners: null,
            favoriteIds: null,
        };
    },

    // Clear city-dependent cache
    clearCityData(): void {
        cache.offers = null;
        cache.trendingOffline = null;
        cache.newMerchants = null;
        cache.heroBanners = null;
    },

    // Check if we have cached data (for instant initial render)
    hasCachedData(city?: string): boolean {
        return isValid(cache.offers, city) &&
            isValid(cache.trendingOffline, city) &&
            isValid(cache.topBrands);
    }
};

export default dashboardCache;
