-- Denormalized counter triggers
-- Keeps scrolls.favorite_count, scrolls.pull_count, and tags.usage_count in sync.

-- favorite_count: increment on insert, decrement on delete

CREATE OR REPLACE FUNCTION update_scroll_favorite_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE scrolls SET favorite_count = favorite_count + 1 WHERE id = NEW.scroll_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE scrolls SET favorite_count = GREATEST(favorite_count - 1, 0) WHERE id = OLD.scroll_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_scroll_favorite_count
  AFTER INSERT OR DELETE ON user_favorites
  FOR EACH ROW EXECUTE FUNCTION update_scroll_favorite_count();

-- pull_count: increment on insert only (pulls are never deleted)

CREATE OR REPLACE FUNCTION update_scroll_pull_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE scrolls SET pull_count = pull_count + 1 WHERE id = NEW.scroll_id;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_scroll_pull_count
  AFTER INSERT ON scroll_pulls
  FOR EACH ROW EXECUTE FUNCTION update_scroll_pull_count();

-- tags.usage_count: increment on insert, decrement on delete

CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tags SET usage_count = GREATEST(usage_count - 1, 0) WHERE id = OLD.tag_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_tag_usage_count
  AFTER INSERT OR DELETE ON scroll_tags
  FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- updated_at auto-update trigger (applied to all tables with updated_at)

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_team_invitations_updated_at
  BEFORE UPDATE ON team_invitations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_scrolls_updated_at
  BEFORE UPDATE ON scrolls
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
