import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ShopperPageRoutingModule } from './shopper-routing.module';
import { CalendarPageModule } from '../calendar/calendar.module';
import { TrackerPageModule } from '../tracker/tracker.module';

import { ShopperPage } from './shopper.page';
import { CalendarPage } from '../calendar/calendar.page';
import { TrackerPage } from '../tracker/tracker.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CalendarPageModule,
    TrackerPageModule,
    ShopperPageRoutingModule
  ],
  entryComponents:[CalendarPage, TrackerPage],
  declarations: [ShopperPage]
})
export class ShopperPageModule {}
