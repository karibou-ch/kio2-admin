import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VendorDetailsPageRoutingModule } from './vendor-details-routing.module';

import { VendorDetailsPage } from './vendor-details.page';
import { UploadImagePage } from '../upload-image/upload-image.page';
import { UploadImagePageModule } from '../upload-image/upload-image.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    UploadImagePageModule,
    VendorDetailsPageRoutingModule
  ],
  entryComponents:[UploadImagePage],
  declarations: [VendorDetailsPage]
})
export class VendorDetailsPageModule {}
