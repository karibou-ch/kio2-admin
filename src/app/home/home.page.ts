import { Component } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
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

  openAnalytics(){
    this.$router.navigate(['/analytics']);
  }

  openShopper() {
    this.$router.navigate(['/shopper']);
  }

  openCustomers() {
    this.$router.navigate(['/customers']);
  }

  openInvoices() {
    this.$router.navigate(['/invoices']);
  }

  openProducts() {
    this.$router.navigate(['/products']);
  }

  openProfile() {
    this.$router.navigate(['/profile']);
  }

  openOrders() {
    this.$router.navigate(['/orders']);
  }

  openOrdersPlanning() {
    this.$router.navigate(['/orders/planning']);
  }

  openCollect() {
    this.$router.navigate(['/orders/collect']);
  }


  openVendors() {
    this.$router.navigate(['/vendors']);
  }

  openIssue() {
    this.$router.navigate(['/issues']);
  }

  openReport() {
    this.$router.navigate(['/report']);
  }

  openShopCreate() {
    this.$router.navigate(['/vendor/create']);
  }

}
