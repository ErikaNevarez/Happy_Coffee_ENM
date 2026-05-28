import { Routes } from '@angular/router';

export const routes: Routes = [
    {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
    },
  {
    path: 'home',
    loadComponent: () =>
      import('./home/home-page.component').then((m) => m.HomePageComponent),
  },
  {
    path: 'sale',
    loadComponent: () =>
      import('./sale/sale-page.component').then((m) => m.SalePageComponent),
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./sale/sale-page.component').then((m) => m.SalePageComponent),
  },
  {
    path: 'admin/products',
    loadComponent: () =>
      import('./admin/admin-products.component').then(
        (m) => m.AdminProductsComponent,
      ),
  },
  {
    path: 'admin/customers',
    loadComponent: () =>
      import('./admin/admin-customers.component').then(
        (m) => m.AdminCustomersComponent,
      ),
  },
  {
    path: 'menu',
    loadComponent: () =>
      import('./products/product-list/product-list.component').then(
        (m) => m.ProductListComponent,
      ),
  },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  // Compatibilidad con URLs antiguas
  { path: 'products', redirectTo: 'menu', pathMatch: 'full' },
  { path: 'checkout', redirectTo: '', pathMatch: 'full' },
  { path: 'cart', redirectTo: '', pathMatch: 'full' },
  { path: 'customers/new', redirectTo: 'admin/customers', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
