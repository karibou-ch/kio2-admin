import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { VendorItemsPage } from './vendor-items'
import { OrderItemsPageModule } from './order-items.module';

import { ComponentsModule } from '../../components/components.module';

@NgModule({
  declarations: [
    VendorItemsPage
  ],
  imports: [
    ComponentsModule,
    OrderItemsPageModule,
    IonicPageModule.forChild(VendorItemsPage),
  ],
  exports: [
    VendorItemsPage
  ]
})
export class VendorItemsPageModule {}
