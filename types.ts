
// TMDB Data Types
export interface Movie {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path?: string; // High res horizontal image
  overview: string;
  vote_average: number;
  release_date: string;
}

// Supabase Database Types
export interface Profile {
  id: string; // UUID
  username: string;
  avatar_url?: string;
  watched_count?: number;
}

export interface LibraryItem {
  id: string;
  user_id: string;
  movie_id: number;
  status: 'watched' | 'watchlist';
  created_at: string;
}

// Chat System Types
export enum RoomType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  MATCH = 'match'
}

export interface ChatRoom {
  id: string;
  name?: string; // Null for private matches
  type: RoomType;
  active_users?: number; // Frontend calculated
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  
  // Display Logic
  is_anonymous: boolean;
  fake_username?: string;
  
  // Joins
  profiles?: Profile | null;
}

export interface MatchQueueEntry {
    user_id: string;
    created_at: string;
}