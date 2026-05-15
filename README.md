# SafeTube

SafeTube is a parent-controlled YouTube player designed to provide a safe and focused viewing experience for children. Parents can approve specific channels and videos, while children enjoy a simplified, distraction-free interface with no external links or search capabilities.

## Features

- **Parent Admin Dashboard**: Manage approved content and view watch history.
- **Content Approval**: Approve entire YouTube channels with auto-sync options or select individual videos.
- **Child Player**: A tablet-friendly, PIN-protected interface for children to watch only parent-approved videos.
- **Watch History**: Track what your child is watching and for how long.
- **Session Management**: Secure authentication for parents and a separate session for children.

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide-react.dev/)
- **YouTube Integration**: [YouTube Data API v3](https://developers.google.com/youtube/v3) & `react-youtube`

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase project
- A Google Cloud project with the YouTube Data API v3 enabled

### Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd safetube
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory and add the following:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   YOUTUBE_API_KEY=your_youtube_api_key
   CHILD_JWT_SECRET=a_random_secure_string
   ```

4. **Database Schema**:
   Run the following SQL in your Supabase SQL Editor to set up the required tables and Row Level Security (RLS) policies:

   ```sql
   -- Create child_profile table
   CREATE TABLE child_profile (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
     name TEXT NOT NULL,
     pin_hash TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Create approved_channels table
   CREATE TABLE approved_channels (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
     youtube_channel_id TEXT NOT NULL,
     channel_title TEXT NOT NULL,
     thumbnail_url TEXT,
     approval_mode TEXT NOT NULL DEFAULT 'manual',
     auto_approve_new BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     UNIQUE(parent_id, youtube_channel_id)
   );

   -- Create approved_videos table
   CREATE TABLE approved_videos (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
     youtube_video_id TEXT NOT NULL,
     title TEXT NOT NULL,
     thumbnail_url TEXT,
     channel_id TEXT,
     channel_name TEXT,
     duration TEXT,
     published_at TIMESTAMPTZ,
     approval_status TEXT NOT NULL DEFAULT 'pending',
     source TEXT NOT NULL DEFAULT 'manual',
     last_verified_at TIMESTAMPTZ,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     UNIQUE(parent_id, youtube_video_id)
   );

   -- Create watch_history table
   CREATE TABLE watch_history (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     child_profile_id UUID REFERENCES child_profile(id) ON DELETE CASCADE NOT NULL,
     video_id UUID REFERENCES approved_videos(id) ON DELETE CASCADE NOT NULL,
     watched_seconds INTEGER DEFAULT 0,
     completed BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Enable RLS
   ALTER TABLE child_profile ENABLE ROW LEVEL SECURITY;
   ALTER TABLE approved_channels ENABLE ROW LEVEL SECURITY;
   ALTER TABLE approved_videos ENABLE ROW LEVEL SECURITY;
   ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;

   -- Add RLS Policies (example for child_profile)
   CREATE POLICY "Parents can manage their own child profiles" ON child_profile
     FOR ALL USING (auth.uid() = parent_id);
   -- (Add similar policies for other tables)
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

## Usage

### Parent Flow
1. **Sign Up**: Create a parent account at `/signup`.
2. **Setup**: Go to **Settings** to set your child's name and a 4-digit PIN.
3. **Approve Channels**: Search for channels in the **Channels** tab and choose an approval mode.
4. **Manage Videos**: Approve or reject videos in the **Videos** tab. Videos from synced channels will appear here.
5. **Monitor**: Check the **Watch History** tab to see what your child has been watching.

### Child Flow
1. **Access**: Navigate to `/watch`.
2. **Unlock**: Enter the 4-digit PIN set by the parent.
3. **Watch**: Tap any approved video thumbnail to start playing. The player will automatically advance to the next video when finished.

## Documentation

The codebase is thoroughly documented using JSDoc/TSDoc. Each public function, class, and interface includes a description of its purpose, parameters, and return values.
