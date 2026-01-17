-- Migration: Add app_url and prefer_app columns to online_brands table
-- This enables app deep linking for brands with mobile apps

-- Add app_url column for mobile app deep links (e.g., zomato:// or universal link)
ALTER TABLE online_brands ADD COLUMN IF NOT EXISTS app_url TEXT;

-- Add prefer_app toggle to determine primary redirect destination
-- When TRUE: Try app first, fallback to website
-- When FALSE: Use website directly
ALTER TABLE online_brands ADD COLUMN IF NOT EXISTS prefer_app BOOLEAN DEFAULT FALSE;

-- Add Play Store and App Store URLs for device-specific redirects
-- When app is not installed, redirect user to the appropriate store to install
ALTER TABLE online_brands ADD COLUMN IF NOT EXISTS playstore_url TEXT;
ALTER TABLE online_brands ADD COLUMN IF NOT EXISTS appstore_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN online_brands.app_url IS 'Mobile app deep link URL (e.g., zomato:// or https://link.zomato.com/)';
COMMENT ON COLUMN online_brands.prefer_app IS 'If true, redirect to app first; if false, use website';
COMMENT ON COLUMN online_brands.playstore_url IS 'Google Play Store URL for Android users';
COMMENT ON COLUMN online_brands.appstore_url IS 'Apple App Store URL for iOS users';

