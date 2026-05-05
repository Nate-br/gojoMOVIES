# Security Documentation

This document outlines the security measures implemented in gojoMOVIES and provides guidelines for maintaining a secure deployment.

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

#### Enable RLS on Tables

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_later ENABLE ROW LEVEL SECURITY;
ALTER TABLE views ENABLE ROW LEVEL SECURITY;
ALTER TABLE configs ENABLE ROW LEVEL SECURITY;
```

#### RLS Policies

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

## Environment Variables

Sensitive credentials are stored as environment variables and never committed to the repository.

### Required Variables

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
YT_API_KEY=your-api-key
```

### Local Development

Create a `.env` file in the project root (already in `.gitignore`):

```bash
cp .env.example .env
# Edit .env with your credentials
```

### Production Deployment

Configure environment variables in Vercel:
1. Navigate to Project Settings → Environment Variables
2. Add all required variables
3. Redeploy the application

## Authentication

### User Authentication

- Supabase Auth handles user registration and login
- Email/password authentication is enabled
- Session management is handled automatically

### Admin Access Control

Administrative functions are protected by role-based access control:

1. Admin role is stored in the `profiles` table
2. Admin routes verify user role before granting access
3. Database policies enforce admin-only operations

## Best Practices

### Credential Management

- ✅ Store all credentials in environment variables
- ✅ Never commit `.env` files to version control
- ✅ Rotate credentials periodically
- ✅ Use different credentials for development and production

### Public vs Private Keys

**Safe to Expose:**
- Supabase URL (public)
- Supabase Anon Key (public, protected by RLS)

**Must Stay Secret:**
- Supabase Service Role Key (never expose client-side)
- API keys (keep in environment variables)
- Private keys and secrets

### Additional Security Measures

1. **Enable Email Confirmation**
   - Supabase Dashboard → Authentication → Settings
   - Enable "Confirm email" to prevent spam accounts

2. **Rate Limiting**
   - Consider implementing rate limiting on API endpoints
   - Use Vercel's Edge Config or external services

3. **Database Monitoring**
   - Regularly review Supabase logs
   - Set up alerts for unusual activity patterns

4. **Regular Audits**
   - Review RLS policies periodically
   - Update dependencies regularly
   - Audit user roles and permissions

5. **HTTPS Enforcement**
   - Vercel enforces HTTPS by default
   - Ensure all external API calls use HTTPS

## Security Checklist

Before deploying to production:

- [ ] All environment variables configured in Vercel
- [ ] RLS enabled on all database tables
- [ ] RLS policies tested and verified
- [ ] `.env` file in `.gitignore`
- [ ] No credentials in source code
- [ ] Email confirmation enabled (optional)
- [ ] Admin access properly restricted
- [ ] HTTPS enforced
- [ ] Dependencies up to date

## Incident Response

If you suspect a security breach:

1. Immediately rotate all credentials in Supabase dashboard
2. Review database logs for suspicious activity
3. Audit user accounts for unauthorized access
4. Check for unauthorized data modifications
5. Enable 2FA on all administrative accounts
6. Document the incident and response actions

## Resources

- [Supabase Row Level Security Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [OWASP Top 10 Security Risks](https://owasp.org/www-project-top-ten/)
