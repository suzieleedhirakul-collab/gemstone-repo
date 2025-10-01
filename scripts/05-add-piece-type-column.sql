-- Add piece_type column to manufacturing_projects table
ALTER TABLE manufacturing_projects 
ADD COLUMN piece_type TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN manufacturing_projects.piece_type IS 'Type of jewelry piece (earrings, bracelet, choker, necklace, brooch, ring, pendant, other)';
