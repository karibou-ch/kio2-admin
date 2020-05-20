import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { EngineService } from '../services/engine.service';
import { User } from 'kng2-core';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  user: User;

  isAdminOrLogistic: boolean;
  isAdminOrVendor: boolean;

  constructor(
    private $engine: EngineService,
    private $router: Router
  ) {
    this.user = this.$engine.currentUser;

    this.isAdminOrVendor = (!!this.user.shops.length) || this.user.isAdmin();
    this.isAdminOrLogistic = this.user.hasRole('logistic') || this.user.isAdmin();
  }



  openShopper() {
    this.$router.navigateByUrl('/shopper');
  }

  openCustomers() {
    this.$router.navigateByUrl('/customers');
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
