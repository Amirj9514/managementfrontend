import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const checkoutRoutes: Routes = [
  {
    path: '',
    canActivate: [permissionGuard],
    data: { permissions: ['checkout.view'], breadcrumb: 'nav.checkout' },
    loadComponent: () =>
      import('./pages/checkout-board/checkout-board.component').then((m) => m.CheckoutBoardComponent),
  },
];
