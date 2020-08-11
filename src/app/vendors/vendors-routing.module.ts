import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VendorsPage } from './vendors.page';

const routes: Routes = [
  {
    path: '',
    component: VendorsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VendorsPageRoutingModule {}
