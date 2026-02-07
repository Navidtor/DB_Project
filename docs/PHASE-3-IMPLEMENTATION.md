# 📄 Phase 3: Practical Implementation (پیاده‌سازی عملی)

## 1. Project Overview

This document describes the practical implementation of the **Hamsafar Mirza** (همسفر میرزا) travel companion platform. The implementation follows the logical design from Phase 2 and transforms it into a working React application with full authentication, CRUD operations, and comprehensive testing.

---

## 2. Technology Stack

| Technology       | Purpose                          |
| ---------------- | -------------------------------- |
| **React 18**     | Frontend framework               |
| **TypeScript**   | Type-safe JavaScript             |
| **Vite**         | Build tool and dev server        |
| **Tailwind CSS** | Utility-first CSS framework      |
| **Shadcn/UI**    | UI component library             |
| **React Router** | Client-side routing              |
| **React Flow**   | EER/ER diagram visualization     |
| **Supabase JS**  | Postgres client + auth APIs      |
| **Lucide React** | Icon library                     |

---

## 3. Project Structure

```
src/
|-- App.tsx                     # Main app with routing
|-- main.tsx                    # Entry point
|-- index.css                   # Global styles
|-- components/
|   |-- layout/
|   |   |-- AppLayout.tsx       # Main app layout with header/footer
|   |   `-- Navbar.tsx          # Navigation bar with user menu
|   |-- ui/                     # Shadcn/UI components
|   |   |-- button.tsx
|   |   |-- card.tsx
|   |   |-- dialog.tsx
|   |   `-- ...
|   |-- ProtectedRoute.tsx      # Route guard for authentication
|   |-- home.tsx                # Legacy landing page (not routed)
|   |-- EERDiagram.tsx          # Phase 1 visualization
|   `-- ERDiagram.tsx           # ER diagram visualization
|-- contexts/
|   `-- AuthContext.tsx         # Authentication state management with robust session handling
|-- pages/
|   |-- Dashboard.tsx           # Main dashboard with stats
|   |-- PostsPage.tsx           # Posts listing (grid/list view)
|   |-- PostDetailPage.tsx      # Single post view with comments
|   |-- NewPostPage.tsx         # Create new post
|   |-- EditPostPage.tsx        # Edit existing post
|   |-- PlacesPage.tsx          # Places/cities browser
|   |-- CompanionsPage.tsx      # Companion finder with matching
|   |-- ProfilePage.tsx         # User profiles with follow system
|   |-- UsersPage.tsx           # Browse and search users
|   |-- LoginPage.tsx           # User login
|   |-- RegisterPage.tsx        # User registration
|   `-- TestPage.tsx            # API test suite
|-- types/
|   |-- database.ts             # TypeScript types matching schema
|   `-- supabase.ts             # Supabase types (when connected)
|-- data/
|   |-- mockData.ts             # Mock data for demo
|   `-- schema.sql              # Complete SQL schema
|-- lib/
|   |-- api.ts                  # Read operations (Supabase + mock)
|   |-- api-write.ts            # Write operations (CRUD)
|   |-- supabase.ts             # Supabase client + data source mode
|   `-- utils.ts                # Utility functions
`-- __tests__/
    `-- api-tests.ts            # Command-line API test suite

scripts/
|-- dev.mjs                     # Dev helper (sets VITE_DATA_SOURCE)
`-- seed-supabase.ts            # Seed Supabase with mock data
```

---

## 4. Database Schema Implementation

The SQL schema (`src/data/schema.sql`) implements all entities from the logical design:

### 4.1 Tables Created

| Table                | Description                        | Type           |
| -------------------- | ---------------------------------- | -------------- |
| `users`              | Main user table with discriminator | Strong Entity  |
| `regular_users`      | Regular user subtype               | Subtype        |
| `moderators`         | Moderator subtype                  | Subtype        |
| `admins`             | Admin subtype                      | Subtype        |
| `profiles`           | User profiles                      | Weak Entity    |
| `profile_interests`  | Multi-valued attribute             | Junction Table |
| `follows`            | User follows relationship          | M:N Junction   |
| `cities`             | City information                   | Strong Entity  |
| `places`             | Tourist places                     | Strong Entity  |
| `place_features`     | Multi-valued attribute             | Junction Table |
| `place_images`       | Multi-valued attribute             | Junction Table |
| `posts`              | Travel experiences                 | Strong Entity  |
| `post_images`        | Multi-valued attribute             | Junction Table |
| `comments`           | Post comments                      | Weak Entity    |
| `ratings`            | Post ratings                       | M:N Junction   |
| `companion_requests` | Travel companion requests          | Strong Entity  |
| `request_conditions` | Multi-valued attribute             | Junction Table |
| `companion_matches`  | Match responses                    | Strong Entity  |

### 4.2 Views (Derived Attributes)

- `profiles_with_counts`: Includes followers_count and following_count
- `posts_with_rating`: Includes avg_rating and rating_count

### 4.3 Triggers

- Auto-create profile when user is created
- Auto-create subtype record based on user_type

---

## 5. TypeScript Types

The types in `src/types/database.ts` mirror the database schema:

```typescript
// User Types
type UserType = 'regular' | 'moderator' | 'admin';

interface User {
  user_id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  password_hash: string;
  profile_image?: string;
  created_at: string;
  user_type: UserType;
}

// And many more...
```

---

## 6. Application Features

### 6.1 Authentication System
- **Login Page**: Email/password authentication with Supabase Auth
- **Registration Page**: User signup with validation (username, email, password)
- **Protected Routes**: Route guards redirect unauthenticated users to login
- **Mock Mode**: Demo login available when Supabase is not configured
- **Session Management**: Robust session handling with:
  - Async/await with try-catch-finally for reliable error handling
  - Race condition prevention between `getSession()` and `onAuthStateChange`
  - Non-blocking user data fetching (loading state never hangs)
  - Graceful recovery from expired or invalid sessions
  - Automatic token refresh via Supabase Auth

### 6.2 User Management
- **User Profiles**: View/edit profiles with bio, cover image, and interests
- **Role-based Access**: Regular, Moderator, Admin with distinct attributes
- **Follow/Unfollow System**: Social connections with follower counts
- **User Directory**: Browse and search all users with filters

### 6.3 Content System
- **Create Posts**: Travel experiences (visited/imagined) with image galleries
- **Edit Posts**: Full CRUD operations for post owners
- **Comments**: Add/delete comments on posts
- **Ratings**: 5-star rating system with average calculation
- **Content Approval**: Pending/approved/rejected workflow

### 6.4 Location System
- **Browse Cities**: Filter by city with post counts
- **Browse Places**: Attractions with features and images
- **Location Features**: Multi-valued attributes (parking, restaurant, etc.)
- **Map Integration**: External map links

### 6.5 Companion System
- **Create Requests**: Travel companion requests with date and conditions
- **Match Requests**: Send/receive companion match requests
- **Accept/Reject**: Request owner can accept or reject matches
- **Status Tracking**: Active, completed, or cancelled requests

### 6.6 Testing
- **Browser Test Suite**: Interactive API testing at `/app/test`
- **CLI Test Suite**: Command-line tests via `npx tsx src/__tests__/api-tests.ts`
- **Coverage**: Read operations, write operations, error handling, data validation

---

## 7. Routes

### Public Routes

| Route          | Component    | Description            |
| -------------- | ------------ | ---------------------- |
| `/login`       | LoginPage    | User login             |
| `/register`    | RegisterPage | User registration      |
| `/eer-diagram` | EERDiagram   | EER diagram            |
| `/er-diagram`  | ERDiagram    | ER diagram             |

### Protected Routes (require authentication)

| Route                        | Component      | Description              |
| ---------------------------- | -------------- | ------------------------ |
| `/`                          | -              | Redirects to `/app`      |
| `/app`                       | Dashboard      | Main dashboard           |
| `/app/posts`                 | PostsPage      | Browse experiences       |
| `/app/posts/new`             | NewPostPage    | Create experience        |
| `/app/posts/:postId`         | PostDetailPage | View experience          |
| `/app/posts/:postId/edit`    | EditPostPage   | Edit experience          |
| `/app/places`                | PlacesPage     | Browse places            |
| `/app/companions`            | CompanionsPage | Find companions          |
| `/app/companions/:requestId` | CompanionsPage | Companion request detail |
| `/app/users`                 | UsersPage      | Browse users             |
| `/app/profile/:userId`       | ProfilePage    | User profile             |
| `/app/settings`              | ProfilePage    | Settings (profile view)  |
| `/app/test`                  | TestPage       | API test suite           |

---

## 8. Running the Project

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start with mock data only
npm run dev:mock

# Start with Supabase only
npm run dev:supabase

# Seed Supabase with mock data
npm run seed:supabase

# Build for production
npm run build
```

---

## 9. Database Connection

### Supabase + Mock Data Modes
The data layer can run in three modes:

- **mock**: Always use `src/data/mockData.ts`
- **supabase**: Require Supabase credentials; errors if missing
- **auto**: Default; use Supabase if configured, otherwise fallback to mock data

Key files:
- **Client**: `src/lib/supabase.ts` (reads `VITE_DATA_SOURCE` or Vite `MODE`)
- **API Layer**: `src/lib/api.ts` (runtime switch + fallback logic)
- **Seeder**: `scripts/seed-supabase.ts` (loads mock data into Supabase)

Environment:
- `.env.local` uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- `VITE_DATA_SOURCE` can be set to `mock`, `supabase`, or `auto`

Note: The mock dataset includes `cities.image`. The seed script will insert it if the column exists; otherwise it skips the column and logs a warning.

### Frontend
- Deploy to Vercel, Netlify, or similar
- Environment variables for Supabase credentials

---

## 10. API Layer Architecture

### 10.1 Read Operations (`api.ts`)

All read operations follow a consistent pattern:
- Check `shouldUseMockData` flag
- If mock mode: return from `mockData.ts`
- If Supabase: execute query with error handling and mock fallback

```typescript
export async function getPosts(): Promise<Post[]> {
  if (shouldUseMockData) return mockData.posts;
  const client = requireSupabaseClient();
  try {
    const { data, error } = await client.from('posts_with_rating').select('*');
    if (error) return handleSupabaseError('Error', error, mockData.posts);
    return data || [];
  } catch (error) {
    return handleSupabaseError('Error', error, mockData.posts);
  }
}
```

### 10.2 Write Operations (`api-write.ts`)

All write operations return `{ data, error }` pattern:
- `createPost`, `updatePost`, `deletePost`
- `createComment`, `deleteComment`
- `createOrUpdateRating`
- `followUser`, `unfollowUser`, `isFollowing`
- `createCompanionRequest`, `updateCompanionRequestStatus`
- `createCompanionMatch`, `updateCompanionMatchStatus`
- `updateProfile`

### 10.3 Error Handling

All API functions include comprehensive error handling:
- Database errors are caught and logged
- Mock fallback is available in `auto` mode
- User-facing errors are returned, not thrown

---

## 11. Phase 3 Deliverables

✅ Frontend React application with TypeScript  
✅ Full authentication system (login, register, protected routes)  
✅ Robust session management with race condition prevention  
✅ Complete CRUD operations for all entities  
✅ TypeScript types matching database schema  
✅ SQL schema file with triggers and views  
✅ Supabase client with configurable data modes  
✅ Seed script for Supabase  
✅ Mock data for offline demonstration  
✅ Responsive UI with RTL support  
✅ Follow/unfollow social system  
✅ Rating and comment system  
✅ Companion matching system  
✅ API test suites (browser + CLI)  
✅ Comprehensive documentation  

---

## 12. Code Quality

### 12.1 Error Handling Patterns
- All async operations wrapped in try-catch
- Proper cleanup in useEffect hooks
- Memory leak prevention (setTimeout cleanup)
- Graceful degradation on errors
- Session initialization uses try-catch-finally to guarantee loading state resolution
- Auth state changes use flag-based deduplication to prevent race conditions

### 12.2 Type Safety
- No `any` types in application code
- Optional chaining for nullable properties
- Nullish coalescing for default values
- Proper type guards for runtime checks

### 12.3 Performance
- Parallel API calls with `Promise.all`
- Memoization with `useMemo` for derived data
- Efficient array lookups with `Map` structures
- Cleanup on component unmount

---

## 13. Future Enhancements

1. **Image Upload**: Use Supabase Storage for user uploads
2. **Real-time**: Live notifications via Supabase Realtime
3. **Search**: Full-text search with PostgreSQL tsvector
4. **Moderation**: Content approval workflow for moderators
5. **Analytics**: User engagement and travel statistics
6. **PWA**: Progressive Web App with offline support
7. **i18n**: Multi-language support beyond Persian

---

*This document serves as the formal deliverable for Phase 3: Practical Implementation.*
