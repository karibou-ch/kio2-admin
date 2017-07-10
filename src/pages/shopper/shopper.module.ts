import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ShopperPage } from './shopper';

@NgModule({
  declarations: [
    ShopperPage,
  ],
  imports: [
    IonicPageModule.forChild(ShopperPage),
  ],
  exports: [
    ShopperPage
  ]
})
export class ShopperPageModule {}
