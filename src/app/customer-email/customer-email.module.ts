import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CustomerEmail } from './customer-email.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
  ],
  exports: [CustomerEmail],
  entryComponents:[CustomerEmail],
  declarations: [CustomerEmail]
})
export class CustomerEmailModule {}
