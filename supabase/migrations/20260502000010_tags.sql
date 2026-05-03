-- tags table and scroll_tags join table

CREATE TABLE tags (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text        NOT NULL UNIQUE,
  usage_count integer     NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_tags_name        ON tags (name);
CREATE INDEX idx_tags_usage_count ON tags (usage_count DESC);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Anyone can read tags
CREATE POLICY "tags_public_read" ON tags
  FOR SELECT USING (true);

-- Authenticated users can create tags (lowercased + trimmed enforced at API level)
CREATE POLICY "tags_authenticated_insert" ON tags
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- scroll_tags join table

CREATE TABLE scroll_tags (
  scroll_id  uuid NOT NULL REFERENCES scrolls (id) ON DELETE CASCADE,
  tag_id     uuid NOT NULL REFERENCES tags (id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now() NOT NULL,

  PRIMARY KEY (scroll_id, tag_id)
);

CREATE INDEX idx_scroll_tags_tag_id ON scroll_tags (tag_id);

ALTER TABLE scroll_tags ENABLE ROW LEVEL SECURITY;

-- Anyone can read scroll_tags for public published scrolls
CREATE POLICY "scroll_tags_public_read" ON scroll_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM scrolls
      WHERE scrolls.id = scroll_tags.scroll_id
        AND scrolls.is_public = true
        AND scrolls.is_published = true
        AND scrolls.deleted_at IS NULL
    )
  );

-- Owners can read their own scroll tags (including private)
CREATE POLICY "scroll_tags_owner_read" ON scroll_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM scrolls
      WHERE scrolls.id = scroll_tags.scroll_id
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

-- Owners can manage tags on their scrolls
CREATE POLICY "scroll_tags_owner_insert" ON scroll_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM scrolls
      WHERE scrolls.id = scroll_tags.scroll_id
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

CREATE POLICY "scroll_tags_owner_delete" ON scroll_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM scrolls
      WHERE scrolls.id = scroll_tags.scroll_id
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
