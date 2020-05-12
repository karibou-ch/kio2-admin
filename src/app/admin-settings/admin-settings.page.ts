import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavParams } from '@ionic/angular';
import { UserService, User } from 'kng2-core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-settings',
  templateUrl: './admin-settings.page.html',
  styleUrls: ['./admin-settings.page.scss'],
})
export class AdminSettingsPage implements OnInit, OnDestroy {

  availableDates: Date[] = [];
  currentShippingDate: Date;
  toggle: boolean;
  parent: any;
  user: User = new User();
  version= '';
  sub: any;

  constructor(
    public navParams: NavParams,
    public $router: Router,
    public $user: UserService
  ) {
    this.currentShippingDate = this.navParams.get('current');
    this.availableDates = this.navParams.get('shipping');
    this.parent = this.navParams.get('component');
    this.toggle = this.navParams.get('toggle');
    this.user = this.navParams.get('user') || this.user;
    if (this.availableDates.length) {
      this.availableDates = this.availableDates.sort((a: Date, b: Date) => a.getTime() - b.getTime());
    }

  }

  ngOnInit() {
    Object.assign(this.user, this.$user.currentUser || this.user);
    // this.$user.user$.subscribe(user=>{
    //   Object.assign(this.user,user)
    // });
    this.sub = this.parent.doInitOrders.subscribe(([orders, when, dates]) => {
      this.availableDates = (dates || []).sort((a, b) => a - b);
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  ionViewDidLoad() {
  }

  displayOrders(shipping) {
    // this.parent.initOrders(shipping);
    // this.navCtrl.pop();
    this.$router.navigateByUrl('');
  }

  goHome() {
    this.$router.navigateByUrl('/');
  }

  toggleShippingFilter() {
    this.parent.toggleShippingFilter();
  }

  openCustomers() {
    this.$router.navigateByUrl('/customer');
  }

  openProducts() {
    // this.navCtrl.push('ProductsPage', {
    //   user: this.user
    // });
    this.$router.navigateByUrl('/products');
  }

  openProfile() {
    this.$router.navigateByUrl('/profil');
  }

  openOrders() {
    this.$router.navigateByUrl('/orders');
  }

  openVendors() {
    // this.navCtrl.push('VendorPage', {
    //   user: this.user
    // });
    this.$router.navigateByUrl('/vendors');
  }

  openReports() {
    const month = this.currentShippingDate.getMonth() + 1;
    const year = this.currentShippingDate.getFullYear();

    // this.navCtrl.push('ReportPage', {
    //   user: this.user,
    //   month,
    //   year
    // });
    this.$router.navigateByUrl('/report');

  }

}
