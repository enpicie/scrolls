-- users table
-- Populated from OAuth on first sign-in. id matches auth.users.id.

CREATE TABLE users (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  email           text        NOT NULL UNIQUE,
  display_name    text        NOT NULL,
  avatar_url      text,
  github_username text,
  bio             text,
  website_url     text,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL,
  deleted_at      timestamptz
);

CREATE INDEX idx_users_email ON users (email);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Anyone can read non-deleted user profiles (needed for publisher profile pages)
CREATE POLICY "users_public_read" ON users
  FOR SELECT USING (deleted_at IS NULL);

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Trigger: create public user row when auth.users row is inserted
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url, github_username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'user_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
