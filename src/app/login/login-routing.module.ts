import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoaderResolve } from 'kng2-core';

import { LoginPage } from './login.page';

const routes: Routes = [
  {
    path: '',
    component: LoginPage,
    resolve: { loader: LoaderResolve }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LoginPageRoutingModule {}
