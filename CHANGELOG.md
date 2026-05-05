# Changelog

All notable changes to gojoMOVIES will be documented in this file.

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
