// Offer Utility Functions

import { Offer } from '../types';

/**
 * Get time remaining until offer expires
 */
export function getOfferTimeRemaining(validUntil: string | undefined): {
    expired: boolean;
    days: number;
    hours: number;
    label: string;
    urgency: 'expired' | 'urgent' | 'soon' | 'normal';
} {
    if (!validUntil) {
        return { expired: false, days: 999, hours: 9999, label: 'No expiry', urgency: 'normal' };
    }

    const now = new Date();
    const expiry = new Date(validUntil);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) {
        return { expired: true, days: 0, hours: 0, label: 'Expired', urgency: 'expired' };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    let label: string;
    let urgency: 'urgent' | 'soon' | 'normal';

    if (hours < 24) {
        label = hours === 0 ? 'Less than 1 hour left!' : `${hours}h left`;
        urgency = 'urgent';
    } else if (days <= 3) {
        label = days === 1 ? '1 day left' : `${days} days left`;
        urgency = 'soon';
    } else if (days <= 7) {
        label = `${days} days left`;
        urgency = 'normal';
    } else {
        label = `Expires ${expiry.toLocaleDateString()}`;
        urgency = 'normal';
    }

    return { expired: false, days, hours, label, urgency };
}

/**
 * Get expiry badge color based on urgency
 */
export function getExpiryBadgeColor(urgency: string): string {
    switch (urgency) {
        case 'expired':
            return 'bg-gray-200 text-gray-500';
        case 'urgent':
            return 'bg-red-100 text-red-600';
        case 'soon':
            return 'bg-orange-100 text-orange-600';
        default:
            return 'bg-gray-100 text-gray-600';
    }
}

/**
 * Format discount display
 */
export function formatDiscount(offer: Offer): string {
    switch (offer.type) {
        case 'percentage':
            return `${offer.discountValue}% OFF`;
        case 'flat':
            return `₹${offer.discountValue} OFF`;
        case 'bogo':
            return offer.freeItemName ? `Free ${offer.freeItemName}` : 'Buy 1 Get 1';
        case 'freebie':
            return offer.freeItemName ? `Free ${offer.freeItemName}` : 'Free Item';
        default:
            return offer.description || 'Special Offer';
    }
}

/**
 * Get redemption rule display text
 */
export function getRedemptionRuleText(offer: Offer): string[] {
    const rules: string[] = [];

    if (offer.oneTimeOnly) {
        rules.push('One time only');
    } else if (offer.maxPerStudent) {
        rules.push(`Max ${offer.maxPerStudent} per person`);
    }

    if (offer.cooldownHours) {
        rules.push(`Wait ${offer.cooldownHours}h between uses`);
    }

    if (offer.maxTotalRedemptions) {
        const remaining = offer.maxTotalRedemptions - offer.totalRedemptions;
        if (remaining <= 10) {
            rules.push(`Only ${remaining} left!`);
        }
    }

    return rules;
}

/**
 * Check if offer is available based on rules
 */
export function isOfferAvailable(offer: Offer): boolean {
    if (offer.status !== 'active') return false;

    // Check expiry
    if (offer.validUntil) {
        const expiry = new Date(offer.validUntil);
        if (expiry < new Date()) return false;
    }

    // Check max total redemptions
    if (offer.maxTotalRedemptions && offer.totalRedemptions >= offer.maxTotalRedemptions) {
        return false;
    }

    return true;
}
