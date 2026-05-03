-- scrolls table (base — without active_version_id FK, added in migration 008)
-- active_version_id FK is circular with scroll_versions, resolved via ALTER TABLE.

CREATE TABLE scrolls (
  id            uuid          DEFAULT gen_random_uuid() PRIMARY KEY,

  owner_type    owner_type    NOT NULL,
  user_id       uuid          REFERENCES users (id) ON DELETE RESTRICT,
  team_id       uuid          REFERENCES teams (id) ON DELETE RESTRICT,

  created_by    uuid          NOT NULL REFERENCES users (id) ON DELETE RESTRICT,

  title         text          NOT NULL,
  slug          text          NOT NULL,
  description   text          NOT NULL,
  scroll_type   scroll_type   NOT NULL,
  content_mode  content_mode  NOT NULL DEFAULT 'inline',

  repo_url      text,
  repo_file_path text,
  repo_branch   text,

  -- active_version_id added in migration 008 after scroll_versions exists
  is_public     boolean       NOT NULL DEFAULT false,
  is_published  boolean       NOT NULL DEFAULT false,

  ai_summary      text,
  ai_summary_tags text[],

  favorite_count  integer     NOT NULL DEFAULT 0,
  pull_count      integer     NOT NULL DEFAULT 0,

  created_at    timestamptz   DEFAULT now() NOT NULL,
  updated_at    timestamptz   DEFAULT now() NOT NULL,
  deleted_at    timestamptz,

  CONSTRAINT scrolls_owner_check CHECK (
    (owner_type = 'user' AND user_id IS NOT NULL AND team_id IS NULL) OR
    (owner_type = 'team' AND team_id IS NOT NULL AND user_id IS NULL)
  ),

  CONSTRAINT scrolls_repo_fields_check CHECK (
    (content_mode = 'inline') OR
    (content_mode = 'repo' AND repo_url IS NOT NULL
      AND repo_file_path IS NOT NULL AND repo_branch IS NOT NULL)
  ),

  UNIQUE NULLS NOT DISTINCT (user_id, slug),
  UNIQUE NULLS NOT DISTINCT (team_id, slug)
);

CREATE INDEX idx_scrolls_user_id    ON scrolls (user_id);
CREATE INDEX idx_scrolls_team_id    ON scrolls (team_id);
CREATE INDEX idx_scrolls_created_by ON scrolls (created_by);
CREATE INDEX idx_scrolls_type       ON scrolls (scroll_type);

CREATE INDEX idx_scrolls_marketplace ON scrolls (is_public, is_published, deleted_at)
  WHERE is_public = true AND is_published = true AND deleted_at IS NULL;

ALTER TABLE scrolls ENABLE ROW LEVEL SECURITY;

-- Public can read published + public + non-deleted scrolls
CREATE POLICY "scrolls_public_read" ON scrolls
  FOR SELECT USING (
    is_public = true AND is_published = true AND deleted_at IS NULL
  );

-- Owners can read all their own scrolls (including drafts and private)
CREATE POLICY "scrolls_owner_read" ON scrolls
  FOR SELECT USING (
    deleted_at IS NULL
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM team_members
        WHERE team_members.team_id = scrolls.team_id
          AND team_members.user_id = auth.uid()
      )
    )
  );

-- Owners can insert
CREATE POLICY "scrolls_owner_insert" ON scrolls
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND (
      (owner_type = 'user' AND user_id = auth.uid())
      OR (owner_type = 'team' AND EXISTS (
        SELECT 1 FROM team_members
        WHERE team_members.team_id = scrolls.team_id
          AND team_members.user_id = auth.uid()
      ))
    )
  );

-- Owners can update (including soft delete via deleted_at)
CREATE POLICY "scrolls_owner_update" ON scrolls
  FOR UPDATE USING (
    deleted_at IS NULL
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM team_members
        WHERE team_members.team_id = scrolls.team_id
          AND team_members.user_id = auth.uid()
      )
    )
  );
