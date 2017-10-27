import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CollectPage } from './collect';

import { ComponentsModule } from '../../components/components.module';

@NgModule({
  declarations: [
    CollectPage,
  ],
  imports: [
    ComponentsModule,
    IonicPageModule.forChild(CollectPage),
  ],
  exports: [
    CollectPage
  ]
})
export class CollectPageModule {}
