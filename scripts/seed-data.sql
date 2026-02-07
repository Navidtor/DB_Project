-- =============================================
-- HAMSAFAR MIRZA - Seed Data Script
-- =============================================
-- Run this in Supabase SQL Editor to seed mock data
-- This runs as postgres user, bypassing RLS
-- =============================================

-- Helper function to generate consistent UUIDs from mock IDs
CREATE OR REPLACE FUNCTION mock_id_to_uuid(kind TEXT, mock_id TEXT)
RETURNS UUID AS $$
DECLARE
    prefix TEXT;
    num_part TEXT;
    hex_part TEXT;
BEGIN
    -- Extract numeric part from mock_id (e.g., 'user-1' -> '1')
    num_part := regexp_replace(mock_id, '[^0-9]', '', 'g');
    
    -- Pad to 12 hex digits
    hex_part := lpad(to_hex(num_part::integer), 12, '0');
    
    -- Assign prefix based on kind
    prefix := CASE kind
        WHEN 'user' THEN '10000000'
        WHEN 'city' THEN '20000000'
        WHEN 'place' THEN '30000000'
        WHEN 'post' THEN '40000000'
        WHEN 'comment' THEN '50000000'
        WHEN 'request' THEN '60000000'
        WHEN 'match' THEN '70000000'
        ELSE '00000000'
    END;
    
    RETURN (prefix || '-0000-4000-8000-' || hex_part)::UUID;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TEMPORARILY DISABLE RLS FOR SEEDING
-- =============================================
-- Note: This only works when run as postgres user (SQL Editor)

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profile_interests DISABLE ROW LEVEL SECURITY;
ALTER TABLE follows DISABLE ROW LEVEL SECURITY;
ALTER TABLE cities DISABLE ROW LEVEL SECURITY;
ALTER TABLE places DISABLE ROW LEVEL SECURITY;
ALTER TABLE place_features DISABLE ROW LEVEL SECURITY;
ALTER TABLE place_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE post_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE companion_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE request_conditions DISABLE ROW LEVEL SECURITY;
ALTER TABLE companion_matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE regular_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE moderators DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- =============================================
-- CLEAR EXISTING DATA (Optional - uncomment if needed)
-- =============================================
-- TRUNCATE users CASCADE;
-- TRUNCATE cities CASCADE;

-- =============================================
-- SEED USERS
-- =============================================
INSERT INTO users (user_id, name, username, email, phone, password_hash, profile_image, created_at, user_type)
VALUES
    (mock_id_to_uuid('user', 'user-1'), 'علی احمدی', 'ali_ahmadi', 'ali@example.com', '09121234567', 'hashed_password_1', '/images/avatar_user_1.png', '2024-01-15T10:30:00Z', 'regular'),
    (mock_id_to_uuid('user', 'user-2'), 'مریم رضایی', 'maryam_rezaei', 'maryam@example.com', '09129876543', 'hashed_password_2', '/images/avatar_user_2.png', '2024-01-20T14:00:00Z', 'regular'),
    (mock_id_to_uuid('user', 'user-3'), 'محمد حسینی', 'mohammad_hoseini', 'mohammad@example.com', '09123456789', 'hashed_password_3', '/images/avatar_user_3.png', '2024-02-01T09:00:00Z', 'moderator'),
    (mock_id_to_uuid('user', 'user-4'), 'سارا کریمی', 'sara_karimi', 'sara@example.com', NULL, 'hashed_password_4', '/images/avatar_user_4.png', '2024-02-10T16:30:00Z', 'admin'),
    (mock_id_to_uuid('user', 'user-5'), 'رضا محمدی', 'reza_mohammadi', 'reza@example.com', NULL, 'hashed_password_5', '/images/avatar_user_5.png', '2024-02-15T11:00:00Z', 'regular'),
    (mock_id_to_uuid('user', 'user-6'), 'فاطمه نوری', 'fatemeh_noori', 'fatemeh@example.com', '09131112233', 'hashed_password_6', '/images/avatar_user_6.png', '2024-02-20T08:00:00Z', 'regular'),
    (mock_id_to_uuid('user', 'user-7'), 'امیر حسین زاده', 'amir_hz', 'amir12@example.com', '09144445566', 'hashed_password_7', '/images/avatar_user_7.png', '2024-02-25T15:30:00Z', 'regular'),
    (mock_id_to_uuid('user', 'user-8'), 'نازنین اکبری', 'nazanin_akbari', 'nazanin@example.com', NULL, 'hashed_password_8', '/images/avatar_user_8.png', '2024-03-01T12:00:00Z', 'regular'),
    (mock_id_to_uuid('user', 'user-9'), 'حسین موسوی', 'hossein_m', 'hossein@example.com', '09157778899', 'hashed_password_9', '/images/avatar_user_9.png', '2024-03-05T09:00:00Z', 'moderator'),
    (mock_id_to_uuid('user', 'user-10'), 'زهرا صادقی', 'zahra_sadeghi', 'zahra@example.com', '09169990011', 'hashed_password_10', '/images/avatar_user_10.png', '2024-03-10T14:00:00Z', 'regular')
ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    username = EXCLUDED.username,
    email = EXCLUDED.email;

-- Note: Profiles are auto-created by trigger, just update them
UPDATE profiles SET bio = 'عاشق سفر و کوهنوردی. همیشه در جستجوی مناظر زیبا و تجربه‌های جدید.', cover_image = '/images/cover_profile_1.png'
WHERE user_id = mock_id_to_uuid('user', 'user-1');

UPDATE profiles SET bio = 'علاقه‌مند به تاریخ و فرهنگ ایران. عکاس آماتور.', cover_image = '/images/cover_profile_2.png'
WHERE user_id = mock_id_to_uuid('user', 'user-2');

UPDATE profiles SET bio = 'راهنمای گردشگری با ۱۰ سال تجربه. عاشق معرفی جاذبه‌های پنهان ایران.', cover_image = '/images/cover_profile_3.png'
WHERE user_id = mock_id_to_uuid('user', 'user-3');

UPDATE profiles SET bio = 'مدیر سیستم همسفر میرزا. در خدمت شما هستم.', cover_image = '/images/cover_profile_4.png'
WHERE user_id = mock_id_to_uuid('user', 'user-4');

UPDATE profiles SET bio = 'دوستدار طبیعت و کمپینگ. به دنبال همسفر برای سفرهای ماجراجویانه.', cover_image = '/images/cover_profile_5.png'
WHERE user_id = mock_id_to_uuid('user', 'user-5');

-- =============================================
-- SEED CITIES
-- =============================================
INSERT INTO cities (city_id, name, description, province, country, latitude, longitude, image)
VALUES
    (mock_id_to_uuid('city', 'city-1'), 'اصفهان', 'نصف جهان، شهر گنبدهای فیروزه‌ای و پل‌های تاریخی', 'اصفهان', 'Iran', 32.6546, 51.6680, '/images/naqshe_jahan.png'),
    (mock_id_to_uuid('city', 'city-2'), 'شیراز', 'شهر شعر و گل و بلبل، پایتخت فرهنگی ایران', 'فارس', 'Iran', 29.5918, 52.5837, '/images/hafezieh.png'),
    (mock_id_to_uuid('city', 'city-3'), 'یزد', 'شهر بادگیرها و خانه‌های خشتی', 'یزد', 'Iran', 31.8974, 54.3569, '/images/yazd_mosque.png'),
    (mock_id_to_uuid('city', 'city-4'), 'کاشان', 'شهر گلاب و خانه‌های تاریخی', 'اصفهان', 'Iran', 33.9850, 51.4100, '/images/tabatabaei_house.png'),
    (mock_id_to_uuid('city', 'city-5'), 'تهران', 'پایتخت ایران، شهر تضادها و تنوع', 'تهران', 'Iran', 35.6892, 51.3890, '/images/azadi_tower.png'),
    (mock_id_to_uuid('city', 'city-6'), 'تبریز', 'شهر اولین‌ها، پایتخت گردشگری جهان اسلام', 'آذربایجان شرقی', 'Iran', 38.0962, 46.2738, '/images/tabriz_bazaar.png'),
    (mock_id_to_uuid('city', 'city-7'), 'مشهد', 'شهر امام رضا، دومین شهر بزرگ ایران', 'خراسان رضوی', 'Iran', 36.2605, 59.6168, '/images/imam_reza_shrine.png'),
    (mock_id_to_uuid('city', 'city-8'), 'کرمان', 'شهر باغ شازده و کویر لوت', 'کرمان', 'Iran', 30.2839, 57.0834, '/images/shazdeh_garden.png')
ON CONFLICT (city_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- =============================================
-- SEED PLACES
-- =============================================
INSERT INTO places (place_id, city_id, name, description, latitude, longitude, map_url)
VALUES
    (mock_id_to_uuid('place', 'place-1'), mock_id_to_uuid('city', 'city-1'), 'میدان نقش جهان', 'یکی از بزرگترین میدان‌های جهان و میراث جهانی یونسکو', 32.6575, 51.6772, 'https://maps.google.com/?q=32.6575,51.6772'),
    (mock_id_to_uuid('place', 'place-2'), mock_id_to_uuid('city', 'city-1'), 'سی‌وسه پل', 'پل تاریخی با ۳۳ دهانه بر روی زاینده‌رود', 32.6424, 51.6685, 'https://maps.google.com/?q=32.6424,51.6685'),
    (mock_id_to_uuid('place', 'place-3'), mock_id_to_uuid('city', 'city-2'), 'حافظیه', 'آرامگاه حافظ شیرازی، شاعر بزرگ ایران', 29.6198, 52.5485, 'https://maps.google.com/?q=29.6198,52.5485'),
    (mock_id_to_uuid('place', 'place-4'), mock_id_to_uuid('city', 'city-2'), 'تخت جمشید', 'پایتخت تشریفاتی هخامنشیان و میراث جهانی', 29.9352, 52.8914, 'https://maps.google.com/?q=29.9352,52.8914'),
    (mock_id_to_uuid('place', 'place-5'), mock_id_to_uuid('city', 'city-3'), 'مسجد جامع یزد', 'مسجدی با بلندترین مناره‌های ایران', 31.8984, 54.3666, 'https://maps.google.com/?q=31.8984,54.3666'),
    (mock_id_to_uuid('place', 'place-6'), mock_id_to_uuid('city', 'city-4'), 'خانه طباطبایی‌ها', 'شاهکار معماری سنتی ایران در دوره قاجار', 33.9765, 51.4456, 'https://maps.google.com/?q=33.9765,51.4456'),
    (mock_id_to_uuid('place', 'place-7'), mock_id_to_uuid('city', 'city-5'), 'کاخ گلستان', 'مجموعه کاخ سلطنتی قاجار و میراث جهانی', 35.6837, 51.4198, 'https://maps.google.com/?q=35.6837,51.4198'),
    (mock_id_to_uuid('place', 'place-8'), mock_id_to_uuid('city', 'city-6'), 'بازار تبریز', 'بزرگترین بازار سرپوشیده جهان و میراث یونسکو', 38.0836, 46.2923, 'https://maps.google.com/?q=38.0836,46.2923')
ON CONFLICT (place_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- =============================================
-- SEED PLACE FEATURES
-- =============================================
INSERT INTO place_features (place_id, feature) VALUES
    (mock_id_to_uuid('place', 'place-1'), 'میراث جهانی یونسکو'),
    (mock_id_to_uuid('place', 'place-1'), 'معماری صفوی'),
    (mock_id_to_uuid('place', 'place-1'), 'مسجد شیخ لطف‌الله'),
    (mock_id_to_uuid('place', 'place-2'), 'پل تاریخی'),
    (mock_id_to_uuid('place', 'place-2'), 'چایخانه سنتی'),
    (mock_id_to_uuid('place', 'place-3'), 'آرامگاه'),
    (mock_id_to_uuid('place', 'place-3'), 'باغ ایرانی'),
    (mock_id_to_uuid('place', 'place-4'), 'میراث جهانی'),
    (mock_id_to_uuid('place', 'place-4'), 'باستان‌شناسی')
ON CONFLICT (place_id, feature) DO NOTHING;

-- =============================================
-- SEED PLACE IMAGES
-- =============================================
INSERT INTO place_images (place_id, image_url) VALUES
    (mock_id_to_uuid('place', 'place-1'), '/images/naqshe_jahan.png'),
    (mock_id_to_uuid('place', 'place-2'), '/images/si_o_se_pol.png'),
    (mock_id_to_uuid('place', 'place-3'), '/images/hafezieh.png'),
    (mock_id_to_uuid('place', 'place-4'), '/images/persepolis.png'),
    (mock_id_to_uuid('place', 'place-5'), '/images/yazd_mosque.png'),
    (mock_id_to_uuid('place', 'place-6'), '/images/tabatabaei_house.png'),
    (mock_id_to_uuid('place', 'place-7'), '/images/golestan_palace.png'),
    (mock_id_to_uuid('place', 'place-8'), '/images/tabriz_bazaar.png')
ON CONFLICT (place_id, image_url) DO NOTHING;

-- =============================================
-- SEED POSTS
-- =============================================
INSERT INTO posts (post_id, user_id, place_id, city_id, title, content, experience_type, approval_status, created_at)
VALUES
    (mock_id_to_uuid('post', 'post-1'), mock_id_to_uuid('user', 'user-1'), mock_id_to_uuid('place', 'place-1'), mock_id_to_uuid('city', 'city-1'), 'سفر رویایی به اصفهان', 'اصفهان واقعاً نصف جهان است! میدان نقش جهان یکی از زیباترین مکان‌هایی بود که دیدم.', 'visited', 'approved', '2024-03-01T10:00:00Z'),
    (mock_id_to_uuid('post', 'post-2'), mock_id_to_uuid('user', 'user-2'), mock_id_to_uuid('place', 'place-3'), mock_id_to_uuid('city', 'city-2'), 'غروب در حافظیه', 'لحظات جادویی در کنار آرامگاه حافظ. شعرهایش در این فضا معنای دیگری پیدا می‌کنند.', 'visited', 'approved', '2024-03-05T15:30:00Z'),
    (mock_id_to_uuid('post', 'post-3'), mock_id_to_uuid('user', 'user-5'), mock_id_to_uuid('place', 'place-4'), mock_id_to_uuid('city', 'city-2'), 'شکوه تخت جمشید', 'ایستادن در برابر این ستون‌های باستانی، احساس غرور ملی را در وجودم زنده کرد.', 'visited', 'approved', '2024-03-10T11:00:00Z'),
    (mock_id_to_uuid('post', 'post-4'), mock_id_to_uuid('user', 'user-6'), mock_id_to_uuid('place', 'place-5'), mock_id_to_uuid('city', 'city-3'), 'معماری یزد', 'بادگیرها و کوچه‌های یزد مثل یک موزه زنده معماری است.', 'visited', 'approved', '2024-03-12T09:00:00Z'),
    (mock_id_to_uuid('post', 'post-5'), mock_id_to_uuid('user', 'user-7'), mock_id_to_uuid('place', 'place-6'), mock_id_to_uuid('city', 'city-4'), 'خانه‌های کاشان', 'خانه طباطبایی‌ها نمونه کاملی از ذوق و هنر ایرانی در معماری است.', 'visited', 'approved', '2024-03-15T14:00:00Z')
ON CONFLICT (post_id) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content;

-- =============================================
-- SEED POST IMAGES
-- =============================================
INSERT INTO post_images (post_id, image_url) VALUES
    (mock_id_to_uuid('post', 'post-1'), '/images/naqshe_jahan.png'),
    (mock_id_to_uuid('post', 'post-2'), '/images/hafezieh.png'),
    (mock_id_to_uuid('post', 'post-3'), '/images/persepolis.png'),
    (mock_id_to_uuid('post', 'post-4'), '/images/yazd_mosque.png'),
    (mock_id_to_uuid('post', 'post-5'), '/images/tabatabaei_house.png')
ON CONFLICT (post_id, image_url) DO NOTHING;

-- =============================================
-- SEED COMMENTS
-- =============================================
INSERT INTO comments (comment_id, post_id, user_id, content, created_at)
VALUES
    (mock_id_to_uuid('comment', 'comment-1'), mock_id_to_uuid('post', 'post-1'), mock_id_to_uuid('user', 'user-2'), 'عکس‌های خیلی قشنگی گرفتی! من هم می‌خوام برم اصفهان.', '2024-03-01T12:00:00Z'),
    (mock_id_to_uuid('comment', 'comment-2'), mock_id_to_uuid('post', 'post-1'), mock_id_to_uuid('user', 'user-5'), 'بهترین زمان سفر به اصفهان بهار است.', '2024-03-01T14:30:00Z'),
    (mock_id_to_uuid('comment', 'comment-3'), mock_id_to_uuid('post', 'post-2'), mock_id_to_uuid('user', 'user-1'), 'حافظیه در شب هم خیلی زیباست!', '2024-03-05T18:00:00Z'),
    (mock_id_to_uuid('comment', 'comment-4'), mock_id_to_uuid('post', 'post-3'), mock_id_to_uuid('user', 'user-6'), 'تخت جمشید یکی از آرزوهای من است.', '2024-03-10T13:00:00Z')
ON CONFLICT (comment_id) DO UPDATE SET
    content = EXCLUDED.content;

-- =============================================
-- SEED RATINGS
-- =============================================
INSERT INTO ratings (user_id, post_id, score, created_at)
VALUES
    (mock_id_to_uuid('user', 'user-2'), mock_id_to_uuid('post', 'post-1'), 5, '2024-03-01T12:00:00Z'),
    (mock_id_to_uuid('user', 'user-5'), mock_id_to_uuid('post', 'post-1'), 4, '2024-03-01T14:30:00Z'),
    (mock_id_to_uuid('user', 'user-1'), mock_id_to_uuid('post', 'post-2'), 5, '2024-03-05T18:00:00Z'),
    (mock_id_to_uuid('user', 'user-6'), mock_id_to_uuid('post', 'post-3'), 5, '2024-03-10T13:00:00Z'),
    (mock_id_to_uuid('user', 'user-7'), mock_id_to_uuid('post', 'post-4'), 4, '2024-03-12T10:00:00Z')
ON CONFLICT (user_id, post_id) DO UPDATE SET
    score = EXCLUDED.score;

-- =============================================
-- SEED FOLLOWS
-- =============================================
INSERT INTO follows (follower_id, following_id, created_at)
VALUES
    (mock_id_to_uuid('user', 'user-1'), mock_id_to_uuid('user', 'user-2'), '2024-02-01T10:00:00Z'),
    (mock_id_to_uuid('user', 'user-1'), mock_id_to_uuid('user', 'user-3'), '2024-02-05T12:00:00Z'),
    (mock_id_to_uuid('user', 'user-2'), mock_id_to_uuid('user', 'user-1'), '2024-02-02T09:00:00Z'),
    (mock_id_to_uuid('user', 'user-5'), mock_id_to_uuid('user', 'user-1'), '2024-02-10T15:00:00Z'),
    (mock_id_to_uuid('user', 'user-6'), mock_id_to_uuid('user', 'user-2'), '2024-02-15T11:00:00Z')
ON CONFLICT (follower_id, following_id) DO NOTHING;

-- =============================================
-- SEED COMPANION REQUESTS
-- =============================================
INSERT INTO companion_requests (request_id, user_id, destination_place_id, destination_city_id, travel_date, description, status, created_at)
VALUES
    (mock_id_to_uuid('request', 'request-1'), mock_id_to_uuid('user', 'user-1'), mock_id_to_uuid('place', 'place-4'), mock_id_to_uuid('city', 'city-2'), '2024-04-15', 'به دنبال همسفر برای بازدید از تخت جمشید', 'active', '2024-03-20T10:00:00Z'),
    (mock_id_to_uuid('request', 'request-2'), mock_id_to_uuid('user', 'user-5'), mock_id_to_uuid('place', 'place-5'), mock_id_to_uuid('city', 'city-3'), '2024-04-20', 'سفر به یزد برای دیدن معماری سنتی', 'active', '2024-03-22T14:00:00Z')
ON CONFLICT (request_id) DO UPDATE SET
    description = EXCLUDED.description;

-- =============================================
-- SEED REQUEST CONDITIONS
-- =============================================
INSERT INTO request_conditions (request_id, condition) VALUES
    (mock_id_to_uuid('request', 'request-1'), 'ترجیحاً خانم'),
    (mock_id_to_uuid('request', 'request-1'), 'علاقه‌مند به تاریخ'),
    (mock_id_to_uuid('request', 'request-2'), 'عکاسی'),
    (mock_id_to_uuid('request', 'request-2'), 'پیاده‌روی')
ON CONFLICT (request_id, condition) DO NOTHING;

-- =============================================
-- SEED PROFILE INTERESTS
-- =============================================
INSERT INTO profile_interests (profile_id, interest)
SELECT p.profile_id, interest
FROM profiles p, (VALUES 
    ('کوهنوردی'), ('عکاسی'), ('تاریخ'), ('غذای محلی')
) AS interests(interest)
WHERE p.user_id = mock_id_to_uuid('user', 'user-1')
ON CONFLICT (profile_id, interest) DO NOTHING;

INSERT INTO profile_interests (profile_id, interest)
SELECT p.profile_id, interest
FROM profiles p, (VALUES 
    ('عکاسی'), ('موزه'), ('معماری')
) AS interests(interest)
WHERE p.user_id = mock_id_to_uuid('user', 'user-2')
ON CONFLICT (profile_id, interest) DO NOTHING;

-- =============================================
-- RE-ENABLE RLS
-- =============================================
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
-- CLEANUP
-- =============================================
DROP FUNCTION IF EXISTS mock_id_to_uuid(TEXT, TEXT);

-- =============================================
-- VERIFY
-- =============================================
SELECT 'Seed completed!' AS status,
       (SELECT COUNT(*) FROM users) AS users_count,
       (SELECT COUNT(*) FROM cities) AS cities_count,
       (SELECT COUNT(*) FROM places) AS places_count,
       (SELECT COUNT(*) FROM posts) AS posts_count;
