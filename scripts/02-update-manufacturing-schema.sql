-- Add selling_price column to manufacturing_projects table
ALTER TABLE manufacturing_projects 
ADD COLUMN IF NOT EXISTS selling_price NUMERIC DEFAULT 0;

-- Copy data from estimated_value to selling_price if needed
UPDATE manufacturing_projects 
SET selling_price = estimated_value 
WHERE selling_price IS NULL OR selling_price = 0;

-- Optional: Remove estimated_value column after migration (uncomment if needed)
-- ALTER TABLE manufacturing_projects DROP COLUMN IF EXISTS estimated_value;
