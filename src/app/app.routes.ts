import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./layout/auth-layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/auth/login/login.component').then((m) => m.LoginComponent),
      },
    ],
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./layout/auth-layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
      },
    ],
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        data: { breadcrumb: 'nav.dashboard' },
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'guests',
        loadChildren: () => import('./features/guests/guests.routes').then((m) => m.guestsRoutes),
      },
      {
        path: 'users',
        loadChildren: () => import('./features/users/users.routes').then((m) => m.usersRoutes),
      },
      {
        path: 'property',
        loadChildren: () =>
          import('./features/property/property.routes').then((m) => m.propertyRoutes),
      },
      {
        path: 'rooms',
        loadChildren: () => import('./features/rooms/rooms.routes').then((m) => m.roomsRoutes),
      },
      {
        path: 'halls',
        loadChildren: () => import('./features/halls/halls.routes').then((m) => m.hallsRoutes),
      },
      {
        path: 'bookings',
        loadChildren: () =>
          import('./features/bookings/bookings.routes').then((m) => m.bookingsRoutes),
      },
      {
        path: 'amenities',
        loadChildren: () =>
          import('./features/amenities/amenities.routes').then((m) => m.amenitiesRoutes),
      },
      {
        path: 'reports',
        loadChildren: () =>
          import('./features/reports/reports.routes').then((m) => m.reportsRoutes),
      },
      {
        path: 'stays',
        loadChildren: () => import('./features/stays/stays.routes').then((m) => m.staysRoutes),
      },
      {
        path: 'hr',
        loadChildren: () => import('./features/hr/hr.routes').then((m) => m.hrRoutes),
      },
      {
        path: 'audit',
        loadChildren: () => import('./features/audit/audit.routes').then((m) => m.auditRoutes),
      },
      {
        path: 'branches',
        loadChildren: () =>
          import('./features/branches/branches.routes').then((m) => m.branchesRoutes),
      },
      {
        path: 'forbidden',
        data: { breadcrumb: 'nav.forbidden' },
        loadComponent: () =>
          import('./features/forbidden/forbidden.component').then((m) => m.ForbiddenComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
