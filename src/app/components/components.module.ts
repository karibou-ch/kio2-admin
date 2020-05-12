import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { LogisticHeaderComponent } from './logistic-header/logistic-header';
import { UcWidgetComponent } from './uc-widget/uc-widget';

@NgModule({
  declarations: [
    LogisticHeaderComponent,
    UcWidgetComponent
  ],
  imports: [
    IonicModule,
  ],
  exports: [
    LogisticHeaderComponent,
    UcWidgetComponent
  ]
})
export class ComponentsModule {}
