-- Fix 1: Update transactions foreign keys to CASCADE on delete
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_student_id_fkey,
ADD CONSTRAINT transactions_student_id_fkey
    FOREIGN KEY (student_id)
    REFERENCES students(id)
    ON DELETE CASCADE;

ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_merchant_id_fkey,
ADD CONSTRAINT transactions_merchant_id_fkey
    FOREIGN KEY (merchant_id)
    REFERENCES merchants(id)
    ON DELETE CASCADE;

ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_offer_id_fkey,
ADD CONSTRAINT transactions_offer_id_fkey
    FOREIGN KEY (offer_id)
    REFERENCES offers(id)
    ON DELETE CASCADE;

-- Fix 2: Ensure ratings also cascade (just in case)
ALTER TABLE ratings
DROP CONSTRAINT IF EXISTS ratings_student_id_fkey,
ADD CONSTRAINT ratings_student_id_fkey
    FOREIGN KEY (student_id)
    REFERENCES students(id)
    ON DELETE CASCADE;

ALTER TABLE ratings
DROP CONSTRAINT IF EXISTS ratings_merchant_id_fkey,
ADD CONSTRAINT ratings_merchant_id_fkey
    FOREIGN KEY (merchant_id)
    REFERENCES merchants(id)
    ON DELETE CASCADE;
