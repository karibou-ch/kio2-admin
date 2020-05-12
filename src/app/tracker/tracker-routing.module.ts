import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TrackerPage } from './tracker.page';

const routes: Routes = [
  {
    path: '',
    component: TrackerPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TrackerPageRoutingModule {}
