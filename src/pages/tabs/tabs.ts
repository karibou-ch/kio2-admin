import { Component } from '@angular/core';

import { LivraisonPage }  from '../livraison/livraison'
import { CollectePage } from '../collecte/collecte'
import { ProfilPage } from '../profil/profil'


@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  tab1Root = LivraisonPage;
  tab2Root = CollectePage;
  tab3Root = ProfilPage;

  constructor() {
  }

  

}
