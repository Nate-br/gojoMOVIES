# Security Guide for gojoMOVIES

## ⚠️ CRITICAL: Exposed Credentials

Your Supabase credentials were previously hardcoded in HTML files and committed to GitHub. **These credentials are now public and must be rotated immediately.**

## 🔄 Step 1: Rotate Supabase Keys (URGENT)

### Why This Is Critical
- Your Supabase URL and anon key were exposed in Git history
- Anyone with access to your GitHub repository can access your database
- Even though the code has been updated, the old keys are still in Git history

### How to Rotate Keys

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com/project/fuidgrbtqnjphhyiouxn/settings/api

2. **Generate New Anon Key**
   - Navigate to: Settings → API → Project API keys
   - Click "Reset" on the `anon` key
   - Copy the new key immediately

3. **Update Your Environment Variables**
   - Create a `.env` file in your project root (already in .gitignore)
   - Add your new credentials:
   ```bash
   SUPABASE_URL=https://fuidgrbtqnjphhyiouxn.supabase.co
   SUPABASE_ANON_KEY=your-new-anon-key-here
   YT_API_KEY=your-youtube-api-key
   ```

4. **Update Vercel Environment Variables**
   - Go to: https://vercel.com/your-project/settings/environment-variables
   - Add/update:
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - `YT_API_KEY`
   - Redeploy your application

## 🔒 Step 2: Secure Your Supabase Database

### Enable Row Level Security (RLS)

Your database tables MUST have RLS enabled to prevent unauthorized access:

1. **Go to Supabase Dashboard → Authentication → Policies**

2. **Enable RLS on all tables:**
   ```sql
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
   ALTER TABLE watch_later ENABLE ROW LEVEL SECURITY;
   ALTER TABLE views ENABLE ROW LEVEL SECURITY;
   ALTER TABLE configs ENABLE ROW LEVEL SECURITY;
   ```

3. **Create Security Policies:**

   **For `profiles` table:**
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

   **For `likes` table:**
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

   **For `watch_later` table:**
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

   **For `views` table:**
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

   **For `configs` table (admin only):**
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

## 🚀 Step 3: Deploy Securely

### Local Development

1. **Create `.env` file** (never commit this):
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

2. **Install Vercel CLI** (if testing locally):
   ```bash
   npm i -g vercel
   vercel dev
   ```

### Production Deployment

1. **Set environment variables in Vercel:**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.example`
   - Deploy: `vercel --prod`

2. **Verify the deployment:**
   - Test that `/api/config` returns your credentials
   - Test authentication flow
   - Verify RLS policies are working

## 🛡️ Security Best Practices

### What's Safe to Expose
- ✅ Supabase URL (public)
- ✅ Supabase Anon Key (public, but ONLY with RLS enabled)

### What Must Stay Secret
- ❌ Supabase Service Role Key (never expose client-side)
- ❌ YouTube API Key (keep in environment variables)
- ❌ Any private keys or secrets

### Additional Recommendations

1. **Enable Email Confirmation**
   - Supabase Dashboard → Authentication → Settings
   - Enable "Confirm email" to prevent spam accounts

2. **Set Up Rate Limiting**
   - Consider adding rate limiting to your API endpoints
   - Use Vercel's Edge Config or Upstash Redis

3. **Monitor Your Database**
   - Regularly check Supabase logs for suspicious activity
   - Set up alerts for unusual patterns

4. **Regular Security Audits**
   - Review RLS policies quarterly
   - Check for exposed credentials in code
   - Update dependencies regularly

## 📋 Checklist

Before going live, ensure:

- [ ] Supabase anon key has been rotated
- [ ] All environment variables are set in Vercel
- [ ] RLS is enabled on all tables
- [ ] RLS policies are tested and working
- [ ] `.env` file is in `.gitignore`
- [ ] No credentials in Git history (or history is cleaned)
- [ ] Email confirmation is enabled
- [ ] Admin access is properly restricted
- [ ] API endpoints have rate limiting
- [ ] HTTPS is enforced (Vercel does this by default)

## 🆘 If Your Database Was Compromised

If you suspect unauthorized access:

1. **Immediately rotate all keys** in Supabase dashboard
2. **Check database logs** for suspicious queries
3. **Review all user accounts** for unauthorized admins
4. **Audit all data** for unauthorized modifications
5. **Consider resetting user passwords** if needed
6. **Enable 2FA** on your Supabase account

## 📚 Additional Resources

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
