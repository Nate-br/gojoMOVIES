# Security Documentation

This document outlines the security measures implemented in gojoMOVIES.

## Security Overview

gojoMOVIES implements multiple layers of security to protect user data and ensure safe operation:

- Environment-based credential management
- Row Level Security (RLS) on all database tables
- Supabase Auth for user authentication
- Role-based access control for administrative functions
- CORS configuration
- Input validation and sanitization

## Database Security

### Row Level Security (RLS)

All database tables have Row Level Security enabled to ensure users can only access their own data.

#### RLS Implementation

**Profiles Table:**
```sql
-- Users can read all profiles
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

**Likes Table:**
```sql
-- Users can view their own likes
CREATE POLICY "Users can view own likes"
ON likes FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own likes
CREATE POLICY "Users can insert own likes"
ON likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete own likes"
ON likes FOR DELETE
USING (auth.uid() = user_id);
```

**Watch Later Table:**
```sql
-- Users can view their own watch later list
CREATE POLICY "Users can view own watch later"
ON watch_later FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert to their own watch later
CREATE POLICY "Users can insert own watch later"
ON watch_later FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete from their own watch later
CREATE POLICY "Users can delete own watch later"
ON watch_later FOR DELETE
USING (auth.uid() = user_id);
```

**Views Table:**
```sql
-- Users can view their own viewing history
CREATE POLICY "Users can view own views"
ON views FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own views
CREATE POLICY "Users can upsert own views"
ON views FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own views
CREATE POLICY "Users can update own views"
ON views FOR UPDATE
USING (auth.uid() = user_id);
```

**Configs Table (Admin Only):**
```sql
-- Everyone can read configs
CREATE POLICY "Configs are viewable by everyone"
ON configs FOR SELECT
USING (true);

-- Only admins can modify configs
CREATE POLICY "Only admins can modify configs"
ON configs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

## Authentication

### User Authentication

- Supabase Auth handles user registration and login
- Email/password authentication is enabled
- Session management is handled automatically

### Admin Access Control

Administrative functions are protected by role-based access control:

- Admin role is stored in the `profiles` table
- Admin routes verify user role before granting access
- Database policies enforce admin-only operations

## Security Architecture

### Credential Management

- All sensitive credentials are stored as environment variables
- Credentials are never committed to version control
- Environment variables are loaded at runtime via serverless functions

### Data Protection

**Public Information:**
- Supabase URL (public endpoint)
- Supabase Anon Key (public, protected by RLS policies)

**Protected Information:**
- Supabase Service Role Key (server-side only)
- API keys (environment variables only)
- User passwords (hashed by Supabase Auth)

### Additional Security Measures

1. **Email Confirmation** - Prevents spam account creation
2. **Rate Limiting** - Protects API endpoints from abuse
3. **Database Monitoring** - Tracks suspicious activity patterns
4. **HTTPS Enforcement** - All traffic encrypted via Vercel
5. **Input Validation** - Sanitizes user input to prevent injection attacks

## Resources

- [Supabase Row Level Security Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Top 10 Security Risks](https://owasp.org/www-project-top-ten/)
