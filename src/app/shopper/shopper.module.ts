import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ShopperPageRoutingModule } from './shopper-routing.module';

import { ShopperPage } from './shopper.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ShopperPageRoutingModule
  ],
  declarations: [ShopperPage]
})
export class ShopperPageModule {}
