import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import * as mockData from '../src/data/mockData';

type IdKind = 'user' | 'city' | 'place' | 'post' | 'comment' | 'request' | 'match';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const loadEnvFile = (filePath: string) => {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
};

loadEnvFile(path.resolve(__dirname, '..', '.env.local'));

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;

// Service Role Key is REQUIRED for seeding (bypasses RLS)
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing VITE_SUPABASE_URL. Set it in .env.local');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error(`
❌ Missing SUPABASE_SERVICE_ROLE_KEY

The seed script requires the Service Role Key to bypass Row Level Security (RLS).
The anon key cannot insert data when RLS is enabled.

To fix this:

1. Go to Supabase Dashboard > Settings > API > Project API keys
2. Copy the "service_role" key (NOT the anon key)
3. Add it to your .env.local file:

   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

⚠️  WARNING: Never expose the service role key in frontend code!
    It should only be used in server-side scripts like this seeder.

Alternative: Run the seed SQL directly in Supabase SQL Editor:
    See scripts/seed-data.sql
`);
  process.exit(1);
}

const supabaseKey = serviceRoleKey;

const supabase = createClient(supabaseUrl, supabaseKey);

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const idPrefixes: Record<IdKind, string> = {
  user: '10000000',
  city: '20000000',
  place: '30000000',
  post: '40000000',
  comment: '50000000',
  request: '60000000',
  match: '70000000',
};

const toUuid = (kind: IdKind, id?: string | null) => {
  if (!id) return null;
  if (uuidRegex.test(id)) return id;
  const match = id.match(/(\d+)$/);
  if (!match) {
    throw new Error(`Cannot map id "${id}" for kind "${kind}".`);
  }
  const hex = Number(match[1]).toString(16).padStart(12, '0');
  return `${idPrefixes[kind]}-0000-4000-8000-${hex}`;
};

const chunk = <T>(items: T[], size = 500) => {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
};

const upsertBatches = async (table: string, rows: any[], options?: { onConflict?: string; ignoreDuplicates?: boolean }) => {
  if (!rows.length) return;
  for (const batch of chunk(rows)) {
    const { error } = await supabase.from(table).upsert(batch, options);
    if (error) throw new Error(`${table}: ${error.message}`);
  }
};

const seed = async () => {
  const users = mockData.users.map((user) => ({
    user_id: toUuid('user', user.user_id),
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone ?? null,
    password_hash: user.password_hash,
    profile_image: user.profile_image ?? null,
    created_at: user.created_at,
    user_type: user.user_type,
  }));

  const citiesWithImage = mockData.cities.map((city) => ({
    city_id: toUuid('city', city.city_id),
    name: city.name,
    description: city.description ?? null,
    province: city.province ?? null,
    country: city.country ?? 'Iran',
    latitude: city.latitude ?? null,
    longitude: city.longitude ?? null,
    image: city.image ?? null,
  }));

  const citiesWithoutImage = citiesWithImage.map(({ image, ...city }) => city);

  const places = mockData.places.map((place) => ({
    place_id: toUuid('place', place.place_id),
    city_id: toUuid('city', place.city_id),
    name: place.name,
    description: place.description ?? null,
    latitude: place.latitude ?? null,
    longitude: place.longitude ?? null,
    map_url: place.map_url ?? null,
  }));

  const placeFeatures = mockData.places.flatMap((place) =>
    place.features.map((feature) => ({
      place_id: toUuid('place', place.place_id),
      feature,
    })),
  );

  const placeImages = mockData.places.flatMap((place) =>
    place.images.map((image_url) => ({
      place_id: toUuid('place', place.place_id),
      image_url,
    })),
  );

  const posts = mockData.posts.map((post) => ({
    post_id: toUuid('post', post.post_id),
    user_id: toUuid('user', post.user_id),
    place_id: toUuid('place', post.place_id),
    city_id: toUuid('city', post.city_id),
    title: post.title,
    content: post.content,
    experience_type: post.experience_type,
    approval_status: post.approval_status,
    created_at: post.created_at,
  }));

  const postImages = mockData.posts.flatMap((post) =>
    post.images.map((image_url) => ({
      post_id: toUuid('post', post.post_id),
      image_url,
    })),
  );

  const comments = mockData.comments.map((comment) => ({
    comment_id: toUuid('comment', comment.comment_id),
    post_id: toUuid('post', comment.post_id),
    user_id: toUuid('user', comment.user_id),
    content: comment.content,
    created_at: comment.created_at,
  }));

  const ratings = mockData.ratings.map((rating) => ({
    user_id: toUuid('user', rating.user_id),
    post_id: toUuid('post', rating.post_id),
    score: rating.score,
    created_at: rating.created_at,
  }));

  const follows = mockData.follows.map((follow) => ({
    follower_id: toUuid('user', follow.follower_id),
    following_id: toUuid('user', follow.following_id),
    created_at: follow.created_at,
  }));

  const companionRequests = mockData.companionRequests.map((request) => ({
    request_id: toUuid('request', request.request_id),
    user_id: toUuid('user', request.user_id),
    destination_place_id: toUuid('place', request.destination_place_id),
    destination_city_id: toUuid('city', request.destination_city_id),
    travel_date: request.travel_date,
    description: request.description ?? null,
    status: request.status,
    created_at: request.created_at,
  }));

  const requestConditions = mockData.companionRequests.flatMap((request) =>
    request.conditions.map((condition) => ({
      request_id: toUuid('request', request.request_id),
      condition,
    })),
  );

  const companionMatches = mockData.companionMatches.map((match) => ({
    match_id: toUuid('match', match.match_id),
    request_id: toUuid('request', match.request_id),
    companion_user_id: toUuid('user', match.companion_user_id),
    status: match.status,
    message: match.message ?? null,
    created_at: match.created_at,
  }));

  const regularUsers = mockData.regularUsers.map((user) => ({
    user_id: toUuid('user', user.user_id),
    travel_preferences: user.travel_preferences,
    experience_level: user.experience_level,
  }));

  const moderators = mockData.moderators.map((moderator) => ({
    user_id: toUuid('user', moderator.user_id),
    assigned_regions: moderator.assigned_regions,
    approval_count: moderator.approval_count,
  }));

  const admins = mockData.admins.map((admin) => ({
    user_id: toUuid('user', admin.user_id),
    access_level: admin.access_level,
    last_admin_action: admin.last_admin_action ?? null,
  }));

  const profileUpdates = mockData.profiles.map((profile) => ({
    user_id: toUuid('user', profile.user_id),
    bio: profile.bio ?? null,
    cover_image: profile.cover_image ?? null,
  }));

  console.log('Seeding users...');
  await upsertBatches('users', users, { onConflict: 'user_id' });

  console.log('Seeding profiles...');
  await upsertBatches('profiles', profileUpdates, { onConflict: 'user_id' });

  const profileIdsResponse = await supabase
    .from('profiles')
    .select('profile_id, user_id')
    .in(
      'user_id',
      profileUpdates.map((profile) => profile.user_id),
    );
  if (profileIdsResponse.error) {
    throw new Error(`profiles: ${profileIdsResponse.error.message}`);
  }
  const profileIdByUserId = new Map(
    (profileIdsResponse.data || []).map((row) => [row.user_id as string, row.profile_id as string]),
  );

  const profileInterests = mockData.profiles.flatMap((profile) =>
    profile.interests.map((interest) => ({
      profile_id: profileIdByUserId.get(toUuid('user', profile.user_id) || ''),
      interest,
    })),
  ).filter((row) => row.profile_id);

  console.log('Seeding profile interests...');
  await upsertBatches('profile_interests', profileInterests, {
    onConflict: 'profile_id,interest',
    ignoreDuplicates: true,
  });

  console.log('Seeding cities...');
  const cityInsert = await supabase.from('cities').upsert(citiesWithImage, { onConflict: 'city_id' });
  if (cityInsert.error) {
    if (cityInsert.error.message.toLowerCase().includes('image')) {
      await upsertBatches('cities', citiesWithoutImage, { onConflict: 'city_id' });
      console.warn('cities.image column not found; inserted without images.');
    } else {
      throw new Error(`cities: ${cityInsert.error.message}`);
    }
  }

  console.log('Seeding places...');
  await upsertBatches('places', places, { onConflict: 'place_id' });

  console.log('Seeding place features...');
  await upsertBatches('place_features', placeFeatures, {
    onConflict: 'place_id,feature',
    ignoreDuplicates: true,
  });

  console.log('Seeding place images...');
  await upsertBatches('place_images', placeImages, {
    onConflict: 'place_id,image_url',
    ignoreDuplicates: true,
  });

  console.log('Seeding posts...');
  await upsertBatches('posts', posts, { onConflict: 'post_id' });

  console.log('Seeding post images...');
  await upsertBatches('post_images', postImages, {
    onConflict: 'post_id,image_url',
    ignoreDuplicates: true,
  });

  console.log('Seeding comments...');
  await upsertBatches('comments', comments, { onConflict: 'comment_id' });

  console.log('Seeding ratings...');
  await upsertBatches('ratings', ratings, { onConflict: 'user_id,post_id' });

  console.log('Seeding follows...');
  await upsertBatches('follows', follows, { onConflict: 'follower_id,following_id' });

  console.log('Seeding companion requests...');
  await upsertBatches('companion_requests', companionRequests, { onConflict: 'request_id' });

  console.log('Seeding request conditions...');
  await upsertBatches('request_conditions', requestConditions, {
    onConflict: 'request_id,condition',
    ignoreDuplicates: true,
  });

  console.log('Seeding companion matches...');
  await upsertBatches('companion_matches', companionMatches, { onConflict: 'match_id' });

  console.log('Seeding regular users...');
  await upsertBatches('regular_users', regularUsers, { onConflict: 'user_id' });

  console.log('Seeding moderators...');
  await upsertBatches('moderators', moderators, { onConflict: 'user_id' });

  console.log('Seeding admins...');
  await upsertBatches('admins', admins, { onConflict: 'user_id' });

  console.log('Seed complete.');
};

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
