// src/app/components/location-detail/location-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LocationService } from '../../services/location.service';
import { AuthService } from '../../services/auth.service';
import { Location, Review, Favorite } from '../../models/models';

@Component({
  selector: 'app-location-detail',
  templateUrl: './location-detail.component.html',
  styleUrls: ['./location-detail.component.css'],
})
export class LocationDetailComponent implements OnInit {
  location: Location | null = null;
  reviews: Review[] = [];
  isFavorited = false;
  loading = true;
  errorMessage = '';
  deleteConfirm = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private locationService: LocationService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadLocation(id);
    this.loadReviews(id);
    if (this.auth.isLoggedIn) this.checkFavorite(id);
  }

  loadLocation(id: number): void {
    this.locationService.getLocation(id).subscribe({
      next: (loc) => { this.location = loc; this.loading = false; },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Location not found.';
      },
    });
  }

  loadReviews(id: number): void {
    this.locationService.getReviews(id).subscribe({
      next: (r) => this.reviews = r,
      error: () => {}
    });
  }

  checkFavorite(locationId: number): void {
    this.locationService.getFavorites().subscribe({
      next: (favs: Favorite[]) => {
        this.isFavorited = favs.some(f => f.location === locationId);
      },
      error: () => {}
    });
  }

  // (click) event #8 — toggle favorite
  toggleFavorite(): void {
    if (!this.location) return;
    if (this.isFavorited) {
      this.locationService.removeFavorite(this.location.id).subscribe({
        next: () => { this.isFavorited = false; },
        error: () => { this.errorMessage = 'Could not remove favourite.'; }
      });
    } else {
      this.locationService.addFavorite(this.location.id).subscribe({
        next: () => { this.isFavorited = true; },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Could not add favourite.';
        }
      });
    }
  }

  // (click) event #9 — delete location
  deleteLocation(): void {
    if (!this.location) return;
    if (!this.deleteConfirm) { this.deleteConfirm = true; return; }
    this.locationService.deleteLocation(this.location.id).subscribe({
      next: () => this.router.navigate(['/locations']),
      error: (err) => {
        this.errorMessage = err.error?.error || 'Could not delete location.';
        this.deleteConfirm = false;
      }
    });
  }

  onReviewAdded(review: Review): void {
    this.reviews = [review, ...this.reviews];
  }

  onReviewDeleted(reviewId: number): void {
    this.reviews = this.reviews.filter(r => r.id !== reviewId);
  }

  getStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  get isOwner(): boolean {
    return !!this.auth.currentUser &&
      this.location?.created_by === this.auth.currentUser.id;
  }

  get averageRating(): string {
    if (!this.reviews.length) return '—';
    const avg = this.reviews.reduce((s, r) => s + r.rating, 0) / this.reviews.length;
    return avg.toFixed(1);
  }
}
