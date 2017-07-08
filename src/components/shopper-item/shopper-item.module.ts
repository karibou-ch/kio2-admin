import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { ShopperItemComponent } from './shopper-item';

@NgModule({
  declarations: [
    ShopperItemComponent,
  ],
  imports: [
    IonicModule,
  ],
  exports: [
    ShopperItemComponent
  ]
})
export class ShopperItemComponentModule {}
