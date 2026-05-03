-- Custom ENUM types for Scrolls
-- Created before any tables that reference them.

CREATE TYPE team_role           AS ENUM ('admin', 'member');
CREATE TYPE invitation_status   AS ENUM ('pending', 'accepted', 'declined', 'expired');
CREATE TYPE scroll_type         AS ENUM ('general', 'stack', 'app');
CREATE TYPE owner_type          AS ENUM ('user', 'team');
CREATE TYPE content_mode        AS ENUM ('inline', 'repo');
CREATE TYPE version_event_type  AS ENUM ('published', 'set_active');
