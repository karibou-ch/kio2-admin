import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CustomersPageRoutingModule } from './customers-routing.module';

import { CustomersPage } from './customers.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CustomersPageRoutingModule
  ],
  declarations: [CustomersPage]
})
export class CustomersPageModule {}
