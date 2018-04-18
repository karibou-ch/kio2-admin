import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { VendorPage } from './vendor';

@NgModule({
  declarations: [
    VendorPage,
  ],
  imports: [
    IonicPageModule.forChild(VendorPage),
  ],
})
export class VendorPageModule {}
