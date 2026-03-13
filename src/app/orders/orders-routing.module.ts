import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoaderResolve } from 'kng2-core';

import { OrdersCustomerPage, OrdersPlanningPage } from './orders.page';
import { OrdersCollectPage } from './orders-collect.page';
import { OrderCreatePage } from './order-create.page';

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
  },
  {
    path: 'create',
    component: OrderCreatePage,
    resolve: { loader: LoaderResolve }
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrdersCustomerPageRoutingModule {}
