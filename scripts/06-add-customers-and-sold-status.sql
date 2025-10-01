-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add customer_id and sold_at columns to manufacturing_projects
ALTER TABLE manufacturing_projects 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id),
ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS selling_price NUMERIC;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_manufacturing_projects_customer_id ON manufacturing_projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_manufacturing_projects_status ON manufacturing_projects(status);
