-- =============================================
-- ANALYTICS TABLES - Enterprise Admin Dashboard
-- Creates tables for fast analytics queries and insights
-- =============================================

-- =============================================
-- 1. DAILY AGGREGATED ANALYTICS
-- Pre-computed daily stats for fast dashboard loading
-- =============================================
CREATE TABLE IF NOT EXISTS daily_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    
    -- Transaction metrics
    total_transactions INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_savings DECIMAL(12,2) DEFAULT 0,
    avg_transaction_value DECIMAL(10,2) DEFAULT 0,
    
    -- User metrics
    new_students INTEGER DEFAULT 0,yesi r
    new_merchants INTEGER DEFAULT 0,
    active_students INTEGER DEFAULT 0,
    active_merchants INTEGER DEFAULT 0,
    
    -- Offer metrics
    new_offers INTEGER DEFAULT 0,
    total_redemptions INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast date range queries
CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date DESC);

-- =============================================
-- 2. CITY-WISE ANALYTICS
-- Geographic breakdown of metrics
-- =============================================
CREATE TABLE IF NOT EXISTS city_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    
    -- Metrics per city
    students_count INTEGER DEFAULT 0,
    merchants_count INTEGER DEFAULT 0,
    transactions_count INTEGER DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    savings DECIMAL(12,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(date, city)
);

CREATE INDEX IF NOT EXISTS idx_city_analytics_date ON city_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_city_analytics_city ON city_analytics(city);

-- =============================================
-- 3. CATEGORY PERFORMANCE ANALYTICS
-- Category-wise breakdown (Food, Fashion, etc.)
-- =============================================
CREATE TABLE IF NOT EXISTS category_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    
    -- Metrics per category
    merchants_count INTEGER DEFAULT 0,
    offers_count INTEGER DEFAULT 0,
    transactions_count INTEGER DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(date, category)
);

CREATE INDEX IF NOT EXISTS idx_category_analytics_date ON category_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_category_analytics_category ON category_analytics(category);

-- =============================================
-- 4. COLLEGE ANALYTICS
-- College-wise student engagement
-- =============================================
CREATE TABLE IF NOT EXISTS college_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    college VARCHAR(200) NOT NULL,
    city VARCHAR(100),
    
    -- Metrics per college
    students_count INTEGER DEFAULT 0,
    active_students INTEGER DEFAULT 0,
    transactions_count INTEGER DEFAULT 0,
    savings DECIMAL(12,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(date, college)
);

CREATE INDEX IF NOT EXISTS idx_college_analytics_date ON college_analytics(date DESC);

-- =============================================
-- 5. MERCHANT PERFORMANCE SNAPSHOT
-- Daily snapshot of merchant metrics
-- =============================================
CREATE TABLE IF NOT EXISTS merchant_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    
    -- Daily metrics
    transactions_count INTEGER DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    new_customers INTEGER DEFAULT 0,
    avg_rating DECIMAL(2,1),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(date, merchant_id)
);

CREATE INDEX IF NOT EXISTS idx_merchant_perf_date ON merchant_performance(date DESC);
CREATE INDEX IF NOT EXISTS idx_merchant_perf_merchant ON merchant_performance(merchant_id);

-- =============================================
-- 6. FUNCTIONS FOR REAL-TIME ANALYTICS
-- =============================================

-- Get dashboard overview stats
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE(
    total_students BIGINT,
    verified_students BIGINT,
    pending_students BIGINT,
    total_merchants BIGINT,
    approved_merchants BIGINT,
    pending_merchants BIGINT,
    total_offers BIGINT,
    active_offers BIGINT,
    total_transactions BIGINT,
    today_transactions BIGINT,
    week_transactions BIGINT,
    total_revenue DECIMAL,
    total_savings DECIMAL,
    today_revenue DECIMAL,
    today_savings DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM students)::BIGINT,
        (SELECT COUNT(*) FROM students WHERE status = 'verified')::BIGINT,
        (SELECT COUNT(*) FROM students WHERE status = 'pending')::BIGINT,
        (SELECT COUNT(*) FROM merchants)::BIGINT,
        (SELECT COUNT(*) FROM merchants WHERE status = 'approved')::BIGINT,
        (SELECT COUNT(*) FROM merchants WHERE status = 'pending')::BIGINT,
        (SELECT COUNT(*) FROM offers)::BIGINT,
        (SELECT COUNT(*) FROM offers WHERE status = 'active')::BIGINT,
        (SELECT COUNT(*) FROM transactions)::BIGINT,
        (SELECT COUNT(*) FROM transactions WHERE DATE(redeemed_at) = CURRENT_DATE)::BIGINT,
        (SELECT COUNT(*) FROM transactions WHERE redeemed_at >= NOW() - INTERVAL '7 days')::BIGINT,
        COALESCE((SELECT SUM(final_amount) FROM transactions), 0)::DECIMAL,
        COALESCE((SELECT SUM(discount_amount) FROM transactions), 0)::DECIMAL,
        COALESCE((SELECT SUM(final_amount) FROM transactions WHERE DATE(redeemed_at) = CURRENT_DATE), 0)::DECIMAL,
        COALESCE((SELECT SUM(discount_amount) FROM transactions WHERE DATE(redeemed_at) = CURRENT_DATE), 0)::DECIMAL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get revenue by date range
CREATE OR REPLACE FUNCTION get_revenue_by_date_range(
    start_date DATE,
    end_date DATE
)
RETURNS TABLE(
    date DATE,
    transactions_count BIGINT,
    revenue DECIMAL,
    savings DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(t.redeemed_at) as date,
        COUNT(*)::BIGINT as transactions_count,
        COALESCE(SUM(t.final_amount), 0)::DECIMAL as revenue,
        COALESCE(SUM(t.discount_amount), 0)::DECIMAL as savings
    FROM transactions t
    WHERE DATE(t.redeemed_at) BETWEEN start_date AND end_date
    GROUP BY DATE(t.redeemed_at)
    ORDER BY DATE(t.redeemed_at);
END;
$$ LANGUAGE plpgsql STABLE;

-- Get top performing merchants
CREATE OR REPLACE FUNCTION get_top_merchants(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    merchant_id UUID,
    business_name VARCHAR,
    city VARCHAR,
    category VARCHAR,
    transaction_count BIGINT,
    revenue DECIMAL,
    avg_rating DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id as merchant_id,
        m.business_name,
        m.city,
        m.category,
        COUNT(t.id)::BIGINT as transaction_count,
        COALESCE(SUM(t.final_amount), 0)::DECIMAL as revenue,
        COALESCE(m.average_rating, 0)::DECIMAL as avg_rating
    FROM merchants m
    LEFT JOIN transactions t ON t.merchant_id = m.id
    WHERE m.status = 'approved'
    GROUP BY m.id
    ORDER BY transaction_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get city-wise distribution
CREATE OR REPLACE FUNCTION get_city_distribution()
RETURNS TABLE(
    city VARCHAR,
    students_count BIGINT,
    merchants_count BIGINT,
    transactions_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH city_students AS (
        SELECT s.city, COUNT(*) as count FROM students s GROUP BY s.city
    ),
    city_merchants AS (
        SELECT m.city, COUNT(*) as count FROM merchants m WHERE m.status = 'approved' GROUP BY m.city
    ),
    city_transactions AS (
        SELECT m.city, COUNT(*) as count 
        FROM transactions t 
        JOIN merchants m ON t.merchant_id = m.id 
        GROUP BY m.city
    )
    SELECT 
        COALESCE(cs.city, cm.city, ct.city) as city,
        COALESCE(cs.count, 0)::BIGINT as students_count,
        COALESCE(cm.count, 0)::BIGINT as merchants_count,
        COALESCE(ct.count, 0)::BIGINT as transactions_count
    FROM city_students cs
    FULL OUTER JOIN city_merchants cm ON cs.city = cm.city
    FULL OUTER JOIN city_transactions ct ON COALESCE(cs.city, cm.city) = ct.city
    ORDER BY students_count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get category performance
CREATE OR REPLACE FUNCTION get_category_performance()
RETURNS TABLE(
    category VARCHAR,
    merchants_count BIGINT,
    offers_count BIGINT,
    transactions_count BIGINT,
    revenue DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.category,
        COUNT(DISTINCT m.id)::BIGINT as merchants_count,
        COUNT(DISTINCT o.id)::BIGINT as offers_count,
        COUNT(DISTINCT t.id)::BIGINT as transactions_count,
        COALESCE(SUM(t.final_amount), 0)::DECIMAL as revenue
    FROM merchants m
    LEFT JOIN offers o ON o.merchant_id = m.id
    LEFT JOIN transactions t ON t.merchant_id = m.id
    WHERE m.status = 'approved'
    GROUP BY m.category
    ORDER BY transactions_count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================
-- RLS POLICIES (Admin only)
-- =============================================
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE college_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_performance ENABLE ROW LEVEL SECURITY;

-- Only admins can access analytics tables
CREATE POLICY "Admins can read daily_analytics" ON daily_analytics
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM admins)
    );

CREATE POLICY "Admins can read city_analytics" ON city_analytics
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM admins)
    );

CREATE POLICY "Admins can read category_analytics" ON category_analytics
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM admins)
    );

CREATE POLICY "Admins can read college_analytics" ON college_analytics
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM admins)
    );

CREATE POLICY "Admins can read merchant_performance" ON merchant_performance
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM admins)
    );

-- =============================================
-- DONE! Analytics tables ready for dashboard
-- =============================================
