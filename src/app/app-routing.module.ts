import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { LoaderResolve, UserResolve } from 'kng2-core';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'login',
    resolve: {loader : LoaderResolve },
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'stripe',
    resolve: {loader : LoaderResolve },
    loadChildren: () => import('./stripe/stripe.module').then( m => m.StripePageModule)
  },
  {
    path: 'home',
    resolve: {loader : LoaderResolve },
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'analytics',
    resolve: {loader : LoaderResolve },
    loadChildren: () => import('./analytics/analytics.module').then( m => m.AnalyticsPageModule)
  },
  {
    path: 'profile',
    resolve: {loader : LoaderResolve },
    loadChildren: () => import('./profil/profil.module').then( m => m.ProfilPageModule)
  },
  {
    path: 'shopper',
    resolve: {loader : LoaderResolve },
    loadChildren: () => import('./shopper/shopper.module').then( m => m.ShopperPageModule)
  },
  {
    path: 'products',
    resolve: {loader : LoaderResolve },
    loadChildren: () => import('./products/products.module').then( m => m.ProductsPageModule)
  },
  {
    path: 'product',
    resolve: {loader : LoaderResolve },
    loadChildren: () => import('./product-details/product-details.module').then( m => m.ProductDetailsPageModule)
  },
  {
    path: 'orders',
    resolve: {loader : LoaderResolve },
    loadChildren: () => import('./orders/orders.module').then( m => m.OrdersPageModule)
  },
  {
    path: 'invoices',
    resolve: {loader : LoaderResolve },
    loadChildren: () => import('./invoice/invoice.module').then( m => m.InvoicePageModule)
  },
  {
    path: 'customers',
    resolve: {loader : LoaderResolve },
    loadChildren: () => import('./customers/customers.module').then( m => m.CustomersPageModule)
  },
  {
    path: 'report',
    resolve: {loader : LoaderResolve },
    loadChildren: () => import('./report/report.module').then( m => m.ReportPageModule)
  },
  {
    path: 'issues',
    resolve: {loader : LoaderResolve },
    loadChildren: () => import('./issues/issues.module').then( m => m.IssuesPageModule)
  },
  {
    path: 'vendors',
    resolve: {loader : LoaderResolve },
    loadChildren: () => import('./vendors/vendors.module').then( m => m.VendorsPageModule)
  },
  {
    path: 'vendor',
    resolve: {loader : LoaderResolve },
    loadChildren: () => import('./vendor-details/vendor-details.module').then( m => m.VendorDetailsPageModule)
  },
  {
    path: 'crm',
    loadChildren: () => import('./stats/stats.module').then( m => m.StatsPageModule)
  },
  { path: '**', redirectTo: '/home', pathMatch: 'full' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
