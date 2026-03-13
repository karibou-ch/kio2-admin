import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SubscriptionsPageRoutingModule } from './subscriptions-routing.module';

import { SubscriptionsPage } from './subscriptions.page';
import { SubscriptionsCreatePage } from './subscriptions-create.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SubscriptionsPageRoutingModule
  ],
  declarations: [SubscriptionsPage, SubscriptionsCreatePage]
})
export class SubscriptionsPageModule {}
