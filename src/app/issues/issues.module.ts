import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { IssuesPageRoutingModule } from './issues-routing.module';

import { IssuesPage } from './issues.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IssuesPageRoutingModule
  ],
  declarations: [IssuesPage]
})
export class IssuesPageModule {}
