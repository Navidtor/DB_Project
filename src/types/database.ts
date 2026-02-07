// Database Types for Hamsafar Mirza - Based on Phase 2 Logical Design

// User Types
export type UserType = 'regular' | 'moderator' | 'admin';

export interface User {
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

export interface RegularUser {
  user_id: string;
  travel_preferences: string[];
  experience_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface Moderator {
  user_id: string;
  assigned_regions: string[];
  approval_count: number;
}

export interface Admin {
  user_id: string;
  access_level: number;
  last_admin_action?: string;
}

// Profile
export interface Profile {
  profile_id: string;
  user_id: string;
  bio?: string;
  cover_image?: string;
  interests: string[];
  followers_count: number; // Derived
  following_count: number; // Derived
}

// Location Types
export interface City {
  city_id: string;
  name: string;
  description?: string;
  province?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  image?: string;
}

export interface Place {
  place_id: string;
  city_id: string;
  name: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  map_url?: string;
  features: string[];
  images: string[];
}

// Content Types
export type ExperienceType = 'visited' | 'imagined';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Post {
  post_id: string;
  user_id: string;
  place_id?: string;
  city_id?: string;
  title: string;
  content: string;
  experience_type: ExperienceType;
  approval_status: ApprovalStatus;
  created_at: string;
  images: string[];
  avg_rating: number; // Derived
  rating_count: number; // Derived
}

export interface Comment {
  comment_id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface Rating {
  user_id: string;
  post_id: string;
  score: 1 | 2 | 3 | 4 | 5;
  created_at: string;
}

// Social Types
export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

// Companion Types
export type RequestStatus = 'active' | 'completed' | 'cancelled';
export type MatchStatus = 'pending' | 'accepted' | 'rejected';

export interface CompanionRequest {
  request_id: string;
  user_id: string;
  destination_place_id?: string;
  destination_city_id?: string;
  travel_date: string;
  description?: string;
  status: RequestStatus;
  created_at: string;
  conditions: string[];
}

export interface CompanionMatch {
  match_id: string;
  request_id: string;
  companion_user_id: string;
  status: MatchStatus;
  message?: string;
  created_at: string;
}

// Extended types with relations for UI
export interface UserWithProfile extends User {
  profile?: Profile;
  regular_user?: RegularUser;
  moderator?: Moderator;
  admin?: Admin;
}

export interface PostWithDetails extends Post {
  user?: User;
  place?: Place;
  city?: City;
  comments?: Comment[];
}

export interface CompanionRequestWithDetails extends CompanionRequest {
  user?: User;
  destination_place?: Place;
  destination_city?: City;
  matches?: CompanionMatchWithUser[];
}

export interface CompanionMatchWithUser extends CompanionMatch {
  companion_user?: User;
}
