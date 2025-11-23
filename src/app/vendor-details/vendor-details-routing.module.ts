import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoaderResolve } from 'kng2-core';

import { VendorDetailsPage } from './vendor-details.page';

const routes: Routes = [
  {
    path: ':shop',
    component: VendorDetailsPage,
    resolve: { loader: LoaderResolve }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VendorDetailsPageRoutingModule {}
