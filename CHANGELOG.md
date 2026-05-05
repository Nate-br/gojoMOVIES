# Changelog

All notable changes to gojoMOVIES will be documented in this file.

## [1.4.0] - 2026-05-05

### Added
- **Error Logging System** (`error-logger.js`):
  - Global error handling for JavaScript errors, promise rejections, and resource failures
  - Session tracking with unique IDs
  - localStorage persistence for debugging
  - Performance monitoring (page load, DOM ready, first contentful paint)
  - API error logging with endpoint tracking
  - Export logs as JSON functionality
- **Asset Optimization** (`asset-optimizer.js`):
  - Lazy loading with Intersection Observer API
  - Automatic image error handling with YouTube thumbnail fallbacks
  - Responsive thumbnail selection based on viewport size
  - Resource hints (preconnect, dns-prefetch) for external domains
  - Performance monitoring for slow-loading resources
  - Image caching to prevent duplicate loads
- **MONITORING.md** documentation with usage examples and integration guides

### Improved
- Page load performance with lazy loading and resource hints
- Error tracking and debugging capabilities
- Image loading reliability with automatic fallbacks
- Development and production monitoring

## [1.3.0] - 2026-05-05

### Changed
- Reorganized project structure with dedicated folders:
  - `js/` - All JavaScript files
  - `pages/` - All HTML pages
  - `css/` - All stylesheets (already modular)
  - `api/` - Serverless functions
- Updated all file path references in HTML files
- Created root index.html redirect for seamless navigation

### Improved
- Better project organization and file discoverability
- Clearer separation of concerns (pages, scripts, styles, API)
- Easier maintenance and scalability

## [1.2.0] - 2026-05-05

### Added
- Modular CSS architecture with 5 separate files for better maintainability

### Changed
- Refactored monolithic style.css into focused modules:
  - base.css: CSS variables and base styles
  - player.css: Player layout and overlays
  - controls.css: Player controls and UI elements
  - suggested-movies.css: Movie cards and grid layout
  - responsive.css: Media queries for all breakpoints
- Updated player.html to import modular CSS files

### Removed
- Monolithic style.css file (replaced with modular structure)

## [1.1.0] - 2024-05-05

### Changed
- Converted repository to view-only showcase format
- Updated README to remove setup instructions
- Removed YouTube references from documentation
- Updated SECURITY.md to focus on architecture documentation
- Removed Contributing section from documentation

### Removed
- Setup and deployment instructions from all documentation
- .env.example template file
- Contributing guidelines

### Security
- Updated security documentation to reflect completed improvements
- Documented Row Level Security implementation
- Documented authentication architecture

## [1.0.0] - 2024-05-05

### Added
- Restrictive "All Rights Reserved" license
- Professional README structure
- Comprehensive security documentation

### Changed
- Refactored JavaScript from HTML files into separate modules
- Extracted app.js from index.html
- Extracted player.js from player.html
- Extracted admin.js from admin.html

### Fixed
- Authentication race condition
- Security vulnerability with hardcoded credentials

### Security
- Migrated to environment variable-based credential management
- Implemented Row Level Security on all database tables
- Added proper authentication guards
