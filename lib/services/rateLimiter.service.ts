// Rate Limiter Service - Prevents abuse of OTP and auth endpoints
// Uses localStorage with sliding window for client-side rate limiting

interface RateLimitConfig {
    maxRequests: number;    // Maximum requests allowed
    windowMs: number;       // Time window in milliseconds
}

interface RateLimitEntry {
    timestamps: number[];   // Timestamps of requests
}

const RATE_LIMIT_STORAGE_KEY = 'bb_rate_limits';

// Default configurations for different endpoints
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
    'otp_send': {
        maxRequests: 3,      // 3 OTP sends
        windowMs: 10 * 60 * 1000  // per 10 minutes
    },
    'otp_resend': {
        maxRequests: 5,      // 5 resends
        windowMs: 30 * 60 * 1000  // per 30 minutes
    },
    'otp_verify': {
        maxRequests: 10,     // 10 verification attempts
        windowMs: 15 * 60 * 1000  // per 15 minutes
    },
    'login_attempt': {
        maxRequests: 10,     // 10 login attempts
        windowMs: 15 * 60 * 1000  // per 15 minutes
    },
    'api_request': {
        maxRequests: 100,    // 100 API requests
        windowMs: 60 * 1000  // per minute
    }
};

function getStoredLimits(): Record<string, RateLimitEntry> {
    if (typeof window === 'undefined') return {};

    try {
        const stored = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

function setStoredLimits(limits: Record<string, RateLimitEntry>): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(limits));
    } catch {
        // Storage quota exceeded or unavailable - ignore
    }
}

export const rateLimiter = {
    /**
     * Check if an action is allowed under rate limits
     * @param action - The action type (e.g., 'otp_send', 'login_attempt')
     * @param identifier - Optional identifier to make rate limit specific (e.g., email)
     * @returns Object with allowed status and optional wait time
     */
    check(action: string, identifier?: string): {
        allowed: boolean;
        remainingRequests: number;
        waitTimeMs?: number;
        message?: string;
    } {
        if (typeof window === 'undefined') {
            return { allowed: true, remainingRequests: 999 };
        }

        const config = RATE_LIMIT_CONFIGS[action];
        if (!config) {
            return { allowed: true, remainingRequests: 999 };
        }

        const key = identifier ? `${action}:${identifier}` : action;
        const now = Date.now();
        const limits = getStoredLimits();
        const entry = limits[key] || { timestamps: [] };

        // Remove timestamps outside the window
        const validTimestamps = entry.timestamps.filter(
            ts => now - ts < config.windowMs
        );

        const remainingRequests = Math.max(0, config.maxRequests - validTimestamps.length);

        if (validTimestamps.length >= config.maxRequests) {
            // Rate limit exceeded
            const oldestTimestamp = Math.min(...validTimestamps);
            const waitTimeMs = config.windowMs - (now - oldestTimestamp);
            const waitMinutes = Math.ceil(waitTimeMs / 60000);

            return {
                allowed: false,
                remainingRequests: 0,
                waitTimeMs,
                message: `Too many attempts. Please wait ${waitMinutes} minute${waitMinutes > 1 ? 's' : ''} and try again.`
            };
        }

        return {
            allowed: true,
            remainingRequests
        };
    },

    /**
     * Record an action for rate limiting
     * @param action - The action type
     * @param identifier - Optional identifier
     */
    record(action: string, identifier?: string): void {
        if (typeof window === 'undefined') return;

        const key = identifier ? `${action}:${identifier}` : action;
        const now = Date.now();
        const config = RATE_LIMIT_CONFIGS[action];

        if (!config) return;

        const limits = getStoredLimits();
        const entry = limits[key] || { timestamps: [] };

        // Clean old timestamps and add new one
        entry.timestamps = entry.timestamps.filter(
            ts => now - ts < config.windowMs
        );
        entry.timestamps.push(now);

        limits[key] = entry;
        setStoredLimits(limits);
    },

    /**
     * Reset rate limit for a specific action
     * @param action - The action type
     * @param identifier - Optional identifier
     */
    reset(action: string, identifier?: string): void {
        if (typeof window === 'undefined') return;

        const key = identifier ? `${action}:${identifier}` : action;
        const limits = getStoredLimits();

        delete limits[key];
        setStoredLimits(limits);
    },

    /**
     * Reset all rate limits
     */
    resetAll(): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
    },

    /**
     * Get remaining time until rate limit resets (in ms)
     */
    getResetTime(action: string, identifier?: string): number | null {
        if (typeof window === 'undefined') return null;

        const config = RATE_LIMIT_CONFIGS[action];
        if (!config) return null;

        const key = identifier ? `${action}:${identifier}` : action;
        const limits = getStoredLimits();
        const entry = limits[key];

        if (!entry || entry.timestamps.length === 0) return null;

        const oldestTimestamp = Math.min(...entry.timestamps);
        return config.windowMs - (Date.now() - oldestTimestamp);
    }
};

// Helper function to format wait time for display
export function formatWaitTime(ms: number): string {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds} seconds`;

    const minutes = Math.ceil(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''}`;

    const hours = Math.ceil(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''}`;
}

export default rateLimiter;
