import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { VendorPage } from './vendor'
import { OrderItemsPageModule } from './order-items.module';

import { ComponentsModule } from '../../components/components.module';

@NgModule({
  declarations: [
    VendorPage
  ],
  imports: [
    ComponentsModule,
    OrderItemsPageModule,
    IonicPageModule.forChild(VendorPage),
  ],
  exports: [
    VendorPage
  ]
})
export class VendorPageModule {}
