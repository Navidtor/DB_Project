# 🚀 Supabase Account Setup Guide

> Complete guide for setting up Supabase backend for the Hamsafar Mirza project

---

## 📋 Table of Contents

1. [Create Supabase Account and Project](#1-create-supabase-account-and-project)
2. [Get Project Credentials](#2-get-project-credentials)
3. [Configure Environment Variables](#3-configure-environment-variables)
4. [Set Up Database Schema](#4-set-up-database-schema)
5. [Configure Authentication](#5-configure-authentication)
6. [Seed Test Data](#6-seed-test-data)
7. [Verify Configuration](#7-verify-configuration)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Create Supabase Account and Project

### Step 1.1: Sign Up

1. Go to [https://supabase.com](https://supabase.com)
2. Click **Start your project** or **Sign Up**
3. Sign up using one of:
   - GitHub account (recommended)
   - Email address

### Step 1.2: Create a New Project

1. After logging in, click **New Project**
2. Select your organization (or create a new free organization)
3. Fill in project details:

| Field | Suggested Value | Notes |
|-------|-----------------|-------|
| **Name** | `hamsafar-mirza` | Your project name |
| **Database Password** | Strong password | ⚠️ Save this password! |
| **Region** | Nearest to you | e.g., Singapore, Frankfurt |
| **Pricing Plan** | Free | Free tier is sufficient for development |

4. Click **Create new project**
5. Wait for project initialization (~1-2 minutes)

---

## 2. Get Project Credentials

After your project is created, get the API credentials:

### Step 2.1: Navigate to API Settings

1. In the Supabase Dashboard
2. Click **Settings** ⚙️ in the left sidebar
3. Click **API**

### Step 2.2: Copy Credentials

You'll need to copy the following:

| Credential | Location | Purpose |
|------------|----------|---------|
| **Project URL** | API Settings > Project URL | Frontend connection |
| **anon public** | API Settings > Project API keys | Frontend authentication |
| **service_role** | API Settings > Project API keys | Seed script (optional) |

Example values:
```
Project URL:    https://abcdefghijkl.supabase.co
anon key:       eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role:   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (keep secret!)
```

> ⚠️ **Security Warning**: The `service_role` key has full database access. NEVER expose it in frontend code or public repositories!

---

## 3. Configure Environment Variables

### Step 3.1: Create Environment File

In the project root directory, create `.env.local`:

```bash
# Run in project root
cp .env.example .env.local
```

### Step 3.2: Add Your Credentials

Edit `.env.local` and fill in your credentials:

```env
# ==============================================
# Supabase Configuration - Hamsafar Mirza
# ==============================================

# Supabase Project URL (get from Settings > API)
VITE_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase Anonymous Key (get from Settings > API)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (for seed script only)
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Data Source Mode
VITE_DATA_SOURCE=auto
```

### Data Source Modes

| Mode | Description |
|------|-------------|
| `auto` | Use Supabase if configured, fallback to mock data |
| `supabase` | Force Supabase (requires credentials) |
| `mock` | Always use mock data |

---

## 4. Set Up Database Schema

### Step 4.1: Open SQL Editor

1. In the Supabase Dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New query**

### Step 4.2: Execute Schema Script

Copy the entire contents of `scripts/supabase-setup.sql` into the SQL Editor, then click **Run**.

The script includes:
- All table definitions
- Views for derived attributes
- Triggers for automatic profile/subtype creation
- Indexes for performance
- Row Level Security (RLS) policies

### Step 4.3: Verify Tables Created

After running the script, go to **Table Editor** in the sidebar. You should see:

- `users`
- `profiles`
- `posts`
- `comments`
- `ratings`
- `follows`
- `cities`
- `places`
- `companion_requests`
- `companion_matches`
- And junction tables...

---

## 5. Configure Authentication

### Step 5.1: Access Auth Settings

1. In the Supabase Dashboard
2. Click **Authentication** in the left sidebar
3. Click **Providers**

### Step 5.2: Enable Email Authentication

1. Ensure **Email** provider is enabled
2. Configure options:

| Setting | Recommended Value |
|---------|-------------------|
| Enable Email Signup | ✅ Enabled |
| Confirm email | Off for development, On for production |
| Secure email change | ✅ Enabled |
| Secure password change | ✅ Enabled |

### Step 5.3: Configure URLs

In **URL Configuration**:

| Setting | Development Value |
|---------|-------------------|
| Site URL | `http://localhost:5173` |
| Redirect URLs | `http://localhost:5173/**` |

### Step 5.4 (Optional): Disable Email Confirmation

For easier development testing:

1. Go to **Authentication** > **Providers** > **Email**
2. Toggle off **Confirm email**

---

## 6. Seed Test Data

### Method 1: Using Seed Script (Recommended)

First, add the service role key to your `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Then run:

```bash
npm run seed:supabase
```

### Method 2: Manually Add Data

In SQL Editor, execute sample data:

```sql
-- Insert sample cities
INSERT INTO cities (city_id, name, description, province, country) VALUES
    (uuid_generate_v4(), 'Isfahan', 'Half of the World, city of art and architecture', 'Isfahan', 'Iran'),
    (uuid_generate_v4(), 'Shiraz', 'City of poetry and flowers, birthplace of Hafez', 'Fars', 'Iran'),
    (uuid_generate_v4(), 'Yazd', 'City of windcatchers, first adobe city in the world', 'Yazd', 'Iran');
```

---

## 7. Verify Configuration

### Step 7.1: Start Development Server

```bash
npm run dev:supabase
```

### Step 7.2: Check Console Output

Open browser developer tools and check for connection messages.

Successful connection shows:
```
Data source mode: supabase
Supabase client initialized
```

### Step 7.3: Test Registration and Login

1. Navigate to `http://localhost:5173/register`
2. Create a new account
3. Test login functionality

### Step 7.4: Run API Tests

```bash
# Run CLI tests
npx tsx src/__tests__/api-tests.ts
```

Or visit `/app/test` page in the browser for interactive testing.

---

## 8. Troubleshooting

### Q: Getting "Invalid API key" error

**Solutions**:
1. Check `VITE_SUPABASE_ANON_KEY` in `.env.local` is correct
2. Ensure no extra spaces or line breaks
3. Restart the development server

### Q: Getting "User already registered" error on signup

**Solutions**:
1. That email is already in use, try a different one
2. Or delete the user in Supabase Dashboard > Authentication > Users

### Q: RLS policies blocking data access

**Solutions**:
1. Verify RLS policies are correctly configured
2. Temporarily disable RLS for testing:
   ```sql
   ALTER TABLE users DISABLE ROW LEVEL SECURITY;
   ```
3. Test with service_role key (bypasses RLS)

### Q: Seed script failing

**Solutions**:
1. Ensure you're using `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
2. Check that database tables exist
3. Review specific error messages

### Q: Views not accessible

**Solutions**:
Grant view access to the anon role:

```sql
GRANT SELECT ON profiles_with_counts TO anon;
GRANT SELECT ON posts_with_rating TO anon;
```

### Q: Connection timeout errors

**Solutions**:
1. Check your internet connection
2. Verify the Supabase project is running (check Dashboard)
3. Try a different region if consistently slow

---

## 📚 Additional Resources

- [Supabase Official Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Authentication Guide](https://supabase.com/docs/guides/auth)

---

## 🎉 Setup Complete!

Congratulations! You've successfully configured Supabase. Start your project with:

```bash
# Use Supabase mode
npm run dev:supabase

# Or auto mode (recommended)
npm run dev
```

If you encounter issues, refer to the [Troubleshooting](#8-troubleshooting) section or consult the Supabase documentation.
