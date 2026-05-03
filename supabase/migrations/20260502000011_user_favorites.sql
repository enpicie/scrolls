-- user_favorites table

CREATE TABLE user_favorites (
  user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  scroll_id  uuid NOT NULL REFERENCES scrolls (id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,

  PRIMARY KEY (user_id, scroll_id)
);

CREATE INDEX idx_user_favorites_scroll_id ON user_favorites (scroll_id);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Users can read their own favorites
CREATE POLICY "user_favorites_read_own" ON user_favorites
  FOR SELECT USING (user_id = auth.uid());

-- Users can add favorites
CREATE POLICY "user_favorites_insert_own" ON user_favorites
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can remove their own favorites
CREATE POLICY "user_favorites_delete_own" ON user_favorites
  FOR DELETE USING (user_id = auth.uid());
