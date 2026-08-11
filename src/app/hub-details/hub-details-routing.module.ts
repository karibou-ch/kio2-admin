import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoaderResolve } from 'kng2-core';

import { HubsPage } from './hubs.page';
import { HubDetailsPage } from './hub-details.page';
import { HubManagerPage } from './hub-manager.page';

const routes: Routes = [
  {
    path: '',
    component: HubsPage,
    resolve: { loader: LoaderResolve }
  },
  {
    path: ':hub/manage',
    component: HubManagerPage,
    resolve: { loader: LoaderResolve }
  },
  {
    path: ':hub',
    component: HubDetailsPage,
    resolve: { loader: LoaderResolve }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HubDetailsPageRoutingModule {}
