import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CustomersPage } from './customers';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
  declarations: [
    CustomersPage,
  ],
  imports: [
    ComponentsModule,
    IonicPageModule.forChild(CustomersPage),
  ],
})
export class CustomersPageModule {}
