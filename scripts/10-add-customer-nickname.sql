-- Add nickname column to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN customers.nickname IS 'Optional nickname or preferred name for the customer';
