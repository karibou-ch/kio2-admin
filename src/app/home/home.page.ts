import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { EngineService } from '../services/engine.service';
import { User, Config, Shop } from 'kng2-core';

import { version } from '../../../package.json';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  VERSION = version;
  siteName: string;
  user: User;
  config: Config;

  isAdminOrLogistic: boolean;
  isAdminOrVendor: boolean;
  isAdmin: boolean;

  constructor(
    private $engine: EngineService,
    private $router: Router
  ) {
    this.user = this.$engine.currentUser;
    this.config = this.$engine.currentConfig;

    this.siteName = (this.config.shared.hub && this.config.shared.hub.slug) ? (this.config.shared.hub.siteName.fr ) : 'K';


    this.isAdmin = this.user.isAdmin();
    this.isAdminOrVendor = (!!this.user.shops.length) || this.user.isAdmin();
    this.isAdminOrLogistic = this.user.hasRole('logistic') || this.user.isAdmin();
  }


  doRefresh($event){
    window.location.reload();
  }

  isShopOpen(shop: Shop) {
    return (shop.status === true) && !shop.available.active;
  }

  openShopper() {
    this.$router.navigateByUrl('/shopper');
  }

  openCustomers() {
    this.$router.navigateByUrl('/customers');
  }

  openInvoices() {
    this.$router.navigateByUrl('/invoices');
  }

  openProducts() {
    this.$router.navigateByUrl('/products');
  }

  openProfile() {
    this.$router.navigateByUrl('/profile');
  }

  openOrders() {
    this.$router.navigateByUrl('/orders');
  }

  openCollect() {
    this.$router.navigateByUrl('/orders/collect');
  }


  openVendors() {
    this.$router.navigateByUrl('/vendors');
  }

  openReport() {
    this.$router.navigateByUrl('/report');
  }

  openShopCreate() {
    this.$router.navigateByUrl('/vendor/create');
  }

}
