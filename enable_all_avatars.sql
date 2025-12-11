-- Add avatar_url to profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id bigint PRIMARY KEY,
    subscription_end_date timestamptz,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Storage Policies for Avatars
-- Allow public upload/update to 'avatars' bucket
BEGIN;
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;

  -- Remove existing restrictive policies if any (optional, but good practice if names clash)
  -- DROP POLICY IF EXISTS "Avatar Public Upload" ON storage.objects;
  
  -- Create Upload Policy
  CREATE POLICY "Avatar Public Upload" ON storage.objects
  FOR INSERT WITH CHECK ( bucket_id = 'avatars' );

  -- Create Update Policy
  CREATE POLICY "Avatar Public Update" ON storage.objects
  FOR UPDATE USING ( bucket_id = 'avatars' );
COMMIT;

-- Table Policies (Grant access to Anon/Public users since we use client-side Telegram ID auth)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Profiles: Allow all operations (simplification for Mini App)
CREATE POLICY "Profiles Public Access" ON public.profiles
USING (true)
WITH CHECK (true);

-- Clients: Allow Update (for avatar_url)
CREATE POLICY "Clients Public Update" ON public.clients
FOR UPDATE
USING (true)
WITH CHECK (true);
