-- team_invitations table

CREATE TABLE team_invitations (
  id              uuid              DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id         uuid              NOT NULL REFERENCES teams (id) ON DELETE CASCADE,
  invited_by      uuid              NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  email           text,
  github_username text,
  role            team_role         NOT NULL DEFAULT 'member',
  status          invitation_status NOT NULL DEFAULT 'pending',
  expires_at      timestamptz       NOT NULL DEFAULT (now() + interval '7 days'),
  created_at      timestamptz       DEFAULT now() NOT NULL,
  updated_at      timestamptz       DEFAULT now() NOT NULL,

  CONSTRAINT invitations_contact_check CHECK (
    email IS NOT NULL OR github_username IS NOT NULL
  )
);

CREATE INDEX idx_team_invitations_team_id ON team_invitations (team_id);
CREATE INDEX idx_team_invitations_email   ON team_invitations (email)
  WHERE email IS NOT NULL;
CREATE INDEX idx_team_invitations_github  ON team_invitations (github_username)
  WHERE github_username IS NOT NULL;
CREATE INDEX idx_team_invitations_status  ON team_invitations (status)
  WHERE status = 'pending';

ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Users can see invitations sent to their email or GitHub username
CREATE POLICY "invitations_read_own" ON team_invitations
  FOR SELECT USING (
    status = 'pending'
    AND (
      email = (SELECT email FROM users WHERE id = auth.uid())
      OR github_username = (SELECT github_username FROM users WHERE id = auth.uid())
    )
  );

-- Team admins can see all invitations for their team
CREATE POLICY "invitations_admin_read" ON team_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_invitations.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.role = 'admin'
    )
  );

-- Team admins can create invitations
CREATE POLICY "invitations_admin_insert" ON team_invitations
  FOR INSERT WITH CHECK (
    invited_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_invitations.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.role = 'admin'
    )
  );

-- Invitee and admins can update status (accept/decline/cancel)
CREATE POLICY "invitations_update" ON team_invitations
  FOR UPDATE USING (
    email = (SELECT email FROM users WHERE id = auth.uid())
    OR github_username = (SELECT github_username FROM users WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_invitations.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.role = 'admin'
    )
  );
