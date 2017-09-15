import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ShopperPage } from './shopper';

import { ComponentsModule } from '../../components/components.module';


@NgModule({
  declarations: [
    ShopperPage,
  ],
  imports: [
    ComponentsModule,
    IonicPageModule.forChild(ShopperPage),
  ],
  exports: [
    ShopperPage
  ]
})
export class ShopperPageModule {}
