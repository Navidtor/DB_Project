-- =============================================
-- HAMSAFAR MIRZA - Complete Supabase Setup Script
-- Execute this script in Supabase SQL Editor
-- =============================================

-- =============================================
-- PART 1: TABLE STRUCTURE
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS & SPECIALIZATION (Disjoint, Total)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    profile_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('regular', 'moderator', 'admin'))
);

-- Subtype: Regular Users
CREATE TABLE IF NOT EXISTS regular_users (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    travel_preferences JSONB DEFAULT '[]',
    experience_level VARCHAR(20) DEFAULT 'beginner' 
        CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert'))
);

-- Subtype: Moderators
CREATE TABLE IF NOT EXISTS moderators (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    assigned_regions JSONB DEFAULT '[]',
    approval_count INT DEFAULT 0
);

-- Subtype: Admins
CREATE TABLE IF NOT EXISTS admins (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    access_level INT DEFAULT 1 CHECK (access_level >= 1 AND access_level <= 5),
    last_admin_action TIMESTAMP
);

-- =============================================
-- PROFILE (Weak Entity - depends on USERS)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
    profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    bio TEXT,
    cover_image VARCHAR(255)
);

-- Multi-valued attribute: interests
CREATE TABLE IF NOT EXISTS profile_interests (
    profile_id UUID REFERENCES profiles(profile_id) ON DELETE CASCADE,
    interest VARCHAR(100) NOT NULL,
    PRIMARY KEY (profile_id, interest)
);

-- =============================================
-- SOCIAL: FOLLOWS (Recursive M:N on USERS)
-- =============================================
CREATE TABLE IF NOT EXISTS follows (
    follower_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- =============================================
-- CITIES & PLACES
-- =============================================
CREATE TABLE IF NOT EXISTS cities (
    city_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    province VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Iran',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    image VARCHAR(255)  -- Optional city image
);

CREATE TABLE IF NOT EXISTS places (
    place_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(city_id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    map_url VARCHAR(255)
);

-- Multi-valued: features
CREATE TABLE IF NOT EXISTS place_features (
    place_id UUID REFERENCES places(place_id) ON DELETE CASCADE,
    feature VARCHAR(100) NOT NULL,
    PRIMARY KEY (place_id, feature)
);

-- Multi-valued: images
CREATE TABLE IF NOT EXISTS place_images (
    place_id UUID REFERENCES places(place_id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL,
    PRIMARY KEY (place_id, image_url)
);

-- =============================================
-- POSTS
-- =============================================
CREATE TABLE IF NOT EXISTS posts (
    post_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    place_id UUID REFERENCES places(place_id) ON DELETE SET NULL,
    city_id UUID REFERENCES cities(city_id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    experience_type VARCHAR(20) CHECK (experience_type IN ('visited', 'imagined')),
    approval_status VARCHAR(20) DEFAULT 'pending' 
        CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Multi-valued: images
CREATE TABLE IF NOT EXISTS post_images (
    post_id UUID REFERENCES posts(post_id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL,
    PRIMARY KEY (post_id, image_url)
);

-- =============================================
-- COMMENTS (Weak Entity - depends on POSTS)
-- =============================================
CREATE TABLE IF NOT EXISTS comments (
    comment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- RATINGS (M:N between USERS and POSTS)
-- =============================================
CREATE TABLE IF NOT EXISTS ratings (
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(post_id) ON DELETE CASCADE,
    score INT NOT NULL CHECK (score >= 1 AND score <= 5),
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

-- =============================================
-- COMPANION SYSTEM
-- =============================================
CREATE TABLE IF NOT EXISTS companion_requests (
    request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    destination_place_id UUID REFERENCES places(place_id) ON DELETE SET NULL,
    destination_city_id UUID REFERENCES cities(city_id) ON DELETE SET NULL,
    travel_date DATE NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' 
        CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Multi-valued: conditions
CREATE TABLE IF NOT EXISTS request_conditions (
    request_id UUID REFERENCES companion_requests(request_id) ON DELETE CASCADE,
    condition VARCHAR(100) NOT NULL,
    PRIMARY KEY (request_id, condition)
);

CREATE TABLE IF NOT EXISTS companion_matches (
    match_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES companion_requests(request_id) ON DELETE CASCADE,
    companion_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'accepted', 'rejected')),
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- VIEWS (Derived Attributes)
-- =============================================

-- Drop existing views if they exist
DROP VIEW IF EXISTS profiles_with_counts;
DROP VIEW IF EXISTS posts_with_rating;

-- Profile with follower/following counts (derived attributes)
CREATE VIEW profiles_with_counts AS
SELECT 
    p.*,
    u.name,
    u.username,
    u.email,
    u.profile_image,
    u.user_type,
    (SELECT COUNT(*) FROM follows WHERE following_id = p.user_id) AS followers_count,
    (SELECT COUNT(*) FROM follows WHERE follower_id = p.user_id) AS following_count
FROM profiles p
JOIN users u ON p.user_id = u.user_id;

-- Posts with average rating (derived attribute)
CREATE VIEW posts_with_rating AS
SELECT 
    p.*,
    COALESCE(AVG(r.score)::DECIMAL(3,2), 0) AS avg_rating,
    COUNT(r.user_id) AS rating_count
FROM posts p
LEFT JOIN ratings r ON p.post_id = r.post_id
GROUP BY p.post_id;

-- =============================================
-- INDEXES (for better performance)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_place_id ON posts(place_id);
CREATE INDEX IF NOT EXISTS idx_posts_city_id ON posts(city_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_ratings_post_id ON ratings(post_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_companion_requests_status ON companion_requests(status);
CREATE INDEX IF NOT EXISTS idx_companion_requests_travel_date ON companion_requests(travel_date);
CREATE INDEX IF NOT EXISTS idx_places_city_id ON places(city_id);

-- =============================================
-- TRIGGERS (for maintaining data integrity)
-- =============================================

-- Auto-create profile when user is created
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (user_id) VALUES (NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_profile ON users;
CREATE TRIGGER trigger_create_profile
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_profile_for_user();

-- Auto-create subtype record based on user_type
CREATE OR REPLACE FUNCTION create_user_subtype()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_type = 'regular' THEN
        INSERT INTO regular_users (user_id) VALUES (NEW.user_id);
    ELSIF NEW.user_type = 'moderator' THEN
        INSERT INTO moderators (user_id) VALUES (NEW.user_id);
    ELSIF NEW.user_type = 'admin' THEN
        INSERT INTO admins (user_id) VALUES (NEW.user_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_subtype ON users;
CREATE TRIGGER trigger_create_subtype
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_user_subtype();

-- =============================================
-- PART 2: ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE companion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE companion_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE regular_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES: USERS
-- =============================================
DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
CREATE POLICY "Users are viewable by everyone" ON users
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
CREATE POLICY "Enable insert for authenticated users" ON users
    FOR INSERT WITH CHECK (true);

-- =============================================
-- RLS POLICIES: PROFILES
-- =============================================
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Enable insert for profiles" ON profiles;
CREATE POLICY "Enable insert for profiles" ON profiles
    FOR INSERT WITH CHECK (true);

-- =============================================
-- RLS POLICIES: PROFILE_INTERESTS
-- =============================================
DROP POLICY IF EXISTS "Profile interests are viewable by everyone" ON profile_interests;
CREATE POLICY "Profile interests are viewable by everyone" ON profile_interests
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own interests" ON profile_interests;
CREATE POLICY "Users can manage own interests" ON profile_interests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.profile_id = profile_interests.profile_id 
            AND profiles.user_id::text = auth.uid()::text
        )
    );

-- =============================================
-- RLS POLICIES: FOLLOWS
-- =============================================
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON follows;
CREATE POLICY "Follows are viewable by everyone" ON follows
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own follows" ON follows;
CREATE POLICY "Users can manage own follows" ON follows
    FOR ALL USING (auth.uid()::text = follower_id::text);

-- =============================================
-- RLS POLICIES: CITIES (Public read-only)
-- =============================================
DROP POLICY IF EXISTS "Cities are viewable by everyone" ON cities;
CREATE POLICY "Cities are viewable by everyone" ON cities
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for cities" ON cities;
CREATE POLICY "Enable insert for cities" ON cities
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for cities" ON cities;
CREATE POLICY "Enable update for cities" ON cities
    FOR UPDATE USING (true);

-- =============================================
-- RLS POLICIES: PLACES (Public read-only)
-- =============================================
DROP POLICY IF EXISTS "Places are viewable by everyone" ON places;
CREATE POLICY "Places are viewable by everyone" ON places
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for places" ON places;
CREATE POLICY "Enable insert for places" ON places
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for places" ON places;
CREATE POLICY "Enable update for places" ON places
    FOR UPDATE USING (true);

-- =============================================
-- RLS POLICIES: PLACE_FEATURES
-- =============================================
DROP POLICY IF EXISTS "Place features are viewable by everyone" ON place_features;
CREATE POLICY "Place features are viewable by everyone" ON place_features
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for place_features" ON place_features;
CREATE POLICY "Enable insert for place_features" ON place_features
    FOR INSERT WITH CHECK (true);

-- =============================================
-- RLS POLICIES: PLACE_IMAGES
-- =============================================
DROP POLICY IF EXISTS "Place images are viewable by everyone" ON place_images;
CREATE POLICY "Place images are viewable by everyone" ON place_images
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for place_images" ON place_images;
CREATE POLICY "Enable insert for place_images" ON place_images
    FOR INSERT WITH CHECK (true);

-- =============================================
-- RLS POLICIES: POSTS
-- =============================================
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
CREATE POLICY "Posts are viewable by everyone" ON posts
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
CREATE POLICY "Authenticated users can create posts" ON posts
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update own posts" ON posts;
CREATE POLICY "Users can update own posts" ON posts
    FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
CREATE POLICY "Users can delete own posts" ON posts
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- =============================================
-- RLS POLICIES: POST_IMAGES
-- =============================================
DROP POLICY IF EXISTS "Post images are viewable by everyone" ON post_images;
CREATE POLICY "Post images are viewable by everyone" ON post_images
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own post images" ON post_images;
CREATE POLICY "Users can manage own post images" ON post_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM posts 
            WHERE posts.post_id = post_images.post_id 
            AND posts.user_id::text = auth.uid()::text
        )
    );

-- =============================================
-- RLS POLICIES: COMMENTS
-- =============================================
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
CREATE POLICY "Comments are viewable by everyone" ON comments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
CREATE POLICY "Authenticated users can create comments" ON comments
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments" ON comments
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- =============================================
-- RLS POLICIES: RATINGS
-- =============================================
DROP POLICY IF EXISTS "Ratings are viewable by everyone" ON ratings;
CREATE POLICY "Ratings are viewable by everyone" ON ratings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own ratings" ON ratings;
CREATE POLICY "Users can manage own ratings" ON ratings
    FOR ALL USING (auth.uid()::text = user_id::text);

-- =============================================
-- RLS POLICIES: COMPANION_REQUESTS
-- =============================================
DROP POLICY IF EXISTS "Companion requests are viewable by everyone" ON companion_requests;
CREATE POLICY "Companion requests are viewable by everyone" ON companion_requests
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own requests" ON companion_requests;
CREATE POLICY "Users can manage own requests" ON companion_requests
    FOR ALL USING (auth.uid()::text = user_id::text);

-- =============================================
-- RLS POLICIES: REQUEST_CONDITIONS
-- =============================================
DROP POLICY IF EXISTS "Request conditions are viewable by everyone" ON request_conditions;
CREATE POLICY "Request conditions are viewable by everyone" ON request_conditions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own request conditions" ON request_conditions;
CREATE POLICY "Users can manage own request conditions" ON request_conditions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM companion_requests 
            WHERE companion_requests.request_id = request_conditions.request_id 
            AND companion_requests.user_id::text = auth.uid()::text
        )
    );

-- =============================================
-- RLS POLICIES: COMPANION_MATCHES
-- =============================================
DROP POLICY IF EXISTS "Companion matches are viewable by participants" ON companion_matches;
CREATE POLICY "Companion matches are viewable by participants" ON companion_matches
    FOR SELECT USING (
        auth.uid()::text = companion_user_id::text
        OR EXISTS (
            SELECT 1 FROM companion_requests 
            WHERE companion_requests.request_id = companion_matches.request_id 
            AND companion_requests.user_id::text = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Users can create matches" ON companion_matches;
CREATE POLICY "Users can create matches" ON companion_matches
    FOR INSERT WITH CHECK (auth.uid()::text = companion_user_id::text);

DROP POLICY IF EXISTS "Request owners can update match status" ON companion_matches;
CREATE POLICY "Request owners can update match status" ON companion_matches
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM companion_requests 
            WHERE companion_requests.request_id = companion_matches.request_id 
            AND companion_requests.user_id::text = auth.uid()::text
        )
    );

-- =============================================
-- RLS POLICIES: SUBTYPES (Read-only for all)
-- =============================================
DROP POLICY IF EXISTS "Regular users viewable by everyone" ON regular_users;
CREATE POLICY "Regular users viewable by everyone" ON regular_users
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for regular_users" ON regular_users;
CREATE POLICY "Enable insert for regular_users" ON regular_users
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Moderators viewable by everyone" ON moderators;
CREATE POLICY "Moderators viewable by everyone" ON moderators
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for moderators" ON moderators;
CREATE POLICY "Enable insert for moderators" ON moderators
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins viewable by everyone" ON admins;
CREATE POLICY "Admins viewable by everyone" ON admins
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for admins" ON admins;
CREATE POLICY "Enable insert for admins" ON admins
    FOR INSERT WITH CHECK (true);

-- =============================================
-- GRANT VIEW ACCESS TO ANON ROLE
-- =============================================
GRANT SELECT ON profiles_with_counts TO anon;
GRANT SELECT ON posts_with_rating TO anon;
GRANT SELECT ON profiles_with_counts TO authenticated;
GRANT SELECT ON posts_with_rating TO authenticated;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================
SELECT 'Database schema and RLS policies created successfully!' AS status;
