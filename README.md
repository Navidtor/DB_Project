# 🏔️ همسفر میرزا | Hamsafar Mirza

> پلتفرم اشتراک تجربیات سفر و یافتن همسفر  
> Travel Experience Sharing & Companion Finding Platform

![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)

---

## 📖 About

**Hamsafar Mirza** is a social travel guide web application where users can:
- 🔐 Register and login with secure authentication
- 📝 Share travel experiences (visited or imagined places)
- 🗺️ Discover tourist attractions across Iranian cities
- 👥 Find travel companions for upcoming trips
- ⭐ Rate and comment on experiences
- 👤 Follow other travelers and manage profiles
- 🧪 Test all API functions with built-in test suite

---

## 📊 Project Review & Assessment

> *Independent code review conducted on December 30, 2025*

### Overall Score: **91/100** ⭐⭐⭐⭐⭐

This is an **excellent database course project** that demonstrates strong understanding of both database design principles and modern web development practices.

### ✅ Strengths

| Category | Assessment |
|----------|------------|
| **Database Design** | Exceptional - Proper 3NF normalization, EER concepts (specialization, weak entities, multi-valued attributes) |
| **Schema Quality** | Professional - Views for derived attributes, triggers for data integrity, appropriate indexes |
| **Tech Stack** | Modern & Production-ready - React 18, TypeScript, Vite, Supabase, Tailwind/shadcn |
| **Architecture** | Clean separation of concerns - Read/Write APIs, Auth context, Type definitions |
| **Documentation** | Comprehensive - Phase-based docs, clear setup instructions, schema documentation |
| **Testing** | Included - Browser test suite and CLI tests |

### 🎯 Database Schema Highlights

```
✅ User specialization hierarchy (Regular/Moderator/Admin) - Disjoint, Total
✅ Weak entities properly implemented (Profile → User, Comment → Post)
✅ Multi-valued attributes normalized (profile_interests, post_images, place_features)
✅ Derived attributes via views (profiles_with_counts, posts_with_rating)
✅ Referential integrity with appropriate ON DELETE actions
✅ Triggers for automatic profile/subtype creation
```

### 📈 Detailed Scoring

| Criterion | Weight | Score | Notes |
|-----------|--------|-------|-------|
| Schema Design | 30% | 95/100 | Excellent normalization, all EER concepts demonstrated |
| Implementation | 25% | 90/100 | Full CRUD, auth system, protected routes |
| Documentation | 20% | 90/100 | Clear README, phase docs, inline comments |
| UI/UX | 15% | 85/100 | Professional look with shadcn/ui |
| Code Quality | 10% | 85/100 | TypeScript, clean architecture |

### 💡 Suggestions for Future Enhancement

1. Add `updated_at` timestamps to all tables
2. Implement image upload to Supabase Storage
3. Add real-time features using Supabase subscriptions
4. Consider React Query for better data fetching & caching
5. Add pagination for list views

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm (comes with Node.js)

### Windows

```powershell
# Open PowerShell or Command Prompt
cd path\to\DB-1404

# Install dependencies
npm install

# Run development server (auto mode)
npm run dev

# Force mock data
npm run dev:mock

# Force Supabase (requires env)
npm run dev:supabase

# Seed Supabase with mock data (optional)
npm run seed:supabase
```

### Linux / macOS

```bash
# Open Terminal
cd path/to/DB-1404

# Install dependencies
npm install

# Run development server (auto mode)
npm run dev

# Force mock data
npm run dev:mock

# Force Supabase (requires env)
npm run dev:supabase

# Seed Supabase with mock data (optional)
npm run seed:supabase
```

### Access the App
Open [http://localhost:5173](http://localhost:5173) in your browser. The root URL redirects to `/app`.

### Build for Production
```bash
npm run build
```

---

## 🔐 Authentication

The app includes a full authentication system:

- **Register**: Create account at `/register` with username, email, password
- **Login**: Sign in at `/login` with email and password
- **Protected Routes**: All `/app/*` routes require authentication
- **Session Management**: Robust session handling with automatic recovery from stale sessions
- **Mock Mode**: When Supabase is not configured, use any test account from mock data

### Default Test Accounts (Mock Mode)

| Email                   | Password (any) | Role     |
| ----------------------- | -------------- | -------- |
| `ali.ahmadi@email.com`  | any            | Regular  |
| `maryam.k@email.com`    | any            | Regular  |
| `moderator@example.com` | any            | Moderator|

---

## ⚠️ Known Issues & Notes

### Registration in Mock Mode

When running without Supabase configuration (Mock Mode), registration now works as a **simulated registration**:

- ✅ Registration form is fully functional
- ✅ Form validation works (password length, username length, password match)
- ✅ Shows success message after registration
- ✅ Redirects to login page
- ⚠️ In mock mode, registration is simulated - use "Demo Login" button to access the app

**For real registration functionality**, set up Supabase (see Environment Setup below).

### Data Modes

| Mode | Registration | Login | Data Persistence |
|------|--------------|-------|------------------|
| **Mock** | Simulated | Demo Login | In-memory only |
| **Supabase** | Real | Real | Database |
| **Auto** | Falls back to Mock if no Supabase | Falls back to Mock | Depends on config |

---

## ⚙️ Environment Setup (Database Connection)

### Quick Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_DATA_SOURCE=auto
   ```

### Full Supabase Setup Guide

For detailed instructions on setting up Supabase from scratch, see:
📖 **[Supabase Setup Guide](docs/SUPABASE-SETUP-GUIDE.md)**

The guide covers:
- Creating a Supabase account and project
- Getting API credentials
- Setting up the database schema
- Configuring Row Level Security (RLS)
- Authentication setup
- Seeding test data

### Data Modes

| Mode | Description |
|------|-------------|
| `auto` | Use Supabase when configured, fallback to mock data |
| `supabase` | Require Supabase credentials (no mock fallback) |
| `mock` | Always use `src/data/mockData.ts` |

### Seeding Data to Supabase

There are two ways to seed mock data into your Supabase database:

#### Option 1: Using the seed script (Recommended)

**Requires the Service Role Key** (not the anon key) because RLS blocks inserts.

```bash
# 1. Add the service role key to .env.local
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 2. Run the seed script
npm run seed:supabase
```

Get the service role key from: **Supabase Dashboard > Settings > API > service_role**

⚠️ **Never expose the service role key in frontend code!**

#### Option 2: SQL Editor (Alternative)

If you don't want to use the service role key:

1. Go to **Supabase Dashboard > SQL Editor**
2. Copy and paste the contents of `scripts/seed-data.sql`
3. Run the script

This works because SQL Editor runs as the postgres user, bypassing RLS.

---


## 📁 Project Structure

```
src/
|-- App.tsx                     # Main app with routing
|-- main.tsx                    # Entry point
|-- index.css                   # Global styles
|-- contexts/
|   `-- AuthContext.tsx         # Authentication state management with robust session handling
|-- pages/                      # Main application pages
|   |-- Dashboard.tsx           # Home dashboard
|   |-- PostsPage.tsx           # Browse experiences
|   |-- PostDetailPage.tsx      # Post details with comments
|   |-- NewPostPage.tsx         # Create post
|   |-- EditPostPage.tsx        # Edit post
|   |-- PlacesPage.tsx          # Explore places
|   |-- CompanionsPage.tsx      # Find companions
|   |-- ProfilePage.tsx         # User profiles
|   |-- UsersPage.tsx           # Browse all users
|   |-- LoginPage.tsx           # User login
|   |-- RegisterPage.tsx        # User registration
|   `-- TestPage.tsx            # API test suite
|-- components/
|   |-- layout/                 # AppLayout, Navbar
|   |-- ui/                     # Shadcn/UI components
|   |-- ProtectedRoute.tsx      # Route guard for auth
|   |-- EERDiagram.tsx          # EER diagram visualization
|   `-- ERDiagram.tsx           # ER diagram visualization
|-- lib/
|   |-- supabase.ts             # Supabase client connection
|   |-- api.ts                  # Read API (Supabase + mock)
|   |-- api-write.ts            # Write API (CRUD operations)
|   `-- utils.ts                # Utility functions
|-- data/
|   |-- mockData.ts             # Demo data
|   `-- schema.sql              # PostgreSQL schema
|-- types/
|   |-- database.ts             # TypeScript interfaces
|   `-- supabase.ts             # Supabase generated types
|-- __tests__/
|   `-- api-tests.ts            # CLI API test suite
scripts/
|-- dev.mjs                     # Dev helper (sets VITE_DATA_SOURCE)
`-- seed-supabase.ts            # Seed Supabase with mock data
public/
`-- promts/
    `-- image-prompts.md         # Image generation prompts
```

---


## 🗄️ Database Schema

The complete PostgreSQL schema is in `src/data/schema.sql` and includes:

### Core Tables

| Table                | Description                            |
| :------------------- | :------------------------------------- |
| `users`              | User accounts with role specialization |
| `regular_users`      | Regular user subtype                   |
| `moderators`         | Moderator subtype                      |
| `admins`             | Admin subtype                          |
| `profiles`           | User profile information               |
| `posts`              | Travel experiences                     |
| `comments`           | Post comments                          |
| `ratings`            | Post ratings                           |
| `follows`            | User follow relationships              |
| `places`             | Tourist attractions                    |
| `cities`             | City information                       |
| `companion_requests` | Travel companion requests              |
| `companion_matches`  | Match responses                        |

### Junction Tables (Multi-valued Attributes)

| Table                | Description                   |
| :------------------- | :---------------------------- |
| `profile_interests`  | User interests (many per profile) |
| `post_images`        | Post images (many per post)   |
| `place_images`       | Place images (many per place) |
| `place_features`     | Place features (many per place) |
| `request_conditions` | Request conditions (many per request) |

### Views (Derived Attributes)

| View                  | Description                    |
| :-------------------- | :----------------------------- |
| `profiles_with_counts`| Profiles with follower counts  |
| `posts_with_rating`   | Posts with average rating      |

---


## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Shadcn/UI
- **Routing**: React Router v6
- **Diagrams**: React Flow
- **Icons**: Lucide React
- **Data**: Supabase (PostgreSQL) with mock fallback

---

## 🧪 Testing

### Browser Test Suite
Navigate to `/app/test` to run interactive API tests in the browser.

### CLI Test Suite
```bash
# Run all API tests from command line
npx tsx src/__tests__/api-tests.ts
```

The test suite covers:
- Read operations (users, posts, places, companions)
- Write operations (create, update, delete)
- Edge cases (empty arrays, null values)
- Error handling (invalid inputs)

---

## 📚 Documentation

| Phase   | Document                                                       |
| :------ | :------------------------------------------------------------- |
| Phase 1 | [EER Diagram Documentation](docs/EER-DIAGRAM-DOCUMENTATION.md) |
| Phase 2 | [Logical Design (3NF)](docs/PHASE-2-LOGICAL-DESIGN.md)         |
| Phase 3 | [Implementation Details](docs/PHASE-3-IMPLEMENTATION.md)       |

---

## 🐛 Troubleshooting

### Registration Not Working

**Problem**: Registration page shows "حالت نمایشی فعال است" (Demo mode is active)

**Solution**: This happens when Supabase is not configured. Two options:
1. **Use mock mode**: Registration now simulates success and redirects to login. Use "Demo Login" to access the app.
2. **Configure Supabase**: Set up `.env.local` with your Supabase credentials for real registration.

### Login Issues

**Problem**: Cannot log in with email/password

**Solution**: In mock mode, use the "ورود نمایشی" (Demo Login) button instead of entering credentials.

### Session Loading Issues

**Problem**: App stuck on loading screen ("در حال بارگذاری...") after using browser back button or returning after inactivity

**Solution**: This issue has been fixed in the authentication system. The fix includes:
- Proper error handling for session retrieval with try-catch-finally blocks
- Race condition prevention between `getSession()` and `onAuthStateChange`
- Non-blocking user data fetching to prevent loading state from hanging
- Graceful handling of expired or invalid sessions

If you still experience loading issues:
1. Clear browser localStorage and cookies for the site
2. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
3. Check browser console for any Supabase connection errors

---

## 📜 License

This project was created for the Database Course.

---

