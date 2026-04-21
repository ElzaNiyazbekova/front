// src/app/services/location.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Location, LocationPayload,
  Category, TargetGroup,
  Review, ReviewPayload,
  Favorite
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private api = 'http://localhost:8000/api';
  private mediaBase = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  private toAbsoluteUrl(url?: string | null): string | undefined {
    if (!url) return undefined;
    if (/^https?:\/\//i.test(url)) return url;
    return `${this.mediaBase}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  private normalizeLocation(location: any): Location {
    return {
      id: location.id,
      name: location.name,
      description: location.description,
      city: location.city,
      image: this.toAbsoluteUrl(location.image),
      created_at: location.created_at,
      category: typeof location.category === 'object' ? location.category?.id : location.category,
      category_name: typeof location.category === 'object' ? location.category?.name : location.category_name,
      target_group: typeof location.target_group === 'object' ? location.target_group?.id : location.target_group,
      target_group_name: typeof location.target_group === 'object' ? location.target_group?.name : location.target_group_name,
      created_by: typeof location.created_by === 'object' ? location.created_by?.id : location.created_by,
      created_by_username: typeof location.created_by === 'object' ? location.created_by?.username : location.created_by_username,
      reviews_count: location.review_count ?? location.reviews_count,
      average_rating: location.rating ?? location.average_rating,
    };
  }

  private normalizeReview(review: any): Review {
    return {
      id: review.id,
      text: review.text,
      rating: review.rating,
      created_at: review.created_at,
      user: typeof review.user === 'object' ? review.user?.id : review.user,
      username: typeof review.user === 'object' ? review.user?.username : review.username,
      location: typeof review.location === 'object' ? review.location?.id : review.location,
      location_name: typeof review.location === 'object' ? review.location?.name : review.location_name,
    };
  }

  private normalizeFavorite(favorite: any): Favorite {
    const location = favorite.location;
    return {
      id: favorite.id,
      user: typeof favorite.user === 'object' ? favorite.user?.id : favorite.user,
      location: typeof location === 'object' ? location?.id : location,
      location_name: typeof location === 'object' ? location?.name : favorite.location_name,
      location_city: typeof location === 'object' ? location?.city : favorite.location_city,
      location_image: typeof location === 'object' ? this.toAbsoluteUrl(location?.image) : this.toAbsoluteUrl(favorite.location_image),
    };
  }

  // ── Locations ──────────────────────────────────────────────

  getLocations(filters?: { category?: string; target_group?: string }): Observable<Location[]> {
    let params = new HttpParams();
    if (filters?.category) params = params.set('category', filters.category);
    if (filters?.target_group) params = params.set('target_group', filters.target_group);
    return this.http
      .get<any[]>(`${this.api}/locations/`, { params })
      .pipe(map(locations => locations.map(location => this.normalizeLocation(location))));
  }

  getLocation(id: number): Observable<Location> {
    return this.http
      .get<any>(`${this.api}/locations/${id}/`)
      .pipe(map(location => this.normalizeLocation(location)));
  }

  createLocation(payload: LocationPayload | FormData): Observable<Location> {
    return this.http
      .post<any>(`${this.api}/locations/`, payload)
      .pipe(map(location => this.normalizeLocation(location)));
  }

  updateLocation(id: number, payload: Partial<LocationPayload> | FormData): Observable<Location> {
    return this.http
      .put<any>(`${this.api}/locations/${id}/`, payload)
      .pipe(map(location => this.normalizeLocation(location)));
  }

  deleteLocation(id: number): Observable<any> {
    return this.http.delete(`${this.api}/locations/${id}/`);
  }

  // ── Categories & Target Groups ─────────────────────────────

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.api}/categories/`);
  }

  getTargetGroups(): Observable<TargetGroup[]> {
    return this.http.get<TargetGroup[]>(`${this.api}/target-groups/`);
  }

  // ── Reviews ────────────────────────────────────────────────

  getReviews(locationId: number): Observable<Review[]> {
    const params = new HttpParams().set('location_id', locationId.toString());
    return this.http
      .get<any[]>(`${this.api}/reviews/`, { params })
      .pipe(map(reviews => reviews.map(review => this.normalizeReview(review))));
  }

  createReview(payload: ReviewPayload): Observable<Review> {
    return this.http
      .post<any>(`${this.api}/reviews/`, payload)
      .pipe(map(review => this.normalizeReview(review)));
  }

  deleteReview(id: number): Observable<any> {
    return this.http.delete(`${this.api}/reviews/${id}/`);
  }

  // ── Favorites ──────────────────────────────────────────────

  getFavorites(): Observable<Favorite[]> {
    return this.http
      .get<any[]>(`${this.api}/favorites/`)
      .pipe(map(favorites => favorites.map(favorite => this.normalizeFavorite(favorite))));
  }

  addFavorite(locationId: number): Observable<Favorite> {
    return this.http
      .post<any>(`${this.api}/favorites/`, { location_id: locationId })
      .pipe(map(favorite => this.normalizeFavorite(favorite)));
  }

  removeFavorite(locationId: number): Observable<any> {
    return this.http.delete(`${this.api}/favorites/`, { body: { location_id: locationId } });
  }
}
