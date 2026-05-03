-- team_members table
-- Note: "teams_admin_update" policy on the teams table is also defined here
-- because it references team_members, which didn't exist in migration 003.



CREATE TABLE team_members (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id    uuid        NOT NULL REFERENCES teams (id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role       team_role   NOT NULL DEFAULT 'member',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  UNIQUE (team_id, user_id)
);

CREATE INDEX idx_team_members_team_id ON team_members (team_id);
CREATE INDEX idx_team_members_user_id ON team_members (user_id);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Team members can see who else is in their team
CREATE POLICY "team_members_read_own_team" ON team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
    )
  );

-- Team admins can insert (invite accepted → member row created via API)
CREATE POLICY "team_members_admin_insert" ON team_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
    )
  );

-- Team admins can update roles
CREATE POLICY "team_members_admin_update" ON team_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
    )
  );

-- Back-fill: teams_admin_update policy (requires team_members to exist)
CREATE POLICY "teams_admin_update" ON teams
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
        AND team_members.user_id = auth.uid()
        AND team_members.role = 'admin'
    )
  );

-- Team admins can remove members; members can remove themselves
CREATE POLICY "team_members_delete" ON team_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
    )
  );
