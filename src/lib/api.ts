// API Service Layer - Real Database Queries
// This file replaces mockData.ts functions with actual Supabase queries

import { supabase, isSupabaseConfigured, shouldUseMockData, allowMockFallback } from './supabase';
import * as mockData from '../data/mockData';

// Types
import type {
    User,
    Profile,
    City,
    Place,
    Post,
    Comment,
    CompanionRequest,
    CompanionMatch,
    Follow,
    RegularUser,
    Moderator,
    Admin,
} from '../types/database';

type ProfileRow = Omit<Profile, 'interests'> & {
    profile_id: string;
    user_id: string;
    bio?: string | null;
    cover_image?: string | null;
    followers_count?: number | null;
    following_count?: number | null;
};

type PostRow = Omit<Post, 'images'> & {
    post_id: string;
    user_id: string;
    place_id?: string | null;
    city_id?: string | null;
    avg_rating?: number | null;
    rating_count?: number | null;
};

type ProfileInterestRow = {
    profile_id: string;
    interest: string;
};

type PostImageRow = {
    post_id: string;
    image_url: string;
};

type CommentRow = Comment & {
    post_id: string;
};

const ensureErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : 'Unknown error';

const hasDisplayableImage = (image?: string | null) =>
    typeof image === 'string' && image.trim().length > 0 && !image.includes('placehold.co');
const filterVisibleCities = (cities: City[]) => cities.filter((city) => hasDisplayableImage(city.image));

const requireSupabaseClient = () => {
    if (!isSupabaseConfigured) {
        throw new Error('Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }
    return supabase!;
};

const handleSupabaseError = <T>(context: string, error: unknown, fallback: T): T => {
    console.error(`${context}:`, error);
    if (allowMockFallback) return fallback;
    throw new Error(`${context}: ${ensureErrorMessage(error)}`);
};

const toNumber = (value: unknown, fallback = 0) => {
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const normalizeProfile = (profile: ProfileRow, interestsByProfileId: Record<string, string[]>): Profile => ({
    profile_id: profile.profile_id,
    user_id: profile.user_id,
    bio: profile.bio ?? undefined,
    cover_image: profile.cover_image ?? undefined,
    interests: interestsByProfileId[profile.profile_id] ?? [],
    followers_count: toNumber(profile.followers_count),
    following_count: toNumber(profile.following_count),
});

const normalizePost = (post: PostRow, imagesByPostId: Record<string, string[]>): Post => ({
    ...post,
    place_id: post.place_id ?? undefined,
    city_id: post.city_id ?? undefined,
    avg_rating: toNumber(post.avg_rating),
    rating_count: toNumber(post.rating_count),
    images: imagesByPostId[post.post_id] ?? [],
});

const groupProfileInterests = (rows: ProfileInterestRow[]) => {
    const grouped: Record<string, string[]> = {};
    for (const row of rows) {
        if (!grouped[row.profile_id]) grouped[row.profile_id] = [];
        grouped[row.profile_id].push(row.interest);
    }
    return grouped;
};

const groupPostImages = (rows: PostImageRow[]) => {
    const grouped: Record<string, string[]> = {};
    for (const row of rows) {
        if (!grouped[row.post_id]) grouped[row.post_id] = [];
        grouped[row.post_id].push(row.image_url);
    }
    return grouped;
};

const groupCommentsByPost = (rows: CommentRow[]) => {
    const grouped: Record<string, Comment[]> = {};
    for (const row of rows) {
        if (!grouped[row.post_id]) grouped[row.post_id] = [];
        grouped[row.post_id].push(row);
    }
    return grouped;
};

const getProfileInterests = async (profileIds: string[]) => {
    if (profileIds.length === 0 || shouldUseMockData) return {};
    const client = requireSupabaseClient();
    try {
        const { data, error } = await client
            .from('profile_interests')
            .select('profile_id, interest')
            .in('profile_id', profileIds);

        if (error) {
            return handleSupabaseError('Error fetching profile interests', error, {});
        }

        return groupProfileInterests((data ?? []) as ProfileInterestRow[]);
    } catch (error) {
        return handleSupabaseError('Error fetching profile interests', error, {});
    }
};

const getPostImages = async (postIds: string[]) => {
    if (postIds.length === 0 || shouldUseMockData) return {};
    const client = requireSupabaseClient();
    try {
        const { data, error } = await client
            .from('post_images')
            .select('post_id, image_url')
            .in('post_id', postIds);

        if (error) {
            return handleSupabaseError('Error fetching post images', error, {});
        }

        return groupPostImages((data ?? []) as PostImageRow[]);
    } catch (error) {
        return handleSupabaseError('Error fetching post images', error, {});
    }
};

// ============================================
// USER FUNCTIONS
// ============================================

export async function getUsers(): Promise<User[]> {
    if (shouldUseMockData) return mockData.users;
    const client = requireSupabaseClient();
    try {
        const { data, error } = await client.from('users').select('*');
        if (error) {
            return handleSupabaseError('Error fetching users', error, mockData.users);
        }
        return data || [];
    } catch (error) {
        return handleSupabaseError('Error fetching users', error, mockData.users);
    }
}

export async function getUserById(userId: string): Promise<User | undefined> {
    if (shouldUseMockData) return mockData.getUserById(userId);
    const client = requireSupabaseClient();
    try {
        const { data, error } = await client
            .from('users')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            return handleSupabaseError('Error fetching user', error, mockData.getUserById(userId));
        }
        return data ?? undefined;
    } catch (error) {
        return handleSupabaseError('Error fetching user', error, mockData.getUserById(userId));
    }
}

// ============================================
// PROFILE FUNCTIONS
// ============================================

export async function getProfiles(): Promise<Profile[]> {
    if (shouldUseMockData) return mockData.profiles;
    const client = requireSupabaseClient();
    try {
        const { data, error } = await client.from('profiles_with_counts').select('*');
        if (error) {
            return handleSupabaseError('Error fetching profiles', error, mockData.profiles);
        }

        const profiles = (data ?? []) as ProfileRow[];
        const interestsByProfileId = await getProfileInterests(
            profiles.map((profile) => profile.profile_id),
        );

        return profiles.map((profile) => normalizeProfile(profile, interestsByProfileId));
    } catch (error) {
        return handleSupabaseError('Error fetching profiles', error, mockData.profiles);
    }
}

export async function getProfileByUserId(userId: string): Promise<Profile | undefined> {
    if (shouldUseMockData) return mockData.getProfileByUserId(userId);
    const client = requireSupabaseClient();
    try {
        const { data, error } = await client
            .from('profiles_with_counts')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            return handleSupabaseError(
                'Error fetching profile',
                error,
                mockData.getProfileByUserId(userId),
            );
        }

        if (!data) return undefined;

        const interestsByProfileId = await getProfileInterests([data.profile_id]);
        return normalizeProfile(data as ProfileRow, interestsByProfileId);
    } catch (error) {
        return handleSupabaseError(
            'Error fetching profile',
            error,
            mockData.getProfileByUserId(userId),
        );
    }
}

// ============================================
// CITY FUNCTIONS
// ============================================

export async function getCities(): Promise<City[]> {
    if (shouldUseMockData) return filterVisibleCities(mockData.cities);
    const client = requireSupabaseClient();
    try {
        const { data, error } = await client.from('cities').select('*');
        if (error) {
            return handleSupabaseError('Error fetching cities', error, filterVisibleCities(mockData.cities));
        }
        return filterVisibleCities((data || []) as City[]);
    } catch (error) {
        return handleSupabaseError('Error fetching cities', error, filterVisibleCities(mockData.cities));
    }
}

export async function getCityById(cityId: string): Promise<City | undefined> {
    if (shouldUseMockData) {
        const city = mockData.getCityById(cityId);
        return city && hasDisplayableImage(city.image) ? city : undefined;
    }
    const client = requireSupabaseClient();
    try {
        const { data, error } = await client
            .from('cities')
            .select('*')
            .eq('city_id', cityId)
            .single();

        if (error) {
            return handleSupabaseError(
                'Error fetching city',
                error,
                filterVisibleCities([mockData.getCityById(cityId)].filter(Boolean) as City[])[0],
            );
        }
        if (!data) return undefined;
        const city = data as City;
        return hasDisplayableImage(city.image) ? city : undefined;
    } catch (error) {
        return handleSupabaseError(
            'Error fetching city',
            error,
            filterVisibleCities([mockData.getCityById(cityId)].filter(Boolean) as City[])[0],
        );
    }
}

// ============================================
// PLACE FUNCTIONS
// ============================================

export async function getPlaces(): Promise<Place[]> {
    if (shouldUseMockData) return mockData.places;
    const client = requireSupabaseClient();
    try {
        const { data, error } = await client
            .from('places')
            .select(`
      *,
      place_features (feature),
      place_images (image_url)
    `);

        if (error) {
            return handleSupabaseError('Error fetching places', error, mockData.places);
        }

        // Transform the data to match our interface
        type PlaceRow = typeof data[number];
        return (data || []).map((place: PlaceRow) => ({
            ...place,
            features: place.place_features?.map((f: { feature: string }) => f.feature) || [],
            images: place.place_images?.map((i: { image_url: string }) => i.image_url) || []
        }));
    } catch (error) {
        return handleSupabaseError('Error fetching places', error, mockData.places);
    }
}

export async function getPlaceById(placeId: string): Promise<Place | undefined> {
    if (shouldUseMockData) return mockData.getPlaceById(placeId);
    const client = requireSupabaseClient();
    try {
        const { data, error } = await client
            .from('places')
            .select(`
      *,
      place_features (feature),
      place_images (image_url)
    `)
            .eq('place_id', placeId)
            .single();

        if (error) {
            return handleSupabaseError('Error fetching place', error, mockData.getPlaceById(placeId));
        }

        if (!data) return undefined;

        return {
            ...data,
            features: data.place_features?.map((f: { feature: string }) => f.feature) || [],
            images: data.place_images?.map((i: { image_url: string }) => i.image_url) || []
        };
    } catch (error) {
        return handleSupabaseError('Error fetching place', error, mockData.getPlaceById(placeId));
    }
}

// ============================================
// POST FUNCTIONS
// ============================================

export async function getPosts(): Promise<Post[]> {
    if (shouldUseMockData) return mockData.posts;
    const client = requireSupabaseClient();
    try {
        const { data, error } = await client
            .from('posts_with_rating')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return handleSupabaseError('Error fetching posts', error, mockData.posts);
        }

        const posts = (data ?? []) as PostRow[];
        const imagesByPostId = await getPostImages(posts.map((post) => post.post_id));

        return posts.map((post) => normalizePost(post, imagesByPostId));
    } catch (error) {
        return handleSupabaseError('Error fetching posts', error, mockData.posts);
    }
}

export async function getPostsByUserId(userId: string): Promise<Post[]> {
    if (shouldUseMockData) return mockData.getPostsByUserId(userId);
    const client = requireSupabaseClient();
    try {
        const { data, error } = await client
            .from('posts_with_rating')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            return handleSupabaseError(
                'Error fetching user posts',
                error,
                mockData.getPostsByUserId(userId),
            );
        }

        const posts = (data ?? []) as PostRow[];
        const imagesByPostId = await getPostImages(posts.map((post) => post.post_id));

        return posts.map((post) => normalizePost(post, imagesByPostId));
    } catch (error) {
        return handleSupabaseError(
            'Error fetching user posts',
            error,
            mockData.getPostsByUserId(userId),
        );
    }
}

export async function getPostById(postId: string): Promise<Post | undefined> {
    if (shouldUseMockData) return mockData.getPostById(postId);
    const client = requireSupabaseClient();
    try {
        const { data, error } = await client
            .from('posts_with_rating')
            .select('*')
            .eq('post_id', postId)
            .single();

        if (error) {
            return handleSupabaseError('Error fetching post', error, mockData.getPostById(postId));
        }

        if (!data) return undefined;

        const imagesByPostId = await getPostImages([postId]);
        return normalizePost(data as PostRow, imagesByPostId);
    } catch (error) {
        return handleSupabaseError('Error fetching post', error, mockData.getPostById(postId));
    }
}

// ============================================
// COMMENT FUNCTIONS
// ============================================

export async function getCommentsByPostId(postId: string): Promise<Comment[]> {
    if (shouldUseMockData) return mockData.getCommentsByPostId(postId);
    const client = requireSupabaseClient();
    try {
        const { data, error } = await client
            .from('comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (error) {
            return handleSupabaseError(
                'Error fetching comments',
                error,
                mockData.getCommentsByPostId(postId),
            );
        }
        return data || [];
    } catch (error) {
        return handleSupabaseError(
            'Error fetching comments',
            error,
            mockData.getCommentsByPostId(postId),
        );
    }
}

export async function getCommentsByPostIds(postIds: string[]): Promise<Record<string, Comment[]>> {
    if (postIds.length === 0) return {};
    if (shouldUseMockData) {
        const grouped: Record<string, Comment[]> = {};
        for (const postId of postIds) {
            grouped[postId] = mockData.getCommentsByPostId(postId);
        }
        return grouped;
    }

    try {
        const client = requireSupabaseClient();
        const { data, error } = await client
            .from('comments')
            .select('*')
            .in('post_id', postIds)
            .order('created_at', { ascending: true });

        if (error) {
            const grouped: Record<string, Comment[]> = {};
            for (const postId of postIds) {
                grouped[postId] = mockData.getCommentsByPostId(postId);
            }
            return handleSupabaseError('Error fetching comments', error, grouped);
        }

        return groupCommentsByPost((data ?? []) as CommentRow[]);
    } catch (error) {
        const grouped: Record<string, Comment[]> = {};
        for (const postId of postIds) {
            grouped[postId] = mockData.getCommentsByPostId(postId);
        }
        return handleSupabaseError('Error fetching comments', error, grouped);
    }
}

// ============================================
// FOLLOW FUNCTIONS
// ============================================

export async function getFollows(): Promise<Follow[]> {
    if (shouldUseMockData) return mockData.follows;
    const client = requireSupabaseClient();

    try {
        const { data, error } = await client.from('follows').select('*');
        if (error) {
            return handleSupabaseError('Error fetching follows', error, mockData.follows);
        }
        return data || [];
    } catch (error) {
        return handleSupabaseError('Error fetching follows', error, mockData.follows);
    }
}

// ============================================
// USER SUBTYPE FUNCTIONS
// ============================================

export async function getRegularUsers(): Promise<RegularUser[]> {
    if (shouldUseMockData) return mockData.regularUsers;
    const client = requireSupabaseClient();

    try {
        const { data, error } = await client.from('regular_users').select('*');
        if (error) {
            return handleSupabaseError(
                'Error fetching regular users',
                error,
                mockData.regularUsers,
            );
        }
        return data || [];
    } catch (error) {
        return handleSupabaseError(
            'Error fetching regular users',
            error,
            mockData.regularUsers,
        );
    }
}

export async function getModerators(): Promise<Moderator[]> {
    if (shouldUseMockData) return mockData.moderators;
    const client = requireSupabaseClient();

    try {
        const { data, error } = await client.from('moderators').select('*');
        if (error) {
            return handleSupabaseError('Error fetching moderators', error, mockData.moderators);
        }
        return data || [];
    } catch (error) {
        return handleSupabaseError('Error fetching moderators', error, mockData.moderators);
    }
}

export async function getAdmins(): Promise<Admin[]> {
    if (shouldUseMockData) return mockData.admins;
    const client = requireSupabaseClient();

    try {
        const { data, error } = await client.from('admins').select('*');
        if (error) {
            return handleSupabaseError('Error fetching admins', error, mockData.admins);
        }
        return data || [];
    } catch (error) {
        return handleSupabaseError('Error fetching admins', error, mockData.admins);
    }
}

// ============================================
// COMPANION REQUEST FUNCTIONS
// ============================================

export async function getCompanionRequests(): Promise<CompanionRequest[]> {
    if (shouldUseMockData) return mockData.companionRequests;
    const client = requireSupabaseClient();
    try {
        const { data, error } = await client
            .from('companion_requests')
            .select(`
      *,
      request_conditions (condition)
    `)
            .order('created_at', { ascending: false });

        if (error) {
            return handleSupabaseError(
                'Error fetching companion requests',
                error,
                mockData.companionRequests,
            );
        }

        return (data || []).map(request => ({
            ...request,
            conditions: request.request_conditions?.map((c: { condition: string }) => c.condition) || []
        }));
    } catch (error) {
        return handleSupabaseError(
            'Error fetching companion requests',
            error,
            mockData.companionRequests,
        );
    }
}

export async function getRequestsByUserId(userId: string): Promise<CompanionRequest[]> {
    if (shouldUseMockData) return mockData.getRequestsByUserId(userId);
    const client = requireSupabaseClient();
    try {
        const { data, error } = await client
            .from('companion_requests')
            .select(`
      *,
      request_conditions (condition)
    `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            return handleSupabaseError(
                'Error fetching user requests',
                error,
                mockData.getRequestsByUserId(userId),
            );
        }

        return (data || []).map(request => ({
            ...request,
            conditions: request.request_conditions?.map((c: { condition: string }) => c.condition) || []
        }));
    } catch (error) {
        return handleSupabaseError(
            'Error fetching user requests',
            error,
            mockData.getRequestsByUserId(userId),
        );
    }
}

// ============================================
// COMPANION MATCH FUNCTIONS
// ============================================

export async function getCompanionMatches(): Promise<CompanionMatch[]> {
    if (shouldUseMockData) return mockData.companionMatches;
    const client = requireSupabaseClient();

    try {
        const { data, error } = await client
            .from('companion_matches')
            .select('*');

        if (error) {
            return handleSupabaseError('Error fetching matches', error, mockData.companionMatches);
        }
        return data || [];
    } catch (error) {
        return handleSupabaseError('Error fetching matches', error, mockData.companionMatches);
    }
}

export async function getMatchesByRequestId(requestId: string): Promise<CompanionMatch[]> {
    if (shouldUseMockData) return mockData.getMatchesByRequestId(requestId);
    const client = requireSupabaseClient();

    try {
        const { data, error } = await client
            .from('companion_matches')
            .select('*')
            .eq('request_id', requestId);

        if (error) {
            return handleSupabaseError(
                'Error fetching matches',
                error,
                mockData.getMatchesByRequestId(requestId),
            );
        }
        return data || [];
    } catch (error) {
        return handleSupabaseError(
            'Error fetching matches',
            error,
            mockData.getMatchesByRequestId(requestId),
        );
    }
}

// ============================================
// EXPORT MOCK DATA FOR BACKWARD COMPATIBILITY
// ============================================

// Mock-only exports for any legacy imports (empty outside mock mode).
export const users: User[] = shouldUseMockData ? mockData.users : [];
export const profiles: Profile[] = shouldUseMockData ? mockData.profiles : [];
export const cities: City[] = shouldUseMockData ? filterVisibleCities(mockData.cities) : [];
export const places: Place[] = shouldUseMockData ? mockData.places : [];
export const posts: Post[] = shouldUseMockData ? mockData.posts : [];
export const comments: Comment[] = shouldUseMockData ? mockData.comments : [];
export const companionRequests: CompanionRequest[] = shouldUseMockData ? mockData.companionRequests : [];
export const companionMatches: CompanionMatch[] = shouldUseMockData ? mockData.companionMatches : [];
export const regularUsers: RegularUser[] = shouldUseMockData ? mockData.regularUsers : [];
export const moderators: Moderator[] = shouldUseMockData ? mockData.moderators : [];
export const admins: Admin[] = shouldUseMockData ? mockData.admins : [];
