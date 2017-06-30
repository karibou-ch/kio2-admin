import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { LivraisonPage } from './livraison';

@NgModule({
  declarations: [
    LivraisonPage,
  ],
  imports: [
    IonicPageModule.forChild(LivraisonPage),
  ],
  exports: [
    LivraisonPage
  ]
})
export class LivraisonPageModule {}
