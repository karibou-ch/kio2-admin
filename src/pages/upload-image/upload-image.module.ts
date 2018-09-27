import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { UploadImagePage } from './upload-image';
import { ComponentsModule } from '../../components/components.module';


@NgModule({
  declarations: [
    UploadImagePage
  ],
  imports: [
    // UcWidgetModule.forRoot(),
    ComponentsModule,
    IonicPageModule.forChild(UploadImagePage),
  ],
})
export class UploadImagePageModule {}
