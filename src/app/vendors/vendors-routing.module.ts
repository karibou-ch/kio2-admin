import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoaderResolve } from 'kng2-core';

import { VendorsPage } from './vendors.page';

const routes: Routes = [
  {
    path: '',
    component: VendorsPage,
    resolve: { loader: LoaderResolve }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VendorsPageRoutingModule {}
