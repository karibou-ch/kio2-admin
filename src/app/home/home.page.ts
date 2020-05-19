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

  constructor(
    private $engine: EngineService,
    private $router: Router
  ) {
    this.user = this.$engine.currentUser;
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
    // this.navCtrl.pop();
    // this.navCtrl.push('VendorPage', {
    //   user: this.user
    // });
    this.$router.navigateByUrl('/vendors');
  }

  openReport() {
    // const month = this.currentShippingDate.getMonth() + 1;
    // const year = this.currentShippingDate.getFullYear();

    // this.navCtrl.pop();
    // this.navCtrl.push('ReportPage', {
    //   user: this.user,
    //   month,
    //   year
    // });
    this.$router.navigateByUrl('/report');

  }

}
