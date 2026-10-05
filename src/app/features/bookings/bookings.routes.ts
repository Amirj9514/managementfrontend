import { Routes } from '@angular/router';

export const bookingsRoutes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'nav.bookings' },
    loadComponent: () =>
      import('./pages/booking-list/booking-list.component').then((m) => m.BookingListComponent),
  },
  {
    path: 'new',
    data: { breadcrumb: 'nav.newBooking', breadcrumbParent: { label: 'nav.bookings', url: '/bookings' } },
    loadComponent: () =>
      import('./pages/booking-wizard/booking-wizard.component').then((m) => m.BookingWizardComponent),
  },
  {
    path: ':id',
    data: { breadcrumb: 'nav.bookingDetails', breadcrumbParent: { label: 'nav.bookings', url: '/bookings' } },
    loadComponent: () =>
      import('./pages/booking-detail/booking-detail.component').then((m) => m.BookingDetailComponent),
  },
];
