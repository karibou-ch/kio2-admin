import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AdminSettingsPageRoutingModule } from './admin-settings-routing.module';

import { AdminSettingsPage } from './admin-settings.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdminSettingsPageRoutingModule
  ],
  declarations: [AdminSettingsPage]
})
export class AdminSettingsPageModule {}
