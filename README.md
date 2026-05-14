### SafeTube MVP — Claude Build Task List

---

#### 🔧 Phase 1: Project Scaffolding

**Task 1 — Initialize the project**

- Create a new Next.js 14+ App Router project with TypeScript and Tailwind CSS
- Install dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `react-youtube`, `lucide-react`
- Set up `.env.local` with placeholders for: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `YOUTUBE_API_KEY`, `CHILD_PIN` (hashed)
- Initialize Supabase client (browser + server variants using `@supabase/ssr`)
- Configure Vercel project and link to GitHub repo

---

#### 🗃️ Phase 2: Database Schema

**Task 2 — Create Supabase schema**

Create the following tables with RLS enabled:

```other
parents            — id, email, created_at (maps to Supabase Auth user)
child_profile      — id, parent_id, name, pin_hash, created_at
approved_channels  — id, parent_id, youtube_channel_id, channel_title, 
                     thumbnail_url, approval_mode (enum: auto|manual|current_only), 
                     auto_approve_new, created_at
approved_videos    — id, parent_id, youtube_video_id, title, thumbnail_url, 
                     channel_id, duration, published_at, approval_status 
                     (enum: approved|pending|rejected), source (manual|channel_sync), 
                     last_verified_at, created_at
watch_history      — id, child_profile_id, video_id, watched_seconds, 
                     completed, created_at
```

**Task 3 — Configure Row Level Security**

- `parents`: user can only read/write their own row
- `approved_channels` / `approved_videos`: parent_id must match `auth.uid()`
- `watch_history`: writable via service role only (child PIN session uses API route, not direct Supabase access)
- `child_profile`: readable only by matching parent

---

#### 🔐 Phase 3: Parent Authentication

**Task 4 — Parent auth flow**

- Implement Supabase email/password auth
- Pages: `/login`, `/signup`
- Middleware protecting all `/admin/*` routes — redirect to `/login` if no session
- After login, redirect to `/admin/dashboard`
- Logout button in admin nav

---

#### 🎛️ Phase 4: Parent Admin Dashboard

**Task 5 — Admin layout and shell**

- Route: `/admin/dashboard`
- Sidebar nav with: Dashboard, Channels, Videos, Watch History, Settings
- Show child profile name at top
- Mobile-responsive layout

**Task 6 — YouTube search API route**

- `POST /api/admin/youtube-search`
- Accepts: `{ query, type }` where type is `channel` or `video`
- Calls YouTube Data API v3 search endpoint
- Returns: id, title, thumbnail, channel name
- Auth-gated: requires valid parent session

**Task 7 — Channel management UI**

- Route: `/admin/channels`
- Search box that calls Task 6 API route
- Results show channel card with: thumbnail, name, subscriber count
- "Add Channel" button opens modal with approval mode selector:
    - **Auto-approve new uploads**
    - **Queue new uploads for review**
    - **Current videos only (no sync)**
- Calls `POST /api/admin/channels` to save
- List of currently approved channels with edit/remove

**Task 8 — Video management UI**

- Route: `/admin/videos`
- Search box for individual video approval
- Video card shows: thumbnail, title, duration, channel, publish date
- "Approve" button → calls `POST /api/admin/videos`
- Pending review queue (from channel sync) — approve/reject buttons
- Filter tabs: All | Approved | Pending | Rejected

---

#### 🔌 Phase 5: Child-Facing API Routes

**Task 9 — Child session authentication**

- `POST /api/child/auth` — accepts PIN, returns a short-lived signed JWT (24hr) stored in httpOnly cookie
- PIN is stored hashed (bcrypt) in `child_profile` table
- All `/api/child/*` routes validate this JWT

**Task 10 — Approved content endpoint**

- `GET /api/child/playlist`
- Returns all `approval_status = approved` videos for that parent's child profile
- Returns: `{ id, youtube_video_id, title, thumbnail_url, duration }`
- Shuffles or returns in added order (your call — ask Kate)
- Never exposes raw YouTube search or channel data

**Task 11 — Watch history logging**

- `POST /api/child/watch` — logs `{ video_id, watched_seconds, completed }`
- Called by the player app periodically and on video end

---

#### 📺 Phase 6: Child Player App

**Task 12 — Child PIN gate**

- Route: `/watch`
- Full-screen PIN entry UI (large number pad, tablet-friendly)
- On success: sets httpOnly cookie via Task 9, redirects to `/watch/play`
- No back button, no navigation

**Task 13 — Child player UI**

- Route: `/watch/play`
- Fetches playlist from Task 10 on load
- Displays: approved video thumbnails in a simple grid (no titles linking out)
- Tap to play → loads YouTube IFrame Player
- Player config:
    - `rel=0`, `modestbranding=1`, `controls=1`
    - No `enablejsapi` links out; all interaction through IFrame API
    - On video end: auto-advance to next approved video
- No search bar, no URL bar accessible, no YouTube logo link (CSS override)
- "Watching: [title]" indicator only
- Large touch targets for tablet

**Task 14 — TV/fullscreen mode**

- Add `?fullscreen=true` param that hides all chrome
- CSS: `touch-action: none` on navigation areas
- Test embed behavior on iPad and laptop browser

---

#### 🔄 Phase 7: Content Sync Worker

**Task 15 — Supabase Edge Function: channel sync**

- Function name: `sync-channel-uploads`
- For each `approved_channels` row where `approval_mode != current_only`:
    - Fetch the channel's uploads playlist via YouTube Data API
    - For each video not already in `approved_videos`:
        - If `auto_approve_new = true` → insert with `approval_status = approved`
        - If `auto_approve_new = false` → insert with `approval_status = pending`
- Also verify existing approved videos: check if still public/playable
    - Flag removed/private/age-restricted as `approval_status = rejected` with a note

**Task 16 — Schedule the sync**

- Configure Supabase cron via `pg_cron` to run `sync-channel-uploads` every 6 hours
- Add manual "Sync Now" button in admin dashboard that triggers the function on demand

---

#### 🧹 Phase 8: Polish & Settings

**Task 17 — Admin watch history view**

- Route: `/admin/history`
- Table: child name, video title, date, duration watched, completed Y/N
- Simple, no charts needed for MVP

**Task 18 — Settings page**

- Route: `/admin/settings`
- Change child PIN
- Change child profile name
- Parent password change (via Supabase Auth)

**Task 19 — Error states and empty states**

- Child player: "No videos yet — ask a parent!" screen
- Admin: loading skeletons, YouTube API error handling (quota exceeded message)
- 404 and auth-redirect handling

**Task 20 — Deploy to Vercel**

- Set all env vars in Vercel project settings
- Confirm Supabase prod URL vs local
- Test full flow: parent login → approve video → child PIN → watch video → history appears in admin

---

### Execution Order Summary

| **Phase** | **Tasks** | **Deliverable**                      |
| --------- | --------- | ------------------------------------ |
| 1         | 1         | Runnable Next.js skeleton            |
| 2         | 2–3       | Database ready, RLS locked down      |
| 3         | 4         | Parent can log in                    |
| 4         | 5–8       | Parent can approve content           |
| 5         | 9–11      | Backend enforces allowlist           |
| 6         | 12–14     | Child can watch approved content     |
| 7         | 15–16     | Channels auto-sync new uploads       |
| 8         | 17–20     | Polished, deployed, production-ready |
