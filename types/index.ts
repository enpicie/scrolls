// Enums — match Postgres ENUM values exactly
export type ScrollType = 'general' | 'stack' | 'app'
export type OwnerType = 'user' | 'team'
export type ContentMode = 'inline' | 'repo'
export type TeamRole = 'admin' | 'member'
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired'
export type VersionEventType = 'published' | 'set_active'

// ─── Core entities ────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  github_username: string | null
  bio: string | null
  website_url: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Team {
  id: string
  name: string
  slug: string
  avatar_url: string | null
  bio: string | null
  created_by: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: TeamRole
  created_at: string
  updated_at: string
  // Joined
  user?: User
  team?: Team
}

export interface TeamInvitation {
  id: string
  team_id: string
  invited_by: string
  email: string | null
  github_username: string | null
  role: TeamRole
  status: InvitationStatus
  expires_at: string
  created_at: string
  updated_at: string
  // Joined
  team?: Team
  inviter?: User
}

export interface Scroll {
  id: string
  owner_type: OwnerType
  user_id: string | null
  team_id: string | null
  created_by: string
  title: string
  slug: string
  description: string
  scroll_type: ScrollType
  content_mode: ContentMode
  repo_url: string | null
  repo_file_path: string | null
  repo_branch: string | null
  active_version_id: string | null
  is_public: boolean
  is_published: boolean
  ai_summary: string | null
  ai_summary_tags: string[] | null
  favorite_count: number
  pull_count: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  // Joined
  owner_user?: User
  owner_team?: Team
  author?: User
  active_version?: ScrollVersion
  tags?: Tag[]
  is_favorited?: boolean // hydrated per-request for authenticated users
}

export interface ScrollVersion {
  id: string
  scroll_id: string
  version: string
  content: string
  changelog: string | null
  published_by: string
  repo_commit_sha: string | null
  ai_summary: AiSummary | null
  created_at: string
  // Joined
  publisher?: User
}

export interface ScrollVersionEvent {
  id: string
  scroll_id: string
  version_id: string
  event_type: VersionEventType
  actor_id: string
  created_at: string
  // Joined
  actor?: User
  version?: ScrollVersion
}

export interface Tag {
  id: string
  name: string
  usage_count: number
  created_at: string
}

export interface ScrollTag {
  scroll_id: string
  tag_id: string
  created_at: string
}

export interface UserFavorite {
  user_id: string
  scroll_id: string
  created_at: string
  // Joined
  scroll?: Scroll
}

export interface ScrollPull {
  id: string
  scroll_id: string
  version_id: string | null
  pulled_by: string | null
  created_at: string
}

// ─── AI summary structure ─────────────────────────────────────────────────────

export interface AiSummary {
  one_liner: string
  what_it_enforces: string[]
  best_for: string[]
  stack_signals: string[]
}

// ─── API request/response shapes ─────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  has_more: boolean
}

export interface CreateScrollBody {
  title: string
  slug: string
  description: string
  scroll_type: ScrollType
  content_mode: ContentMode
  is_public: boolean
  owner_type: OwnerType
  team_id?: string
  repo_url?: string
  repo_file_path?: string
  repo_branch?: string
}

export interface UpdateScrollBody {
  title?: string
  description?: string
  scroll_type?: ScrollType
  is_public?: boolean
  repo_url?: string
  repo_file_path?: string
  repo_branch?: string
  tags?: string[]
}

export interface PublishVersionBody {
  version: string
  content: string
  changelog?: string
  set_active?: boolean
}

export interface CreateTeamBody {
  name: string
  slug: string
  bio?: string
}

export interface InviteMemberBody {
  email?: string
  github_username?: string
  role: TeamRole
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

export const SCROLL_TYPE_LABELS: Record<ScrollType, string> = {
  general: 'General Standard',
  stack: 'Stack Standard',
  app: 'App Design',
}

export const SCROLL_TYPE_DESCRIPTIONS: Record<ScrollType, string> = {
  general: 'Stack-agnostic platform philosophy. Applies to any project.',
  stack: 'Implements platform rules for a specific set of technologies.',
  app: 'Describes what a specific app builds and how.',
}
