import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { homeGuard, permissionGuard } from './core/guards/permission.guard';

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
  // Self sign-up is switched off: accounts are created by an admin under Users. The register page code is kept.
  { path: 'register', redirectTo: 'login', pathMatch: 'full' },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      // Lands each user on the first screen they are allowed to see.
      { path: '', pathMatch: 'full', canActivate: [homeGuard], children: [] },
      {
        path: 'dashboard',
        canActivate: [permissionGuard],
        data: { breadcrumb: 'nav.dashboard', permissions: ['dashboard.view'] },
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'announcements',
        loadChildren: () =>
          import('./features/announcements/announcements.routes').then((m) => m.announcementsRoutes),
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
        loadChildren: () =>
          import('./features/checkout/checkout.routes').then((m) => m.checkoutRoutes),
      },
      { path: 'checkout', redirectTo: 'stays', pathMatch: 'prefix' },
      {
        path: 'housekeeping',
        loadChildren: () =>
          import('./features/housekeeping/housekeeping.routes').then((m) => m.housekeepingRoutes),
      },
      // HR module hidden until v2 — uncomment to re-enable (and the nav item in nav-items.ts).
      // {
      //   path: 'hr',
      //   loadChildren: () => import('./features/hr/hr.routes').then((m) => m.hrRoutes),
      // },
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
  { path: '**', redirectTo: '' },
];
