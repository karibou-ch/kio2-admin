import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { UploadImagePage } from './upload-image.page';
import { UcWidgetComponent } from '../components/uc-widget/uc-widget';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
  ],
  exports: [UploadImagePage],
  declarations: [UploadImagePage, UcWidgetComponent]
})
export class UploadImagePageModule {}
