/**
 * Mode for channel approval.
 * - 'auto': Automatically approve all new uploads.
 * - 'manual': Queue new uploads for manual review.
 * - 'current_only': Only approve current videos, do not sync new uploads.
 */
export type ApprovalMode = 'auto' | 'manual' | 'current_only'

/**
 * Status of a video's approval.
 */
export type ApprovalStatus = 'approved' | 'pending' | 'rejected'

/**
 * The source of a video entry.
 * - 'manual': Manually added by a parent.
 * - 'channel_sync': Automatically added via channel synchronization.
 */
export type VideoSource = 'manual' | 'channel_sync'

/**
 * Represents a YouTube channel approved by a parent.
 */
export interface ApprovedChannel {
  /** Unique identifier for the approved channel record. */
  id: string
  /** ID of the parent who approved the channel. */
  parent_id: string
  /** YouTube's internal channel ID. */
  youtube_channel_id: string
  /** Title of the YouTube channel. */
  channel_title: string
  /** URL to the channel's thumbnail image. */
  thumbnail_url: string | null
  /** Approval mode for this channel. */
  approval_mode: ApprovalMode
  /** Whether to automatically approve new videos from this channel. */
  auto_approve_new: boolean
  /** Timestamp when the channel was approved. */
  created_at: string
}

/**
 * Represents a YouTube video that has been reviewed or synced.
 */
export interface ApprovedVideo {
  /** Unique identifier for the approved video record. */
  id: string
  /** ID of the parent who managed this video. */
  parent_id: string
  /** YouTube's internal video ID. */
  youtube_video_id: string
  /** Title of the video. */
  title: string
  /** URL to the video's thumbnail image. */
  thumbnail_url: string | null
  /** ID of the channel this video belongs to. */
  channel_id: string | null
  /** Name of the channel this video belongs to. */
  channel_name: string | null
  /** Duration of the video. */
  duration: string | null
  /** ISO timestamp when the video was published on YouTube. */
  published_at: string | null
  /** Current approval status of the video. */
  approval_status: ApprovalStatus
  /** How the video was added to the system. */
  source: VideoSource
  /** Timestamp when the video's status was last verified. */
  last_verified_at: string | null
  /** Timestamp when the record was created. */
  created_at: string
}

/**
 * Represents a child profile associated with a parent.
 */
export interface ChildProfile {
  /** Unique identifier for the child profile. */
  id: string
  /** ID of the parent who owns this profile. */
  parent_id: string
  /** Name of the child. */
  name: string
  /** Hashed PIN used for child authentication. */
  pin_hash: string
  /** Timestamp when the profile was created. */
  created_at: string
}

/**
 * Represents a record of a child watching a video.
 */
export interface WatchHistory {
  /** Unique identifier for the watch history record. */
  id: string
  /** ID of the child profile that watched the video. */
  child_profile_id: string
  /** YouTube video ID of the watched video. */
  video_id: string
  /** Number of seconds the video was watched. */
  watched_seconds: number
  /** Whether the child completed watching the video. */
  completed: boolean
  /** Timestamp when the watch record was created. */
  created_at: string
}
