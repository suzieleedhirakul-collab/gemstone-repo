-- Add setting_cost and diamond_cost fields to manufacturing_projects table
ALTER TABLE manufacturing_projects 
ADD COLUMN setting_cost NUMERIC DEFAULT 0,
ADD COLUMN diamond_cost NUMERIC DEFAULT 0;

-- Update existing records to have default values
UPDATE manufacturing_projects 
SET setting_cost = 0, diamond_cost = 0 
WHERE setting_cost IS NULL OR diamond_cost IS NULL;
