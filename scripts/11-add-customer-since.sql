-- Add customer_since column to customers table
-- This allows tracking when a customer first became a customer, separate from when their record was created
ALTER TABLE customers
ADD COLUMN customer_since TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- For existing customers, set customer_since to their created_at date
UPDATE customers
SET customer_since = created_at
WHERE customer_since IS NULL;
