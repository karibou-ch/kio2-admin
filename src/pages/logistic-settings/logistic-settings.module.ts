import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { LogisticSettingsPage } from './logistic-settings';

@NgModule({
  declarations: [
    LogisticSettingsPage,
  ],
  imports: [
    IonicPageModule.forChild(LogisticSettingsPage),
  ],
  exports: [
    LogisticSettingsPage
  ]
})
export class LogisticSettingsPageModule {}
