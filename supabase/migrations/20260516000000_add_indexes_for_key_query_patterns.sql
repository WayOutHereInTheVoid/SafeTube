-- Composite index for playlist query (most critical)
-- WHERE parent_id = X AND approval_status = 'approved'
CREATE INDEX IF NOT EXISTS idx_approved_videos_parent_status
  ON public.approved_videos (parent_id, approval_status);

-- Index for watch history queries by child profile
CREATE INDEX IF NOT EXISTS idx_watch_history_child_profile
  ON public.watch_history (child_profile_id);

-- Index for watch history join on video
CREATE INDEX IF NOT EXISTS idx_watch_history_video
  ON public.watch_history (video_id);

-- Index for channel sync lookups by channel_id
CREATE INDEX IF NOT EXISTS idx_approved_videos_channel
  ON public.approved_videos (channel_id);
