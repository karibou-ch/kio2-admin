import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { OrderCustomersPage } from './order-customers'
import { OrderItemsPageModule } from './order-items.module';

import { ComponentsModule } from '../../components/components.module';

@NgModule({
  declarations: [
    OrderCustomersPage
  ],
  imports: [
    ComponentsModule,
    OrderItemsPageModule,
    IonicPageModule.forChild(OrderCustomersPage),
  ],
  exports: [
    OrderCustomersPage
  ]
})
export class OrderCustomersPageModule {}
