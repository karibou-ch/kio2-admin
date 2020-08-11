import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VendorDetailsPage } from './vendor-details.page';

const routes: Routes = [
  {
    path: ':shop',
    component: VendorDetailsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VendorDetailsPageRoutingModule {}
