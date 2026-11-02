import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const bookingsRoutes: Routes = [
  {
    path: '',
    canActivate: [permissionGuard],
    data: { permissions: ['bookings.view'], breadcrumb: 'nav.bookings' },
    loadComponent: () =>
      import('./pages/booking-list/booking-list.component').then((m) => m.BookingListComponent),
  },
  {
    path: 'new',
    canActivate: [permissionGuard],
    data: { permissions: ['bookings.create'], breadcrumb: 'nav.newBooking', breadcrumbParent: { label: 'nav.bookings', url: '/bookings' } },
    loadComponent: () =>
      import('./pages/booking-wizard/booking-wizard.component').then((m) => m.BookingWizardComponent),
  },
  {
    path: ':id/extend/:lineId',
    canActivate: [permissionGuard],
    data: {
      permissions: ['checkout.extend'],
      breadcrumb: 'bookings.extendStayHeader',
      breadcrumbParent: { label: 'nav.bookings', url: '/bookings' },
    },
    loadComponent: () =>
      import('./pages/booking-extend/booking-extend.component').then((m) => m.BookingExtendComponent),
  },
  {
    path: ':id/transfer/:lineId',
    canActivate: [permissionGuard],
    data: {
      permissions: ['checkout.transfer'],
      breadcrumb: 'bookings.transferRoomHeader',
      breadcrumbParent: { label: 'nav.bookings', url: '/bookings' },
    },
    loadComponent: () =>
      import('./pages/booking-transfer/booking-transfer.component').then((m) => m.BookingTransferComponent),
  },
  {
    path: ':id',
    canActivate: [permissionGuard],
    data: { permissions: ['bookings.detail', 'bookings.view'], breadcrumb: 'nav.bookingDetails', breadcrumbParent: { label: 'nav.bookings', url: '/bookings' } },
    loadComponent: () =>
      import('./pages/booking-detail/booking-detail.component').then((m) => m.BookingDetailComponent),
  },
];
