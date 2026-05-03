-- Add active_version_id to scrolls now that scroll_versions exists.
-- Circular FK resolved: scrolls → scroll_versions → scrolls.
-- ON DELETE SET NULL: if a version is somehow removed, scroll reverts to unpinned state.

ALTER TABLE scrolls
  ADD COLUMN active_version_id uuid REFERENCES scroll_versions (id) ON DELETE SET NULL;

CREATE INDEX idx_scrolls_active_version ON scrolls (active_version_id)
  WHERE active_version_id IS NOT NULL;
