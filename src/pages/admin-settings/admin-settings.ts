import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { User, UserService } from 'kng2-core';

@IonicPage({name:'AdminSettingsPage'})
@Component({
  selector: 'kio2-admin-settings',
  templateUrl: 'admin-settings.html',
})
export class AdminSettingsPage {
  availableDates:Date[]=[];
  currentShippingDate:Date;
  toggle:boolean;
  parent:any;
  user:User=new User();

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public $user:UserService
  ) {
    this.currentShippingDate = this.navParams.get('current');
    this.availableDates=this.navParams.get('shipping');
    this.parent=this.navParams.get('component');
    this.toggle=this.navParams.get('toggle');
  }

  ngOnInit(){
    Object.assign(this.user,this.$user.currentUser);
  }

  ionViewDidLoad() {
  }

  displayOrders(shipping){
    this.parent.initOrders(shipping);
    this.navCtrl.pop();
  }

  toggleShippingFilter(){
    this.parent.toggleShippingFilter();
    this.navCtrl.pop();
  }

  openProducts(){
    this.navCtrl.push('ProductsPage');    
  }

  openProfile(){
    this.navCtrl.push('ProfilPage');
  }
 
  openOrders(){
    this.navCtrl.push('OrderCustomersPage');    
  }

  openVendors(){
    this.navCtrl.push('VendorPage');        
  }
}
