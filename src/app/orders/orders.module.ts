import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OrdersCustomerPageRoutingModule } from './orders-routing.module';

import { OrdersCustomerPage } from './orders.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OrdersCustomerPageRoutingModule
  ],
  declarations: [OrdersCustomerPage]
})
export class OrdersPageModule {}
