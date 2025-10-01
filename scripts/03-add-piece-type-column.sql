-- Add piece_type column to manufacturing_projects table
ALTER TABLE manufacturing_projects 
ADD COLUMN piece_type TEXT CHECK (piece_type IN ('earrings', 'bracelet', 'choker', 'necklace', 'brooch', 'ring', 'pendant', 'other'));

-- Add a comment to document the column
COMMENT ON COLUMN manufacturing_projects.piece_type IS 'Type of jewelry piece being manufactured';
