// src/app/components/reviews/reviews.component.ts
import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { LocationService } from '../../services/location.service';
import { Review } from '../../models/models';

@Component({
  selector: 'app-reviews',
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.css'],
})
export class ReviewsComponent implements OnChanges {
  @Input() locationId!: number;
  @Input() reviews: Review[] = [];
  @Input() currentUserId?: number;
  @Output() reviewAdded = new EventEmitter<Review>();
  @Output() reviewDeleted = new EventEmitter<number>();

  // [(ngModel)] form controls
  newText = '';
  newRating = 5;

  submitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(private locationService: LocationService) {}

  ngOnChanges(): void {}

  getStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  setRating(val: number): void {
    this.newRating = val;
  }

  // (click) event — submit review
  submitReview(): void {
    this.errorMessage = '';
    this.successMessage = '';
    if (!this.newText.trim()) {
      this.errorMessage = 'Please write something in your review.';
      return;
    }
    this.submitting = true;
    this.locationService.createReview({
      text: this.newText,
      rating: this.newRating,
      location: this.locationId,
    }).subscribe({
      next: (review) => {
        this.submitting = false;
        this.newText = '';
        this.newRating = 5;
        this.successMessage = 'Review posted!';
        this.reviewAdded.emit(review);
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.submitting = false;
        const e = err.error;
        if (e?.non_field_errors) {
          this.errorMessage = e.non_field_errors[0];
        } else if (typeof e === 'object') {
          this.errorMessage = Object.values(e).flat().join(' ');
        } else {
          this.errorMessage = 'Could not post review.';
        }
      },
    });
  }

  // (click) event — delete review
  deleteReview(reviewId: number): void {
    this.locationService.deleteReview(reviewId).subscribe({
      next: () => this.reviewDeleted.emit(reviewId),
      error: () => { this.errorMessage = 'Could not delete review.'; }
    });
  }

  canDelete(review: Review): boolean {
    return this.currentUserId === review.user;
  }
}
