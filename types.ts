// TMDB Data Types
export interface Movie {
  id: number;
  title: string;
  poster_path: string;
  overview: string;
  vote_average: number;
  release_date: string;
}

// Supabase Database Types
export interface Profile {
  id: string; // UUID from auth.users
  username: string;
  avatar_url?: string;
  bio?: string;
  vitap_reg_no?: string; // Optional: To verify student status
}

export enum ListType {
  WATCHED = 'watched',
  WATCHLIST = 'watchlist',
  FAVORITE = 'favorite'
}

export interface UserListEntry {
  id: number;
  user_id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  list_type: ListType;
  added_at: string;
}

// Chat System Types
export enum RoomType {
  PUBLIC = 'public',
  ANONYMOUS = 'anonymous',
  PRIVATE = 'private' // DM
}

export interface ChatRoom {
  id: string;
  name: string;
  type: RoomType;
  description?: string;
  active_users: number;
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string; // The real user ID (kept for moderation/blocking even in anon)
  content: string;
  created_at: string;
  
  // Dual Identity Logic
  is_anonymous: boolean;
  display_name: string; // Either real username or "Anonymous Fox"
  display_avatar?: string; // Real avatar or generated color/icon
}