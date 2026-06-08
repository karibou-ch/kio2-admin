import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoaderResolve } from 'kng2-core';

import { CouponCreatePage } from './coupon-create.page';

const routes: Routes = [
  {
    path: '',
    component: CouponCreatePage,
    resolve: { loader: LoaderResolve }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CouponsPageRoutingModule {}
