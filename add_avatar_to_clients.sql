ALTER TABLE clients ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS telegram_id bigint;

-- Policy to allow Read access to avatars buckets if not exists (Optional, usually public)
-- This file assumes 'clients' table exists.
