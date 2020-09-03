import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CustomersPage } from './customers.page';
import { CustomerPage } from './customer.page';

const routes: Routes = [
  {
    path: '',
    component: CustomersPage
  },
  {
    path: ':id',
    component: CustomerPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CustomersPageRoutingModule {}
