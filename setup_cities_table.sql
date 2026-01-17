-- =====================================================
-- SETUP CITIES TABLE FOR DEV DATABASE
-- Run this in Supabase SQL Editor (DEV Database)
-- =====================================================

-- Create cities table if it doesn't exist
CREATE TABLE IF NOT EXISTS cities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    state text NOT NULL,
    is_popular boolean DEFAULT false,
    is_active boolean DEFAULT true,
    icon_emoji text,
    position integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read on cities" ON cities;
DROP POLICY IF EXISTS "cities_select_policy" ON cities;

-- Create permissive read policy
CREATE POLICY "Allow public read on cities" ON cities
    FOR SELECT USING (true);

-- Grant SELECT to all users
GRANT SELECT ON cities TO anon;
GRANT SELECT ON cities TO authenticated;

-- Insert Popular Cities (these will show in the grid with icons)
INSERT INTO cities (name, state, is_popular, is_active, icon_emoji, position) VALUES
    ('Mumbai', 'Maharashtra', true, true, '🏛️', 1),
    ('Delhi-NCR', 'Delhi', true, true, '🕌', 2),
    ('Bengaluru', 'Karnataka', true, true, '🏙️', 3),
    ('Hyderabad', 'Telangana', true, true, '🏰', 4),
    ('Chennai', 'Tamil Nadu', true, true, '⛪', 5),
    ('Pune', 'Maharashtra', true, true, '🏔️', 6)
ON CONFLICT (name) DO UPDATE SET 
    is_popular = EXCLUDED.is_popular,
    icon_emoji = EXCLUDED.icon_emoji,
    position = EXCLUDED.position,
    is_active = EXCLUDED.is_active;

-- Insert All Other Cities
INSERT INTO cities (name, state, is_popular, is_active, position) VALUES
    ('Kolkata', 'West Bengal', false, true, 10),
    ('Chandigarh', 'Chandigarh', false, true, 11),
    ('Abohar', 'Punjab', false, true, 12),
    ('Abu Road', 'Rajasthan', false, true, 13),
    ('Achampet', 'Telangana', false, true, 14),
    ('Acharapakkam', 'Tamil Nadu', false, true, 15),
    ('Addanki', 'Andhra Pradesh', false, true, 16),
    ('Adilabad', 'Telangana', false, true, 17),
    ('Vizag', 'Andhra Pradesh', false, true, 18),
    ('Jaipur', 'Rajasthan', false, true, 19),
    ('Lucknow', 'Uttar Pradesh', false, true, 20),
    ('Indore', 'Madhya Pradesh', false, true, 21),
    ('Bhopal', 'Madhya Pradesh', false, true, 22),
    ('Coimbatore', 'Tamil Nadu', false, true, 23),
    ('Kochi', 'Kerala', false, true, 24),
    ('Ahmedabad', 'Gujarat', false, true, 25),
    ('Surat', 'Gujarat', false, true, 26),
    ('Vadodara', 'Gujarat', false, true, 27),
    ('Nagpur', 'Maharashtra', false, true, 28),
    ('Nashik', 'Maharashtra', false, true, 29),
    ('Aurangabad', 'Maharashtra', false, true, 30),
    ('Mysuru', 'Karnataka', false, true, 31),
    ('Mangalore', 'Karnataka', false, true, 32),
    ('Hubli', 'Karnataka', false, true, 33),
    ('Vijayawada', 'Andhra Pradesh', false, true, 34),
    ('Tirupati', 'Andhra Pradesh', false, true, 35),
    ('Guntur', 'Andhra Pradesh', false, true, 36),
    ('Warangal', 'Telangana', false, true, 37),
    ('Nizamabad', 'Telangana', false, true, 38),
    ('Thiruvananthapuram', 'Kerala', false, true, 39),
    ('Kozhikode', 'Kerala', false, true, 40),
    ('Thrissur', 'Kerala', false, true, 41),
    ('Madurai', 'Tamil Nadu', false, true, 42),
    ('Tiruchirappalli', 'Tamil Nadu', false, true, 43),
    ('Salem', 'Tamil Nadu', false, true, 44),
    ('Tirunelveli', 'Tamil Nadu', false, true, 45),
    ('Bhubaneswar', 'Odisha', false, true, 46),
    ('Cuttack', 'Odisha', false, true, 47),
    ('Rourkela', 'Odisha', false, true, 48),
    ('Patna', 'Bihar', false, true, 49),
    ('Gaya', 'Bihar', false, true, 50),
    ('Ranchi', 'Jharkhand', false, true, 51),
    ('Jamshedpur', 'Jharkhand', false, true, 52),
    ('Dhanbad', 'Jharkhand', false, true, 53),
    ('Guwahati', 'Assam', false, true, 54),
    ('Shillong', 'Meghalaya', false, true, 55),
    ('Imphal', 'Manipur', false, true, 56),
    ('Agartala', 'Tripura', false, true, 57),
    ('Aizawl', 'Mizoram', false, true, 58),
    ('Itanagar', 'Arunachal Pradesh', false, true, 59),
    ('Gangtok', 'Sikkim', false, true, 60),
    ('Kohima', 'Nagaland', false, true, 61),
    ('Dehradun', 'Uttarakhand', false, true, 62),
    ('Haridwar', 'Uttarakhand', false, true, 63),
    ('Noida', 'Uttar Pradesh', false, true, 64),
    ('Ghaziabad', 'Uttar Pradesh', false, true, 65),
    ('Kanpur', 'Uttar Pradesh', false, true, 66),
    ('Agra', 'Uttar Pradesh', false, true, 67),
    ('Varanasi', 'Uttar Pradesh', false, true, 68),
    ('Prayagraj', 'Uttar Pradesh', false, true, 69),
    ('Meerut', 'Uttar Pradesh', false, true, 70),
    ('Gurgaon', 'Haryana', false, true, 71),
    ('Faridabad', 'Haryana', false, true, 72),
    ('Panipat', 'Haryana', false, true, 73),
    ('Rohtak', 'Haryana', false, true, 74),
    ('Amritsar', 'Punjab', false, true, 75),
    ('Ludhiana', 'Punjab', false, true, 76),
    ('Jalandhar', 'Punjab', false, true, 77),
    ('Patiala', 'Punjab', false, true, 78),
    ('Jammu', 'Jammu & Kashmir', false, true, 79),
    ('Srinagar', 'Jammu & Kashmir', false, true, 80),
    ('Shimla', 'Himachal Pradesh', false, true, 81),
    ('Dharamsala', 'Himachal Pradesh', false, true, 82),
    ('Jodhpur', 'Rajasthan', false, true, 83),
    ('Udaipur', 'Rajasthan', false, true, 84),
    ('Kota', 'Rajasthan', false, true, 85),
    ('Ajmer', 'Rajasthan', false, true, 86),
    ('Bikaner', 'Rajasthan', false, true, 87),
    ('Goa', 'Goa', false, true, 88),
    ('Raipur', 'Chhattisgarh', false, true, 89),
    ('Bilaspur', 'Chhattisgarh', false, true, 90)
ON CONFLICT (name) DO NOTHING;

-- Verify the setup
SELECT name, state, is_popular, icon_emoji, position 
FROM cities 
WHERE is_active = true 
ORDER BY position;
