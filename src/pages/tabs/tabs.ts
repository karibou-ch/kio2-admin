import { Component } from '@angular/core';

import { ShopperPage }  from '../shopper/shopper'
import { CollectePage } from '../collecte/collecte'
import { ProfilPage } from '../profil/profil'


@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  tab1Root = ShopperPage;
  tab2Root = CollectePage;
  tab3Root = ProfilPage;

  constructor() {
  }

  

}
