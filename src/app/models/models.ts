// src/app/models/models.ts

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface TargetGroup {
  id: number;
  name: string;
}

export interface Location {
  id: number;
  name: string;
  description: string;
  city: string;
  image?: string;
  created_at: string;
  category: number;
  category_name?: string;
  target_group?: number;
  target_group_name?: string;
  created_by?: number;
  created_by_username?: string;
  reviews_count?: number;
  average_rating?: number;
}

export interface Review {
  id: number;
  text: string;
  rating: number;
  created_at: string;
  user: number;
  username?: string;
  location: number;
  location_name?: string;
}

export interface Favorite {
  id: number;
  user: number;
  location: number;
  location_name?: string;
  location_city?: string;
  location_image?: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  password2: string;
  is_admin?: boolean;
}

export interface LocationPayload {
  name: string;
  description: string;
  city: string;
  category_id: number;
  target_group_id?: number | null;
}

export interface ReviewPayload {
  text: string;
  rating: number;
  location: number;
}
