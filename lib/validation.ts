import { z } from 'zod';

// === MERCHANT VALIDATION ===
export const merchantSchema = z.object({
    name: z.string().min(2, "Name too short").max(50, "Name too long"),
    email: z.string().email("Invalid email"),
    // Regex for Indian Phone Numbers to prevent spam
    phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian Phone Number"),
    category: z.enum(['Food', 'Fashion', 'Events', 'Lifestyle']),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
});

// === OFFER VALIDATION === (Prevents the "Negative Discount" hack)
export const offerSchema = z.object({
    title: z.string().min(5).max(100),
    description: z.string().max(500),
    discount_percentage: z.number().int().min(1).max(100, "Discount cannot exceed 100%"),
    valid_until: z.string().datetime(), // Must be a valid ISO date
    merchant_id: z.string().uuid(),
});

// === REDEMPTION VALIDATION ===
export const redemptionSchema = z.object({
    offer_id: z.string().uuid(),
    user_lat: z.number(),
    user_lng: z.number(),
    // Check if student is practically INSIDE the shop (Geofencing check happens in logic, but input must be valid)
});

// Helper to validate API Request Body
export async function validateBody<T>(req: Request, schema: z.ZodSchema<T>): Promise<T> {
    const body = await req.json();
    return schema.parse(body);
}
