import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { LoaderResolve } from 'kng2-core';

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
    path: 'tracker',
    resolve: {loader : LoaderResolve },
    loadChildren: () => import('./tracker/tracker.module').then( m => m.TrackerPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
