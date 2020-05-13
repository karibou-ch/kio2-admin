import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ShopperPageRoutingModule } from './shopper-routing.module';
import { CalendarPageModule } from '../calendar/calendar.module';

import { ShopperPage } from './shopper.page';
import { CalendarPage } from '../calendar/calendar.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CalendarPageModule,
    ShopperPageRoutingModule
  ],
  entryComponents:[CalendarPage],
  declarations: [ShopperPage]
})
export class ShopperPageModule {}
