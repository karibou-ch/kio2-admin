import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoaderResolve } from 'kng2-core';

import { SubscriptionsPage } from './subscriptions.page';
import { SubscriptionsCreatePage } from './subscriptions-create.page';

const routes: Routes = [
  {
    path: '',
    component: SubscriptionsPage,
    resolve: { loader: LoaderResolve }
  },
  {
    path: 'create',
    component: SubscriptionsCreatePage,
    resolve: { loader: LoaderResolve }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SubscriptionsPageRoutingModule {}
