// src/app/services/location.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Location, LocationPayload,
  Category, TargetGroup,
  Review, ReviewPayload,
  Favorite
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private api = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  // ── Locations ──────────────────────────────────────────────

  getLocations(filters?: { category?: string; target_group?: string }): Observable<Location[]> {
    let params = new HttpParams();
    if (filters?.category) params = params.set('category', filters.category);
    if (filters?.target_group) params = params.set('target_group', filters.target_group);
    return this.http.get<Location[]>(`${this.api}/locations/`, { params });
  }

  getLocation(id: number): Observable<Location> {
    return this.http.get<Location>(`${this.api}/locations/${id}/`);
  }

  createLocation(payload: LocationPayload | FormData): Observable<Location> {
    return this.http.post<Location>(`${this.api}/locations/`, payload);
  }

  updateLocation(id: number, payload: Partial<LocationPayload> | FormData): Observable<Location> {
    return this.http.put<Location>(`${this.api}/locations/${id}/`, payload);
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
    return this.http.get<Review[]>(`${this.api}/reviews/`, { params });
  }

  createReview(payload: ReviewPayload): Observable<Review> {
    return this.http.post<Review>(`${this.api}/reviews/`, payload);
  }

  deleteReview(id: number): Observable<any> {
    return this.http.delete(`${this.api}/reviews/${id}/`);
  }

  // ── Favorites ──────────────────────────────────────────────

  getFavorites(): Observable<Favorite[]> {
    return this.http.get<Favorite[]>(`${this.api}/favorites/`);
  }

  addFavorite(locationId: number): Observable<Favorite> {
    return this.http.post<Favorite>(`${this.api}/favorites/`, { location_id: locationId });
  }

  removeFavorite(locationId: number): Observable<any> {
    return this.http.delete(`${this.api}/favorites/`, { body: { location_id: locationId } });
  }
}
