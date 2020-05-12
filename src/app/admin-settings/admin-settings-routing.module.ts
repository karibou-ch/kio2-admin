import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdminSettingsPage } from './admin-settings.page';

const routes: Routes = [
  {
    path: '',
    component: AdminSettingsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminSettingsPageRoutingModule {}
