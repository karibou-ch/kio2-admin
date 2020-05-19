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
    resolve: {user : UserResolve },
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'home',
    resolve: {loader : LoaderResolve },
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'profile',
    resolve: {loader : LoaderResolve },
    loadChildren: () => import('./profil/profil.module').then( m => m.ProfilPageModule)
  },
  {
    path: 'admin-settings',
    resolve: {loader : LoaderResolve },
    loadChildren: () => import('./admin-settings/admin-settings.module').then( m => m.AdminSettingsPageModule)
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
    path: 'vendors',
    resolve: {loader : LoaderResolve },
    loadChildren: () => import('./vendors/vendors.module').then( m => m.VendorsPageModule)
  },
  {
    path: 'vendor',
    resolve: {loader : LoaderResolve },
    loadChildren: () => import('./vendor-details/vendor-details.module').then( m => m.VendorDetailsPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
