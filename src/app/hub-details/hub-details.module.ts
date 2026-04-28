import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HubDetailsPageRoutingModule } from './hub-details-routing.module';

import { HubsPage } from './hubs.page';
import { HubDetailsPage } from './hub-details.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HubDetailsPageRoutingModule
  ],
  declarations: [
    HubsPage,
    HubDetailsPage
  ]
})
export class HubDetailsPageModule {}
