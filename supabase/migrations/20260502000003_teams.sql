-- teams table

CREATE TABLE teams (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text        NOT NULL,
  slug        text        NOT NULL UNIQUE,
  avatar_url  text,
  bio         text,
  created_by  uuid        NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL,
  deleted_at  timestamptz
);

CREATE INDEX idx_teams_slug       ON teams (slug);
CREATE INDEX idx_teams_created_by ON teams (created_by);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Anyone can read non-deleted team profiles
CREATE POLICY "teams_public_read" ON teams
  FOR SELECT USING (deleted_at IS NULL);

-- Team admins can update team profile
CREATE POLICY "teams_admin_update" ON teams
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
        AND team_members.user_id = auth.uid()
        AND team_members.role = 'admin'
    )
  );

-- Authenticated users can create teams
CREATE POLICY "teams_authenticated_insert" ON teams
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());
