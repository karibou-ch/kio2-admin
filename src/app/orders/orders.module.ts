import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OrdersCustomerPageRoutingModule } from './orders-routing.module';

import { CalendarPageModule } from '../calendar/calendar.module';
import { CalendarPage } from '../calendar/calendar.page';

import { OrdersCustomerPage } from './orders.page';
import { OrdersItemsPage, OrdersByItemsPage } from './orders-items.page';
import { OrdersCollectPage } from './orders-collect.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CalendarPageModule,
    OrdersCustomerPageRoutingModule
  ],
  entryComponents:[CalendarPage, OrdersItemsPage, OrdersByItemsPage],
  declarations: [OrdersCustomerPage, OrdersItemsPage, OrdersByItemsPage, OrdersCollectPage]
})
export class OrdersPageModule {}
