-- 1. Add subscription_end_date to profiles
alter table profiles 
add column if not exists subscription_end_date timestamptz;

-- 2. Grant access to authenticated users to read profiles (if not already)
-- Usually profiles are public or viewable by owner.
create policy "Public profiles are viewable by everyone" on profiles
  for select using (true);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- (If policies already exist, these might fail, which is fine in the SQL editor, or verify first)
