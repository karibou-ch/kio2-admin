import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OrdersCustomerPage } from './orders.page';

const routes: Routes = [
  {
    path: '',
    component: OrdersCustomerPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrdersCustomerPageRoutingModule {}
