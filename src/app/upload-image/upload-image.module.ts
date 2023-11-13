import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { UploadImagePage } from './upload-image.page';
import { UcWidgetModule } from 'ngx-uploadcare-widget';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    UcWidgetModule
  ],
  exports: [UploadImagePage],
  declarations: [UploadImagePage]
})
export class UploadImagePageModule {}
