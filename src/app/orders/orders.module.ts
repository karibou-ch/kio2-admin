import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OrdersCustomerPageRoutingModule } from './orders-routing.module';

import { CalendarPageModule } from '../calendar/calendar.module';
import { CalendarPage } from '../calendar/calendar.page';

import { OrdersCustomerPage, OrdersPlanningPage } from './orders.page';
import { OrdersItemsPage, OrdersByItemsPage } from './orders-items.page';
import { OrdersCollectPage } from './orders-collect.page';
import { CustomerMessageModule } from '../customer-message/customer-message.module';
import { CustomerMessage } from '../customer-message/customer-message.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CalendarPageModule,
    CustomerMessageModule,
    OrdersCustomerPageRoutingModule
  ],
  entryComponents:[CustomerMessage, CalendarPage, OrdersItemsPage, OrdersByItemsPage, OrdersPlanningPage],
  declarations: [OrdersCustomerPage, OrdersItemsPage, OrdersByItemsPage, OrdersPlanningPage, OrdersCollectPage]
})
export class OrdersPageModule {}
