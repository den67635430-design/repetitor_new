
-- Create sequence for client_id
CREATE SEQUENCE IF NOT EXISTS profiles_client_id_seq START 1000;

-- Add username and client_id columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username text,
ADD COLUMN IF NOT EXISTS client_id bigint DEFAULT nextval('profiles_client_id_seq');

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_client_id_idx ON public.profiles(client_id);

-- Backfill existing profiles with auto-generated usernames
UPDATE public.profiles
SET username = 'user_' || substr(md5(user_id::text || created_at::text), 1, 8)
WHERE username IS NULL;
