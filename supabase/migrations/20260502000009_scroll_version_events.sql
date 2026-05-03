-- scroll_version_events table
-- Immutable audit log of version lifecycle events.

CREATE TABLE scroll_version_events (
  id          uuid               DEFAULT gen_random_uuid() PRIMARY KEY,
  scroll_id   uuid               NOT NULL REFERENCES scrolls (id) ON DELETE CASCADE,
  version_id  uuid               NOT NULL REFERENCES scroll_versions (id) ON DELETE CASCADE,
  event_type  version_event_type NOT NULL,
  actor_id    uuid               NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  created_at  timestamptz        DEFAULT now() NOT NULL
);

CREATE INDEX idx_scroll_version_events_scroll_id  ON scroll_version_events (scroll_id);
CREATE INDEX idx_scroll_version_events_version_id ON scroll_version_events (version_id);
CREATE INDEX idx_scroll_version_events_actor_id   ON scroll_version_events (actor_id);

ALTER TABLE scroll_version_events ENABLE ROW LEVEL SECURITY;

-- Owners can read the event log for their scrolls
CREATE POLICY "scroll_version_events_owner_read" ON scroll_version_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM scrolls
      WHERE scrolls.id = scroll_version_events.scroll_id
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

-- Only server-side code writes events (via service role); no INSERT policy needed for anon/user keys
