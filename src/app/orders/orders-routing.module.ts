import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OrdersCustomerPage, OrdersPlanningPage } from './orders.page';
import { OrdersCollectPage } from './orders-collect.page';

const routes: Routes = [
  {
    path: '',
    component: OrdersCustomerPage
  },
  {
    path: ':month/:year',
    component: OrdersCustomerPage
  },
  {
    path: 'collect',
    component: OrdersCollectPage
  },
  {
    path: 'planning',
    component: OrdersPlanningPage
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrdersCustomerPageRoutingModule {}
