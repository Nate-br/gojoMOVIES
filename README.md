# ጎጆ films (gojoMOVIES)

A modern Ethiopian/Amharic movie streaming platform that aggregates and organizes video content, providing users with a curated viewing experience.

## Overview

gojoMOVIES is a full-stack web application designed to showcase Ethiopian and Amharic cinema. The platform features user authentication, personalized libraries, content categorization, and an intuitive browsing experience optimized for both desktop and mobile devices.

## Features

- Browse Ethiopian/Amharic movies with intelligent categorization
- User authentication and profile management
- Personal library with likes, watch later, and viewing history
- Admin dashboard for user management and platform configuration
- Bilingual interface (English/Amharic) with proper Ethiopic script support
- Advanced search and filtering capabilities
- Rating and review system
- Custom video player with keyboard shortcuts and playback controls
- Responsive design optimized for all screen sizes

## Technology Stack

### Frontend
- Vanilla JavaScript (ES6+)
- HTML5 & CSS3
- Supabase Client Library

### Backend
- Vercel Serverless Functions (Node.js)
- External Video Content API

### Database & Authentication
- Supabase (PostgreSQL)
- Row Level Security (RLS)
- Supabase Auth

### Hosting & Deployment
- Vercel

## Architecture

The application follows a serverless architecture with a static frontend and API endpoints deployed as Vercel Functions. User data is stored in Supabase with Row Level Security policies ensuring data isolation between users.

## Setup Instructions

### Prerequisites

- Node.js 18 or higher
- Supabase account
- Video content API key
- Vercel account (for deployment)

### Environment Configuration

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Configure the following environment variables:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
YT_API_KEY=your-video-api-key
```

### Database Setup

Execute the following SQL in your Supabase SQL Editor to create the required tables:

```sql
-- User profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User likes
CREATE TABLE likes (
  user_id UUID REFERENCES auth.users,
  video_id TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, video_id)
);

-- Watch later queue
CREATE TABLE watch_later (
  user_id UUID REFERENCES auth.users,
  video_id TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, video_id)
);

-- Viewing history
CREATE TABLE views (
  user_id UUID REFERENCES auth.users,
  video_id TEXT NOT NULL,
  title TEXT,
  watched_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, video_id)
);

-- Site configuration
CREATE TABLE configs (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_later ENABLE ROW LEVEL SECURITY;
ALTER TABLE views ENABLE ROW LEVEL SECURITY;
ALTER TABLE configs ENABLE ROW LEVEL SECURITY;
```

Configure Row Level Security policies according to your security requirements. Refer to the Supabase documentation for RLS policy examples.

### Local Development

Install the Vercel CLI and start the development server:

```bash
npm install -g vercel
vercel dev
```

The application will be available at `http://localhost:3000`

### Production Deployment

Deploy to Vercel:

```bash
vercel login
vercel --prod
```

Ensure all environment variables are configured in the Vercel dashboard under Project Settings → Environment Variables.

## Project Structure

```
gojoMOVIES/
├── api/
│   ├── catalog.js      # Content aggregation and categorization
│   ├── config.js       # Configuration endpoint for frontend
│   └── ping.js         # Health check endpoint
├── index.html          # Main application page
├── app.js              # Main application logic
├── player.html         # Video player interface
├── player.js           # Video player logic
├── admin.html          # Administrative dashboard
├── admin.js            # Admin dashboard logic
├── style.css           # Global styles
├── .env.example        # Environment variables template
└── .gitignore          # Git ignore configuration
```

## API Reference

### GET `/api/catalog`

Fetches and categorizes Ethiopian/Amharic movies.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `queries` | string | - | Comma-separated search queries |
| `min` | integer | 900 | Minimum video duration in seconds |
| `pages` | integer | 3 | Number of search result pages (max: 5) |
| `max` | integer | 100 | Maximum videos per category |
| `debug` | boolean | false | Enable debug output |

**Example:**
```
GET /api/catalog?queries=Amharic%20movie%202024&min=600&pages=2
```

### GET `/api/config`

Returns Supabase configuration for frontend initialization.

**Response:**
```json
{
  "supabaseUrl": "https://your-project.supabase.co",
  "supabaseAnonKey": "your-anon-key"
}
```

### GET `/api/ping`

Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "ok"
}
```

## Administration

### Granting Admin Access

To grant administrative privileges to a user:

1. Navigate to Supabase Dashboard → Table Editor → `profiles`
2. Locate the user's record
3. Update the `role` field from `user` to `admin`
4. The user will now have access to `/admin.html`

### Admin Features

- User management and analytics
- View user libraries (likes, watch later, viewing history)
- Platform statistics dashboard
- Custom branding configuration

## License

Copyright © 2024. All Rights Reserved.

This code is made available for viewing and reference purposes only. You may not use, modify, distribute, or create derivative works from this code without explicit permission. See the [LICENSE](LICENSE) file for complete terms.

## Acknowledgments

Built for the Ethiopian cinema community using modern web technologies and cloud infrastructure.
