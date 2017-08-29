import { Component } from '@angular/core';

import { ShopperPage }  from '../shopper/shopper'
import { CollectePage } from '../collecte/collecte'
import { ProfilPage } from '../profil/profil'


@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  shopper = ShopperPage;
  collect = CollectePage;
  profil = ProfilPage;

  constructor() {
  }

  

}
