import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoaderResolve } from 'kng2-core';

import { ProductDetailsPage } from './product-details.page';

const routes: Routes = [
  {
    path: '',
    component: ProductDetailsPage,
    resolve: { loader: LoaderResolve }
  },
  {
    path: ':sku',
    component: ProductDetailsPage,
    resolve: { loader: LoaderResolve }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProductDetailsPageRoutingModule {}
