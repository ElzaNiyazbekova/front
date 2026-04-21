// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { LocationsComponent } from './components/locations/locations.component';
import { LocationDetailComponent } from './components/location-detail/location-detail.component';
import { LocationFormComponent } from './components/location-form/location-form.component';
import { FavoritesComponent } from './components/favorites/favorites.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'locations', component: LocationsComponent },
  { path: 'locations/new', component: LocationFormComponent, canActivate: [AuthGuard] },
  { path: 'locations/:id', component: LocationDetailComponent },
  { path: 'locations/:id/edit', component: LocationFormComponent, canActivate: [AuthGuard] },
  { path: 'favorites', component: FavoritesComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: 'home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
