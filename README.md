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
└── .gitignore          # Git ignore configuration
```

## License

Copyright © 2026. All Rights Reserved.

This code is made available for **viewing and reference purposes only**. You may not use, modify, distribute, or create derivative works from this code without explicit permission. See the [LICENSE](LICENSE) file for complete terms.

## Acknowledgments

Built for the Ethiopian cinema community using modern web technologies and cloud infrastructure.
