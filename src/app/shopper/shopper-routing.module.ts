import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ShopperPage } from './shopper.page';

const routes: Routes = [
  {
    path: '',
    component: ShopperPage
  },
  {
    path: ':month/:year',
    component: ShopperPage
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ShopperPageRoutingModule {}
