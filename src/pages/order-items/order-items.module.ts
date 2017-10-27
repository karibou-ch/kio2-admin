import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { OrderItemsPage } from './order-items';

@NgModule({
  declarations: [
    OrderItemsPage,
  ],
  imports: [
    IonicPageModule.forChild(OrderItemsPage),
  ],
  exports: [
    OrderItemsPage
  ]
})
export class OrderItemsPageModule {}
