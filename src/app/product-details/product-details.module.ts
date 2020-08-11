import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ProductDetailsPageRoutingModule } from './product-details-routing.module';

import { ProductDetailsPage } from './product-details.page';
import { UploadImagePageModule } from '../upload-image/upload-image.module';
import { UploadImagePage } from '../upload-image/upload-image.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    UploadImagePageModule,
    ProductDetailsPageRoutingModule
  ],
  entryComponents:[UploadImagePage],
  declarations: [ProductDetailsPage]
})
export class ProductDetailsPageModule {}
