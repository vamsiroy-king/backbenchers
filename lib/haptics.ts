"use client";

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/**
 * Trigger a haptic feedback vibration.
 * Uses navigator.vibrate() where supported.
 * Falls back gracefully if not supported.
 */
export const vibrate = (type: HapticType = 'light') => {
    // Check if navigator and vibrate are available
    if (typeof window === 'undefined' || !window.navigator || !window.navigator.vibrate) {
        return;
    }

    try {
        switch (type) {
            case 'light':
                window.navigator.vibrate(10); // Subtle tick
                break;
            case 'medium':
                window.navigator.vibrate(20); // Noticeable tick
                break;
            case 'heavy':
                window.navigator.vibrate(40); // Strong feedback
                break;
            case 'success':
                window.navigator.vibrate([10, 30, 10]); // Da-da-da
                break;
            case 'warning':
                window.navigator.vibrate([30, 50, 10]);
                break;
            case 'error':
                window.navigator.vibrate([50, 30, 50, 30, 50]); // Buzz-buzz-buzz
                break;
            default:
                window.navigator.vibrate(10);
        }
    } catch (e) {
        // Ignore errors, haptics are progressive enhancement
    }
};

/**
 * Hook to use haptics in components easily
 */
export const useHaptics = () => {
    return {
        trigger: vibrate
    };
};
