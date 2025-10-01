-- Add gemstone_cost column to manufacturing_projects table
ALTER TABLE manufacturing_projects
ADD COLUMN IF NOT EXISTS gemstone_cost NUMERIC DEFAULT 0;

-- Update total_cost to be the sum of all component costs
UPDATE manufacturing_projects
SET total_cost = COALESCE(setting_cost, 0) + COALESCE(diamond_cost, 0) + COALESCE(gemstone_cost, 0)
WHERE total_cost IS NOT NULL;
