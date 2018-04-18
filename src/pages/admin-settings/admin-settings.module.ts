import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AdminSettingsPage } from './admin-settings';

@NgModule({
  declarations: [
    AdminSettingsPage,
  ],
  imports: [
    IonicPageModule.forChild(AdminSettingsPage),
  ],
  exports: [
    AdminSettingsPage
  ]
})
export class AdminSettingsPageModule {}
