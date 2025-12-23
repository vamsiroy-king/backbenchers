// Pending Ratings Service
// Stores rating requests in localStorage so they persist and show immediately on app open

const PENDING_RATINGS_KEY = 'bb_pending_ratings';

export interface PendingRating {
    transactionId: string;
    merchantId: string;
    merchantName: string;
    studentId: string;
    createdAt: string; // ISO timestamp
    expiresAt: string; // ISO timestamp (48 hours from creation)
}

// Get all pending ratings from localStorage
export function getPendingRatings(): PendingRating[] {
    if (typeof window === 'undefined') return [];

    try {
        const stored = localStorage.getItem(PENDING_RATINGS_KEY);
        if (!stored) return [];

        const ratings: PendingRating[] = JSON.parse(stored);

        // Filter out expired ratings (older than 48 hours)
        const now = new Date();
        const validRatings = ratings.filter(r => new Date(r.expiresAt) > now);

        // Update storage if we filtered out any expired ones
        if (validRatings.length !== ratings.length) {
            localStorage.setItem(PENDING_RATINGS_KEY, JSON.stringify(validRatings));
        }

        return validRatings;
    } catch (error) {
        console.error('Error reading pending ratings:', error);
        return [];
    }
}

// Add a new pending rating
export function addPendingRating(rating: Omit<PendingRating, 'createdAt' | 'expiresAt'>): void {
    if (typeof window === 'undefined') return;

    try {
        const existing = getPendingRatings();

        // Don't add duplicate for same transaction
        if (existing.some(r => r.transactionId === rating.transactionId)) {
            return;
        }

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours

        const newRating: PendingRating = {
            ...rating,
            createdAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
        };

        existing.push(newRating);
        localStorage.setItem(PENDING_RATINGS_KEY, JSON.stringify(existing));

        console.log('[PendingRatings] Added pending rating for:', rating.merchantName);
    } catch (error) {
        console.error('Error adding pending rating:', error);
    }
}

// Remove a pending rating (after user rates or skips)
export function removePendingRating(transactionId: string): void {
    if (typeof window === 'undefined') return;

    try {
        const existing = getPendingRatings();
        const filtered = existing.filter(r => r.transactionId !== transactionId);
        localStorage.setItem(PENDING_RATINGS_KEY, JSON.stringify(filtered));

        console.log('[PendingRatings] Removed pending rating for transaction:', transactionId);
    } catch (error) {
        console.error('Error removing pending rating:', error);
    }
}

// Get the first (oldest) pending rating to show
export function getNextPendingRating(): PendingRating | null {
    const ratings = getPendingRatings();
    return ratings.length > 0 ? ratings[0] : null;
}

// Clear all pending ratings
export function clearAllPendingRatings(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(PENDING_RATINGS_KEY);
}

// Check if a transaction already has a pending rating
export function hasPendingRating(transactionId: string): boolean {
    return getPendingRatings().some(r => r.transactionId === transactionId);
}
