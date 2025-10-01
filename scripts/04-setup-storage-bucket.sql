-- Create storage bucket for manufacturing photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('manufacturing-photos', 'manufacturing-photos', true);

-- Set up RLS policies for the storage bucket
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'manufacturing-photos');

CREATE POLICY "Allow authenticated users to upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'manufacturing-photos');

CREATE POLICY "Allow authenticated users to update their uploads" ON storage.objects
FOR UPDATE USING (bucket_id = 'manufacturing-photos');

CREATE POLICY "Allow authenticated users to delete their uploads" ON storage.objects
FOR DELETE USING (bucket_id = 'manufacturing-photos');
