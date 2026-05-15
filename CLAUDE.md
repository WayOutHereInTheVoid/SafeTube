### SafeTube MVP — Claude Build Task List

---

#### 🔧 Phase 1: Project Scaffolding

**[x] Task 1 — Initialize the project**

- [x] Create a new Next.js 14+ App Router project with TypeScript and Tailwind CSS
- [x] Install dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `react-youtube`, `lucide-react`
- [x] Set up `.env.local` with placeholders for: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `YOUTUBE_API_KEY`, `CHILD_PIN` (hashed)
- [x] Initialize Supabase client (browser + server variants using `@supabase/ssr`)
- [x] Configure Vercel project and link to GitHub repo

---

#### 🗃️ Phase 2: Database Schema

**[x] Task 2 — Create Supabase schema**

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

**[x] Task 3 — Configure Row Level Security**

- [x] `parents`: user can only read/write their own row
- [x] `approved_channels` / `approved_videos`: parent_id must match `auth.uid()`
- [x] `watch_history`: writable via service role only (child PIN session uses API route, not direct Supabase access)
- [x] `child_profile`: readable only by matching parent

---

#### 🔐 Phase 3: Parent Authentication

**[x] Task 4 — Parent auth flow**

- [x] Implement Supabase email/password auth
- [x] Pages: `/login`, `/signup`
- [x] Middleware protecting all `/admin/*` routes — redirect to `/login` if no session
- [x] After login, redirect to `/admin/dashboard`
- [x] Logout button in admin nav

---

#### 🎛️ Phase 4: Parent Admin Dashboard

**[x] Task 5 — Admin layout and shell**

- [x] Route: `/admin/dashboard`
- [x] Sidebar nav with: Dashboard, Channels, Videos, Watch History, Settings
- [x] Show child profile name at top
- [x] Mobile-responsive layout

**[x] Task 6 — YouTube search API route**

- [x] `POST /api/admin/youtube-search`
- [x] Accepts: `{ query, type }` where type is `channel` or `video`
- [x] Calls YouTube Data API v3 search endpoint
- [x] Returns: id, title, thumbnail, channel name
- [x] Auth-gated: requires valid parent session

**[x] Task 7 — Channel management UI**

- [x] Route: `/admin/channels`
- [x] Search box that calls Task 6 API route
- [x] Results show channel card with: thumbnail, name, subscriber count
- [x] "Add Channel" button opens modal with approval mode selector:
    - [x] **Auto-approve new uploads**
    - [x] **Queue new uploads for review**
    - [x] **Current videos only (no sync)**
- [x] Calls `POST /api/admin/channels` to save
- [x] List of currently approved channels with edit/remove

**[x] Task 8 — Video management UI**

- [x] Route: `/admin/videos`
- [x] Search box for individual video approval
- [x] Video card shows: thumbnail, title, duration, channel, publish date
- [x] "Approve" button → calls `POST /api/admin/videos`
- [x] Pending review queue (from channel sync) — approve/reject buttons
- [x] Filter tabs: All | Approved | Pending | Rejected

---

#### 🔌 Phase 5: Child-Facing API Routes

**[x] Task 9 — Child session authentication**

- [x] `POST /api/child/auth` — accepts PIN, returns a short-lived signed JWT (24hr) stored in httpOnly cookie
- [x] PIN is stored hashed (bcrypt) in `child_profile` table
- [x] All `/api/child/*` routes validate this JWT

**[x] Task 10 — Approved content endpoint**

- [x] `GET /api/child/playlist`
- [x] Returns all `approval_status = approved` videos for that parent's child profile
- [x] Returns: `{ id, youtube_video_id, title, thumbnail_url, duration }`
- [x] Shuffles or returns in added order (your call — ask Kate)
- [x] Never exposes raw YouTube search or channel data

**[x] Task 11 — Watch history logging**

- [x] `POST /api/child/watch` — logs `{ video_id, watched_seconds, completed }`
- [x] Called by the player app periodically and on video end

---

#### 📺 Phase 6: Child Player App

**[x] Task 12 — Child PIN gate**

- [x] Route: `/watch`
- [x] Full-screen PIN entry UI (large number pad, tablet-friendly)
- [x] On success: sets httpOnly cookie via Task 9, redirects to `/watch/play`
- [x] No back button, no navigation

**[x] Task 13 — Child player UI**

- [x] Route: `/watch/play`
- [x] Fetches playlist from Task 10 on load
- [x] Displays: approved video thumbnails in a simple grid (no titles linking out)
- [x] Tap to play → loads YouTube IFrame Player
- [x] Player config:
    - [x] `rel=0`, `modestbranding=1`, `controls=1`
    - [x] No `enablejsapi` links out; all interaction through IFrame API
    - [x] On video end: auto-advance to next approved video
- [x] No search bar, no URL bar accessible, no YouTube logo link (CSS override)
- [x] "Watching: [title]" indicator only
- [x] Large touch targets for tablet

**[x] Task 14 — TV/fullscreen mode**

- [x] Add `?fullscreen=true` param that hides all chrome
- [x] CSS: `touch-action: none` on navigation areas
- [x] Test embed behavior on iPad and laptop browser

---

#### 🔄 Phase 7: Content Sync Worker

**[ ] Task 15 — Supabase Edge Function: channel sync**

- [ ] Function name: `sync-channel-uploads`
- [ ] For each `approved_channels` row where `approval_mode != current_only`:
    - [ ] Fetch the channel's uploads playlist via YouTube Data API
    - [ ] For each video not already in `approved_videos`:
        - [ ] If `auto_approve_new = true` → insert with `approval_status = approved`
        - [ ] If `auto_approve_new = false` → insert with `approval_status = pending`
- [ ] Also verify existing approved videos: check if still public/playable
    - [ ] Flag removed/private/age-restricted as `approval_status = rejected` with a note

**[ ] Task 16 — Schedule the sync**

- [ ] Configure Supabase cron via `pg_cron` to run `sync-channel-uploads` every 6 hours
- [ ] Add manual "Sync Now" button in admin dashboard that triggers the function on demand

---

#### 🧹 Phase 8: Polish & Settings

**[x] Task 17 — Admin watch history view**

- [x] Route: `/admin/history`
- [x] Table: child name, video title, date, duration watched, completed Y/N
- [x] Simple, no charts needed for MVP

**[x] Task 18 — Settings page**

- [x] Route: `/admin/settings`
- [x] Change child PIN
- [x] Change child profile name
- [x] Parent password change (via Supabase Auth)

**[ ] Task 19 — Error states and empty states**

- [x] Child player: "No videos yet — ask a parent!" screen
- [ ] Admin: loading skeletons, YouTube API error handling (quota exceeded message)
- [x] 404 and auth-redirect handling

**[x] Task 20 — Deploy to Vercel**

- [x] Set all env vars in Vercel project settings
- [x] Confirm Supabase prod URL vs local
- [x] Test full flow: parent login → approve video → child PIN → watch video → history appears in admin

---

### Execution Order Summary

| **Phase** | **Tasks** | **Deliverable**                      | **Status**    |
| --------- | --------- | ------------------------------------ | ------------- |
| 1         | 1         | Runnable Next.js skeleton            | ✅ Completed  |
| 2         | 2–3       | Database ready, RLS locked down      | ✅ Completed  |
| 3         | 4         | Parent can log in                    | ✅ Completed  |
| 4         | 5–8       | Parent can approve content           | ✅ Completed  |
| 5         | 9–11      | Backend enforces allowlist           | ✅ Completed  |
| 6         | 12–14     | Child can watch approved content     | ✅ Completed  |
| 7         | 15–16     | Channels auto-sync new uploads       | ⏳ Outstanding |
| 8         | 17–20     | Polished, deployed, production-ready | 🛠️ In Progress |
