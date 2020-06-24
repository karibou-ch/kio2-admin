import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StripePage } from './stripe.page';

const routes: Routes = [
  {
    path: '',
    component: StripePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StripePageRoutingModule {}
