# ጎጆ films (gojoMOVIES)

Ethiopian/Amharic movie streaming platform built with Supabase, YouTube API, and Vercel.

## ⚠️ Security Notice

**IMPORTANT**: If you cloned this repository before the security fixes, the Supabase credentials in the Git history are compromised. Follow the [SECURITY.md](./SECURITY.md) guide to rotate your keys immediately.

## Features

- 🎬 Browse Ethiopian/Amharic movies from YouTube
- 🔐 User authentication with Supabase
- ❤️ Like and save movies to watch later
- 📊 Admin dashboard for user management
- 🎨 Modern, responsive UI with Amharic font support
- 🔍 Search and filter movies by category
- ⭐ Rate and review movies
- 📱 Mobile-friendly design

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Video Source**: YouTube Data API v3
- **Hosting**: Vercel

## Setup

### Prerequisites

- Node.js 18+ (for local development)
- Supabase account
- YouTube Data API key
- Vercel account (for deployment)

### 1. Clone the Repository

```bash
git clone https://github.com/Nate-br/gojoMOVIES.git
cd gojoMOVIES
```

### 2. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your actual credentials
nano .env
```

Required environment variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon/public key
- `YT_API_KEY` - Your YouTube Data API v3 key

### 3. Set Up Supabase Database

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create likes table
CREATE TABLE likes (
  user_id UUID REFERENCES auth.users,
  video_id TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, video_id)
);

-- Create watch_later table
CREATE TABLE watch_later (
  user_id UUID REFERENCES auth.users,
  video_id TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, video_id)
);

-- Create views table
CREATE TABLE views (
  user_id UUID REFERENCES auth.users,
  video_id TEXT NOT NULL,
  title TEXT,
  watched_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, video_id)
);

-- Create configs table (for site settings)
CREATE TABLE configs (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (CRITICAL!)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_later ENABLE ROW LEVEL SECURITY;
ALTER TABLE views ENABLE ROW LEVEL SECURITY;
ALTER TABLE configs ENABLE ROW LEVEL SECURITY;
```

**IMPORTANT**: Set up RLS policies as described in [SECURITY.md](./SECURITY.md) to secure your database.

### 4. Local Development

```bash
# Install Vercel CLI
npm i -g vercel

# Run development server
vercel dev
```

Visit `http://localhost:3000`

### 5. Deploy to Vercel

```bash
# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

**Don't forget**: Set environment variables in Vercel dashboard before deploying!

## Project Structure

```
gojoMOVIES/
├── api/
│   ├── catalog.js      # YouTube API integration
│   ├── config.js       # Serves Supabase config to frontend
│   └── ping.js         # Health check endpoint
├── index.html          # Main page
├── player.html         # Video player page
├── admin.html          # Admin dashboard
├── style.css           # Player styles
├── .env.example        # Environment variables template
├── .gitignore          # Git ignore rules
├── SECURITY.md         # Security guide
└── README.md           # This file
```

## API Endpoints

### `/api/catalog`
Fetches and categorizes Ethiopian/Amharic movies from YouTube.

**Query Parameters:**
- `queries` - Comma-separated search queries
- `min` - Minimum video duration in seconds (default: 900)
- `pages` - Number of search result pages (default: 3, max: 5)
- `max` - Max videos per category (default: 100)
- `debug=1` - Enable debug output

**Example:**
```
/api/catalog?queries=Amharic%20movie%202024&min=600&pages=2
```

### `/api/config`
Returns Supabase configuration for frontend initialization.

**Response:**
```json
{
  "supabaseUrl": "https://your-project.supabase.co",
  "supabaseAnonKey": "your-anon-key"
}
```

### `/api/ping`
Health check endpoint.

## Security

This project implements several security measures:

- ✅ Environment variables for sensitive data
- ✅ Row Level Security (RLS) on all database tables
- ✅ Supabase Auth for user authentication
- ✅ Admin role verification for protected routes
- ✅ CORS configuration
- ✅ Input validation and sanitization

**Read [SECURITY.md](./SECURITY.md) for detailed security setup and best practices.**

## Admin Access

To make a user an admin:

1. Go to Supabase Dashboard → Table Editor → `profiles`
2. Find the user's row
3. Change `role` from `user` to `admin`
4. User can now access `/admin.html`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues and questions:
- Open an issue on GitHub
- Check [SECURITY.md](./SECURITY.md) for security-related questions

## Acknowledgments

- Ethiopian film industry for the amazing content
- Supabase for the backend infrastructure
- YouTube for video hosting
- Vercel for serverless deployment

---

Made with ❤️ for Ethiopian cinema
