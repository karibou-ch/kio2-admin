import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ItemOrderPage } from './item-orders';

@NgModule({
  declarations: [
    ItemOrderPage
  ],
  imports:[
    IonicPageModule.forChild(ItemOrderPage)    
  ],
  exports: [
    ItemOrderPage
  ]
})
export class OrderItemsPageModule {}
