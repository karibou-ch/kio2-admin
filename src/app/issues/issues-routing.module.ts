import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { IssuesPage } from './issues.page';

const routes: Routes = [
  {
    path: '',
    component: IssuesPage
  },
  {
    path: ':month/:year',
    component: IssuesPage
  }, {
    path: ':month/:year/:shop',
    component: IssuesPage
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class IssuesPageRoutingModule {}
