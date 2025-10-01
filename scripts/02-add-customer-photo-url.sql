-- Add photo_url column to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN customers.photo_url IS 'URL to customer profile photo stored in Supabase Storage';
