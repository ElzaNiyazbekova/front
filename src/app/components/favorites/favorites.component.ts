// src/app/components/favorites/favorites.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LocationService } from '../../services/location.service';
import { AuthService } from '../../services/auth.service';
import { Favorite } from '../../models/models';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css'],
})
export class FavoritesComponent implements OnInit {
  favorites: Favorite[] = [];
  loading = false;
  errorMessage = '';
  removingId: number | null = null;

  constructor(
    private locationService: LocationService,
    public auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFavorites();
  }

  loadFavorites(): void {
    this.loading = true;
    this.errorMessage = '';
    this.locationService.getFavorites().subscribe({
      next: (favs) => {
        this.favorites = favs;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Could not load your favourites. Please try again.';
      }
    });
  }

  // (click) event — navigate to location
  viewLocation(locationId: number): void {
    this.router.navigate(['/locations', locationId]);
  }

  // (click) event — remove from favorites
  removeFavorite(fav: Favorite, event: Event): void {
    event.stopPropagation();
    this.removingId = fav.id;
    this.locationService.removeFavorite(fav.location).subscribe({
      next: () => {
        this.favorites = this.favorites.filter(f => f.id !== fav.id);
        this.removingId = null;
      },
      error: () => {
        this.errorMessage = 'Could not remove favourite.';
        this.removingId = null;
      }
    });
  }
}
