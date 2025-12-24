-- =============================================
-- AUTOMATIC NOTIFICATION TRIGGERS
-- Real-time notifications for all events
-- =============================================

-- 1. WELCOME NOTIFICATION - When student completes registration
-- =============================================
CREATE OR REPLACE FUNCTION notify_student_welcome()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger when status changes to 'verified'
    IF NEW.status = 'verified' AND (OLD.status IS NULL OR OLD.status != 'verified') THEN
        INSERT INTO notifications (user_id, user_type, type, title, body, data)
        VALUES (
            NEW.user_id,
            'student',
            'welcome',
            '🎉 Welcome to Backbenchers!',
            'Your account is verified. Start exploring exclusive student discounts!',
            '{"route": "/dashboard/explore"}'::jsonb
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_student_welcome ON students;
CREATE TRIGGER trigger_student_welcome
    AFTER INSERT OR UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION notify_student_welcome();


-- 2. NEW OFFER NOTIFICATION - Notify all students in the city
-- =============================================
CREATE OR REPLACE FUNCTION notify_new_offer()
RETURNS TRIGGER AS $$
DECLARE
    merchant_record RECORD;
    student_record RECORD;
BEGIN
    -- Only trigger for new active offers
    IF NEW.status = 'active' THEN
        -- Get merchant info
        SELECT business_name, city INTO merchant_record FROM merchants WHERE id = NEW.merchant_id;
        
        -- Notify all verified students in the same city
        FOR student_record IN 
            SELECT user_id FROM students 
            WHERE city = merchant_record.city 
            AND status = 'verified'
        LOOP
            INSERT INTO notifications (user_id, user_type, type, title, body, data)
            VALUES (
                student_record.user_id,
                'student',
                'offer',
                '🔥 New Deal: ' || NEW.discount_value || '% off!',
                merchant_record.business_name || ' just added a new offer for you!',
                jsonb_build_object('offerId', NEW.id, 'merchantId', NEW.merchant_id, 'route', '/dashboard/explore')
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_new_offer ON offers;
CREATE TRIGGER trigger_new_offer
    AFTER INSERT ON offers
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_offer();


-- 3. REDEMPTION NOTIFICATION - Notify student after successful redemption
-- =============================================
CREATE OR REPLACE FUNCTION notify_redemption()
RETURNS TRIGGER AS $$
DECLARE
    merchant_name TEXT;
    merchant_id_val UUID;
BEGIN
    -- Get merchant info
    SELECT business_name, id INTO merchant_name, merchant_id_val FROM merchants WHERE id = NEW.merchant_id;
    
    -- Notify the student
    INSERT INTO notifications (user_id, user_type, type, title, body, data)
    VALUES (
        NEW.student_id,  -- This is user_id from students table
        'student',
        'redemption',
        '✅ You saved ₹' || COALESCE(NEW.savings_amount, 0) || '!',
        'Discount redeemed at ' || COALESCE(merchant_name, 'merchant') || '. Thanks for using Backbenchers!',
        jsonb_build_object('transactionId', NEW.id, 'merchantId', merchant_id_val, 'route', '/dashboard/profile')
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_redemption ON transactions;
CREATE TRIGGER trigger_redemption
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION notify_redemption();


-- 4. MERCHANT APPROVED NOTIFICATION
-- =============================================
CREATE OR REPLACE FUNCTION notify_merchant_approved()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger when status changes to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        INSERT INTO notifications (user_id, user_type, type, title, body, data)
        VALUES (
            NEW.user_id,
            'merchant',
            'approval',
            '🎉 Congratulations! You''re Approved!',
            'Your business ' || NEW.business_name || ' is now live on Backbenchers. Start creating offers!',
            '{"route": "/merchant/dashboard"}'::jsonb
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_merchant_approved ON merchants;
CREATE TRIGGER trigger_merchant_approved
    AFTER UPDATE ON merchants
    FOR EACH ROW
    EXECUTE FUNCTION notify_merchant_approved();


-- 5. MERCHANT SUSPENDED NOTIFICATION
-- =============================================
CREATE OR REPLACE FUNCTION notify_merchant_suspended()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'suspended' AND OLD.status != 'suspended' THEN
        INSERT INTO notifications (user_id, user_type, type, title, body, data)
        VALUES (
            NEW.user_id,
            'merchant',
            'alert',
            '⚠️ Account Suspended',
            'Your merchant account has been suspended. Contact support for assistance.',
            '{}'::jsonb
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_merchant_suspended ON merchants;
CREATE TRIGGER trigger_merchant_suspended
    AFTER UPDATE ON merchants
    FOR EACH ROW
    EXECUTE FUNCTION notify_merchant_suspended();


-- 6. STUDENT SUSPENDED NOTIFICATION
-- =============================================
CREATE OR REPLACE FUNCTION notify_student_suspended()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'suspended' AND OLD.status != 'suspended' THEN
        INSERT INTO notifications (user_id, user_type, type, title, body, data)
        VALUES (
            NEW.user_id,
            'student',
            'alert',
            '⚠️ Account Suspended',
            'Your student account has been suspended. Contact support for assistance.',
            '{}'::jsonb
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_student_suspended ON students;
CREATE TRIGGER trigger_student_suspended
    AFTER UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION notify_student_suspended();
