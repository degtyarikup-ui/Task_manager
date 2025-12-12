-- 1. Create the 'avatars' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects (usually enabled by default, but good measure)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy to allow ANYONE to view (download) images from 'avatars'
-- Check if policy exists first to avoid error? Complex in SQL. 
-- Just creating it might fail if exists. We'll verify manually or use DO block.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Public Access Avatars'
    ) THEN
        CREATE POLICY "Public Access Avatars"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'avatars' );
    END IF;
END
$$;
