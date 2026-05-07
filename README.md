# ጎጆ films (gojoMOVIES)

A modern Ethiopian/Amharic movie streaming platform that aggregates and organizes video content, providing users with a curated viewing experience.

## Overview

gojoMOVIES is a full-stack web application designed to showcase Ethiopian and Amharic cinema. The platform features user authentication, personalized libraries, content categorization, and an intuitive browsing experience optimized for both desktop and mobile devices.

## Built With

![Vanilla JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Serverless](https://img.shields.io/badge/Serverless-FD5750?style=for-the-badge&logo=serverless&logoColor=white)
![API](https://img.shields.io/badge/REST_API-009688?style=for-the-badge&logo=fastapi&logoColor=white)

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
- **Error logging and monitoring** for debugging and performance tracking
- **Asset optimization** with lazy loading and automatic image fallbacks

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
├── css/
│   ├── base.css        # CSS variables and base styles
│   ├── player.css      # Player layout and overlays
│   ├── controls.css    # Player controls and UI elements
│   ├── suggested-movies.css  # Movie cards and grid layout
│   └── responsive.css  # Media queries for all breakpoints
├── js/
│   ├── app.js          # Main application logic
│   ├── player.js       # Video player logic
│   ├── admin.js        # Admin dashboard logic
│   ├── error-logger.js # Error logging and monitoring
│   └── asset-optimizer.js # Asset optimization and lazy loading
├── pages/
│   ├── index.html      # Main application page
│   ├── player.html     # Video player interface
│   └── admin.html      # Administrative dashboard
├── index.html          # Root redirect to pages/index.html
└── .gitignore          # Git ignore configuration
```

## License

Copyright © 2026. All Rights Reserved.

This code is made available for **viewing and reference purposes only**. You may not use, modify, distribute, or create derivative works from this code without explicit permission. See the [LICENSE](LICENSE) file for complete terms.

## Acknowledgments

Built for the Ethiopian cinema community using modern web technologies and cloud infrastructure.
