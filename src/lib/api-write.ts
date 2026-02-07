// API Write Operations - Create, Update, Delete
// This file contains all write operations for the database

import { supabase, shouldUseMockData } from './supabase';
import * as mockData from '../data/mockData';
import type {
  Post,
  Comment,
  CompanionRequest,
  CompanionMatch,
  Profile,
  ExperienceType,
} from '../types/database';

// ============================================
// POST OPERATIONS
// ============================================

export interface CreatePostData {
  user_id: string;
  title: string;
  content: string;
  experience_type: ExperienceType;
  place_id?: string;
  city_id?: string;
  images: string[];
}

export async function createPost(data: CreatePostData): Promise<{ post: Post | null; error: Error | null }> {
  if (shouldUseMockData) {
    // Mock mode - add to local array (won't persist)
    const newPost: Post = {
      post_id: `post-${Date.now()}`,
      user_id: data.user_id,
      place_id: data.place_id,
      city_id: data.city_id,
      title: data.title,
      content: data.content,
      experience_type: data.experience_type,
      approval_status: 'pending',
      created_at: new Date().toISOString(),
      images: data.images,
      avg_rating: 0,
      rating_count: 0,
    };
    mockData.posts.unshift(newPost);
    return { post: newPost, error: null };
  }

  try {
    // Insert post
    const { data: postData, error: postError } = await supabase!
      .from('posts')
      .insert({
        user_id: data.user_id,
        place_id: data.place_id || null,
        city_id: data.city_id || null,
        title: data.title,
        content: data.content,
        experience_type: data.experience_type,
        approval_status: 'pending',
      })
      .select()
      .single();

    if (postError) throw postError;

    // Insert images
    if (data.images.length > 0) {
      const { error: imagesError } = await supabase!
        .from('post_images')
        .insert(data.images.map(url => ({
          post_id: postData.post_id,
          image_url: url,
        })));

      if (imagesError) throw imagesError;
    }

    return {
      post: {
        ...postData,
        images: data.images,
        avg_rating: 0,
        rating_count: 0,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error creating post:', error);
    return { post: null, error: error as Error };
  }
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  experience_type?: ExperienceType;
  place_id?: string;
  city_id?: string;
  images?: string[];
}

export async function updatePost(
  postId: string,
  data: UpdatePostData
): Promise<{ error: Error | null }> {
  if (shouldUseMockData) {
    const postIndex = mockData.posts.findIndex(p => p.post_id === postId);
    if (postIndex !== -1) {
      mockData.posts[postIndex] = { ...mockData.posts[postIndex], ...data };
    }
    return { error: null };
  }

  try {
    const { error: postError } = await supabase!
      .from('posts')
      .update({
        title: data.title,
        content: data.content,
        experience_type: data.experience_type,
        place_id: data.place_id || null,
        city_id: data.city_id || null,
      })
      .eq('post_id', postId);

    if (postError) throw postError;

    // Update images if provided
    if (data.images) {
      // Delete existing images
      const { error: deleteError } = await supabase!.from('post_images').delete().eq('post_id', postId);
      if (deleteError) throw deleteError;

      // Insert new images
      if (data.images.length > 0) {
        const { error: insertError } = await supabase!.from('post_images').insert(
          data.images.map(url => ({
            post_id: postId,
            image_url: url,
          }))
        );
        if (insertError) throw insertError;
      }
    }

    return { error: null };
  } catch (error) {
    console.error('Error updating post:', error);
    return { error: error as Error };
  }
}

export async function deletePost(postId: string): Promise<{ error: Error | null }> {
  if (shouldUseMockData) {
    const index = mockData.posts.findIndex(p => p.post_id === postId);
    if (index !== -1) {
      mockData.posts.splice(index, 1);
    }
    return { error: null };
  }

  try {
    const { error } = await supabase!.from('posts').delete().eq('post_id', postId);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting post:', error);
    return { error: error as Error };
  }
}

// ============================================
// COMMENT OPERATIONS
// ============================================

export interface CreateCommentData {
  post_id: string;
  user_id: string;
  content: string;
}

export async function createComment(data: CreateCommentData): Promise<{ comment: Comment | null; error: Error | null }> {
  if (shouldUseMockData) {
    const newComment: Comment = {
      comment_id: `comment-${Date.now()}`,
      post_id: data.post_id,
      user_id: data.user_id,
      content: data.content,
      created_at: new Date().toISOString(),
    };
    mockData.comments.push(newComment);
    return { comment: newComment, error: null };
  }

  try {
    const { data: commentData, error } = await supabase!
      .from('comments')
      .insert({
        post_id: data.post_id,
        user_id: data.user_id,
        content: data.content,
      })
      .select()
      .single();

    if (error) throw error;
    return { comment: commentData, error: null };
  } catch (error) {
    console.error('Error creating comment:', error);
    return { comment: null, error: error as Error };
  }
}

export async function deleteComment(commentId: string): Promise<{ error: Error | null }> {
  if (shouldUseMockData) {
    const index = mockData.comments.findIndex(c => c.comment_id === commentId);
    if (index !== -1) {
      mockData.comments.splice(index, 1);
    }
    return { error: null };
  }

  try {
    const { error } = await supabase!.from('comments').delete().eq('comment_id', commentId);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return { error: error as Error };
  }
}

// ============================================
// RATING OPERATIONS
// ============================================

export async function createOrUpdateRating(
  userId: string,
  postId: string,
  score: number
): Promise<{ error: Error | null }> {
  if (shouldUseMockData) {
    const existingIndex = mockData.ratings.findIndex(
      r => r.user_id === userId && r.post_id === postId
    );
    if (existingIndex !== -1) {
      mockData.ratings[existingIndex].score = score as 1 | 2 | 3 | 4 | 5;
    } else {
      mockData.ratings.push({
        user_id: userId,
        post_id: postId,
        score: score as 1 | 2 | 3 | 4 | 5,
        created_at: new Date().toISOString(),
      });
    }
    return { error: null };
  }

  try {
    const { error } = await supabase!
      .from('ratings')
      .upsert({
        user_id: userId,
        post_id: postId,
        score,
      }, {
        onConflict: 'user_id,post_id',
      });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error creating/updating rating:', error);
    return { error: error as Error };
  }
}

// ============================================
// FOLLOW OPERATIONS
// ============================================

export async function followUser(followerId: string, followingId: string): Promise<{ error: Error | null }> {
  if (followerId === followingId) {
    return { error: new Error('Cannot follow yourself') };
  }

  if (shouldUseMockData) {
    const exists = mockData.follows.some(
      f => f.follower_id === followerId && f.following_id === followingId
    );
    if (!exists) {
      mockData.follows.push({
        follower_id: followerId,
        following_id: followingId,
        created_at: new Date().toISOString(),
      });
    }
    return { error: null };
  }

  try {
    const { error } = await supabase!.from('follows').insert({
      follower_id: followerId,
      following_id: followingId,
    });

    if (error && error.code !== '23505') throw error; // Ignore duplicate key error
    return { error: null };
  } catch (error) {
    console.error('Error following user:', error);
    return { error: error as Error };
  }
}

export async function unfollowUser(followerId: string, followingId: string): Promise<{ error: Error | null }> {
  if (shouldUseMockData) {
    const index = mockData.follows.findIndex(
      f => f.follower_id === followerId && f.following_id === followingId
    );
    if (index !== -1) {
      mockData.follows.splice(index, 1);
    }
    return { error: null };
  }

  try {
    const { error } = await supabase!
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return { error: error as Error };
  }
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  if (shouldUseMockData) {
    return mockData.follows.some(
      f => f.follower_id === followerId && f.following_id === followingId
    );
  }

  try {
    const { data, error } = await supabase!
      .from('follows')
      .select('follower_id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
}

// ============================================
// COMPANION REQUEST OPERATIONS
// ============================================

export interface CreateCompanionRequestData {
  user_id: string;
  destination_place_id?: string;
  destination_city_id?: string;
  travel_date: string;
  description: string;
  conditions: string[];
}

export async function createCompanionRequest(
  data: CreateCompanionRequestData
): Promise<{ request: CompanionRequest | null; error: Error | null }> {
  if (shouldUseMockData) {
    const newRequest: CompanionRequest = {
      request_id: `request-${Date.now()}`,
      user_id: data.user_id,
      destination_place_id: data.destination_place_id,
      destination_city_id: data.destination_city_id,
      travel_date: data.travel_date,
      description: data.description,
      status: 'active',
      created_at: new Date().toISOString(),
      conditions: data.conditions,
    };
    mockData.companionRequests.unshift(newRequest);
    return { request: newRequest, error: null };
  }

  try {
    // Insert request
    const { data: requestData, error: requestError } = await supabase!
      .from('companion_requests')
      .insert({
        user_id: data.user_id,
        destination_place_id: data.destination_place_id || null,
        destination_city_id: data.destination_city_id || null,
        travel_date: data.travel_date,
        description: data.description,
        status: 'active',
      })
      .select()
      .single();

    if (requestError) throw requestError;

    // Insert conditions
    if (data.conditions.length > 0) {
      const { error: conditionsError } = await supabase!.from('request_conditions').insert(
        data.conditions.map(condition => ({
          request_id: requestData.request_id,
          condition,
        }))
      );
      if (conditionsError) throw conditionsError;
    }

    return {
      request: { ...requestData, conditions: data.conditions },
      error: null,
    };
  } catch (error) {
    console.error('Error creating companion request:', error);
    return { request: null, error: error as Error };
  }
}

export async function updateCompanionRequestStatus(
  requestId: string,
  status: 'active' | 'completed' | 'cancelled'
): Promise<{ error: Error | null }> {
  if (shouldUseMockData) {
    const request = mockData.companionRequests.find(r => r.request_id === requestId);
    if (request) {
      request.status = status;
    }
    return { error: null };
  }

  try {
    const { error } = await supabase!
      .from('companion_requests')
      .update({ status })
      .eq('request_id', requestId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error updating request status:', error);
    return { error: error as Error };
  }
}

// ============================================
// COMPANION MATCH OPERATIONS
// ============================================

export interface CreateCompanionMatchData {
  request_id: string;
  companion_user_id: string;
  message: string;
}

export async function createCompanionMatch(
  data: CreateCompanionMatchData
): Promise<{ match: CompanionMatch | null; error: Error | null }> {
  if (shouldUseMockData) {
    const newMatch: CompanionMatch = {
      match_id: `match-${Date.now()}`,
      request_id: data.request_id,
      companion_user_id: data.companion_user_id,
      status: 'pending',
      message: data.message,
      created_at: new Date().toISOString(),
    };
    mockData.companionMatches.push(newMatch);
    return { match: newMatch, error: null };
  }

  try {
    const { data: matchData, error } = await supabase!
      .from('companion_matches')
      .insert({
        request_id: data.request_id,
        companion_user_id: data.companion_user_id,
        message: data.message,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return { match: matchData, error: null };
  } catch (error) {
    console.error('Error creating companion match:', error);
    return { match: null, error: error as Error };
  }
}

export async function updateCompanionMatchStatus(
  matchId: string,
  status: 'pending' | 'accepted' | 'rejected'
): Promise<{ error: Error | null }> {
  if (shouldUseMockData) {
    const match = mockData.companionMatches.find(m => m.match_id === matchId);
    if (match) {
      match.status = status;
    }
    return { error: null };
  }

  try {
    const { error } = await supabase!
      .from('companion_matches')
      .update({ status })
      .eq('match_id', matchId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error updating match status:', error);
    return { error: error as Error };
  }
}

// ============================================
// PROFILE OPERATIONS
// ============================================

export interface UpdateProfileData {
  bio?: string;
  cover_image?: string;
  interests?: string[];
}

export async function updateProfile(
  userId: string,
  profileId: string,
  data: UpdateProfileData
): Promise<{ error: Error | null }> {
  if (shouldUseMockData) {
    const profile = mockData.profiles.find(p => p.user_id === userId);
    if (profile) {
      if (data.bio !== undefined) profile.bio = data.bio;
      if (data.cover_image !== undefined) profile.cover_image = data.cover_image;
      if (data.interests !== undefined) profile.interests = data.interests;
    }
    return { error: null };
  }

  try {
    // Update profile
    const { error: profileError } = await supabase!
      .from('profiles')
      .update({
        bio: data.bio,
        cover_image: data.cover_image,
      })
      .eq('user_id', userId);

    if (profileError) throw profileError;

    // Update interests if provided
    if (data.interests) {
      // Delete existing
      const { error: deleteError } = await supabase!.from('profile_interests').delete().eq('profile_id', profileId);
      if (deleteError) throw deleteError;

      // Insert new
      if (data.interests.length > 0) {
        const { error: insertError } = await supabase!.from('profile_interests').insert(
          data.interests.map(interest => ({
            profile_id: profileId,
            interest,
          }))
        );
        if (insertError) throw insertError;
      }
    }

    return { error: null };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { error: error as Error };
  }
}
