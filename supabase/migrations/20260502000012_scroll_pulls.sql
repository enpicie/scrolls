-- scroll_pulls table
-- Records each pull event. pulled_by is nullable (anonymous pulls allowed).

CREATE TABLE scroll_pulls (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  scroll_id   uuid        NOT NULL REFERENCES scrolls (id) ON DELETE CASCADE,
  version_id  uuid        REFERENCES scroll_versions (id) ON DELETE SET NULL,
  pulled_by   uuid        REFERENCES users (id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_scroll_pulls_scroll_id  ON scroll_pulls (scroll_id);
CREATE INDEX idx_scroll_pulls_pulled_by  ON scroll_pulls (pulled_by);
CREATE INDEX idx_scroll_pulls_version_id ON scroll_pulls (version_id);

ALTER TABLE scroll_pulls ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert pull records (anonymous pulls handled server-side)
CREATE POLICY "scroll_pulls_insert" ON scroll_pulls
  FOR INSERT WITH CHECK (true);

-- Users can read their own pull history
CREATE POLICY "scroll_pulls_read_own" ON scroll_pulls
  FOR SELECT USING (pulled_by = auth.uid());

-- Owners can read pull analytics for their scrolls
CREATE POLICY "scroll_pulls_owner_read" ON scroll_pulls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM scrolls
      WHERE scrolls.id = scroll_pulls.scroll_id
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
