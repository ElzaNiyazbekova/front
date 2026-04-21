// src/app/components/location-form/location-form.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LocationService } from '../../services/location.service';
import { Category, TargetGroup, Location } from '../../models/models';

@Component({
  selector: 'app-location-form',
  templateUrl: './location-form.component.html',
  styleUrls: ['./location-form.component.css'],
})
export class LocationFormComponent implements OnInit {
  // Edit mode
  editId: number | null = null;
  isEditMode = false;

  // [(ngModel)] form controls
  name = '';
  description = '';
  city = '';
  categoryId: number | '' = '';
  targetGroupId: number | '' = '';

  selectedFile: File | null = null;

  categories: Category[] = [];
  targetGroups: TargetGroup[] = [];

  loading = false;
  saving = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private locationService: LocationService
  ) {}

  ngOnInit(): void {
    // Load reference data
    this.locationService.getCategories().subscribe(c => this.categories = c);
    this.locationService.getTargetGroups().subscribe(tg => this.targetGroups = tg);

    // Check if edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = Number(id);
      this.isEditMode = true;
      this.loading = true;
      this.locationService.getLocation(this.editId).subscribe({
        next: (loc: Location) => {
          this.name = loc.name;
          this.description = loc.description;
          this.city = loc.city;
          this.categoryId = loc.category;
          this.targetGroupId = loc.target_group ?? '';
          this.loading = false;
        },
        error: () => {
          this.errorMessage = 'Failed to load location data.';
          this.loading = false;
        }
      });
    }
  }

  isValid(): boolean {
    return !!(this.name.trim() && this.description.trim() && this.city && this.categoryId);
  }

  // (click) event — save location (create or update)
  onSave(): void {
    this.errorMessage = '';
    if (!this.isValid()) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    const formData = new FormData();
    formData.append('name', this.name.trim());
    formData.append('description', this.description.trim());
    formData.append('city', this.city);
    formData.append('category_id', String(this.categoryId));
    if (this.targetGroupId) {
      formData.append('target_group_id', String(this.targetGroupId));
    }
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.saving = true;

    const request$ = this.isEditMode && this.editId
      ? this.locationService.updateLocation(this.editId, formData)
      : this.locationService.createLocation(formData);

    request$.subscribe({
      next: (loc) => {
        this.saving = false;
        this.router.navigate(['/locations', loc.id]);
      },
      error: (err) => {
        this.saving = false;
        const e = err.error;
        if (typeof e === 'object') {
          this.errorMessage = Object.entries(e)
            .map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`)
            .join(' | ');
        } else {
          this.errorMessage = 'Failed to save location. Please try again.';
        }
      }
    });
  }

  // File selection handler
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  // (click) event — cancel
  onCancel(): void {
    if (this.isEditMode && this.editId) {
      this.router.navigate(['/locations', this.editId]);
    } else {
      this.router.navigate(['/locations']);
    }
  }
}
