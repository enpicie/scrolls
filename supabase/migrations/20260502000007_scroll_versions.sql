-- scroll_versions table
-- Immutable snapshots of scroll content. Never updated or deleted except via cascade.

CREATE TABLE scroll_versions (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  scroll_id      uuid        NOT NULL REFERENCES scrolls (id) ON DELETE CASCADE,
  version        text        NOT NULL,
  content        text        NOT NULL,
  changelog      text,
  published_by   uuid        NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  repo_commit_sha text,
  ai_summary     jsonb,
  created_at     timestamptz DEFAULT now() NOT NULL,

  UNIQUE (scroll_id, version)
);

CREATE INDEX idx_scroll_versions_scroll_id    ON scroll_versions (scroll_id);
CREATE INDEX idx_scroll_versions_published_by ON scroll_versions (published_by);

ALTER TABLE scroll_versions ENABLE ROW LEVEL SECURITY;

-- Public can read versions of published + public scrolls
CREATE POLICY "scroll_versions_public_read" ON scroll_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM scrolls
      WHERE scrolls.id = scroll_versions.scroll_id
        AND scrolls.is_public = true
        AND scrolls.is_published = true
        AND scrolls.deleted_at IS NULL
    )
  );

-- Owners can read all versions of their scrolls
CREATE POLICY "scroll_versions_owner_read" ON scroll_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM scrolls
      WHERE scrolls.id = scroll_versions.scroll_id
        AND scrolls.deleted_at IS NULL
        AND (
          scrolls.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = scrolls.team_id
              AND team_members.user_id = auth.uid()
          )
        )
    )
  );

-- Owners can insert new versions
CREATE POLICY "scroll_versions_owner_insert" ON scroll_versions
  FOR INSERT WITH CHECK (
    published_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM scrolls
      WHERE scrolls.id = scroll_versions.scroll_id
        AND scrolls.deleted_at IS NULL
        AND (
          scrolls.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = scrolls.team_id
              AND team_members.user_id = auth.uid()
          )
        )
    )
  );
