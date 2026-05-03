-- Sync auth.users → public.users on sign-up and sign-in
-- Runs as SECURITY DEFINER to bypass RLS on insert.

CREATE OR REPLACE FUNCTION public.handle_auth_user_upsert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url, github_username)
  VALUES (
    NEW.id,
    NEW.email,
    -- Prefer full_name → name → email prefix as display_name
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'user_name'  -- GitHub OAuth populates this
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email        = EXCLUDED.email,
    display_name = COALESCE(NULLIF(EXCLUDED.display_name, ''), public.users.display_name),
    avatar_url   = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    github_username = COALESCE(EXCLUDED.github_username, public.users.github_username),
    updated_at   = now()
  WHERE public.users.deleted_at IS NULL;

  RETURN NEW;
END;
$$;

-- Fires on first sign-up (INSERT) and on every sign-in that updates email/metadata (UPDATE)
CREATE TRIGGER on_auth_user_upsert
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_upsert();
