export type ApprovalMode = 'auto' | 'manual' | 'current_only'
export type ApprovalStatus = 'approved' | 'pending' | 'rejected'
export type VideoSource = 'manual' | 'channel_sync'

export interface ApprovedChannel {
  id: string
  parent_id: string
  youtube_channel_id: string
  channel_title: string
  thumbnail_url: string | null
  approval_mode: ApprovalMode
  auto_approve_new: boolean
  created_at: string
}

export interface ApprovedVideo {
  id: string
  parent_id: string
  youtube_video_id: string
  title: string
  thumbnail_url: string | null
  channel_id: string | null
  channel_name: string | null
  duration: string | null
  published_at: string | null
  approval_status: ApprovalStatus
  source: VideoSource
  last_verified_at: string | null
  created_at: string
}

export interface ChildProfile {
  id: string
  parent_id: string
  name: string
  pin_hash: string
  created_at: string
}

export interface WatchHistory {
  id: string
  child_profile_id: string
  video_id: string
  watched_seconds: number
  completed: boolean
  created_at: string
}
