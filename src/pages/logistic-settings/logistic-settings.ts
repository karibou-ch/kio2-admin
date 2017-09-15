import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Order } from 'kng2-core';


/**
 * Generated class for the LogisticSettingsPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage({name:'LogisticSettingsPage'})
@Component({
  selector: 'page-logistic-settings',
  templateUrl: 'logistic-settings.html',
})
export class LogisticSettingsPage {
  availableDates:Date[]=[];
  currentShippingDate:Date;
  toggle:boolean;
  parent:any;
  constructor(public navCtrl: NavController, public navParams: NavParams) {
    this.currentShippingDate = this.navParams.get('current');
    this.availableDates=this.navParams.get('shipping');
    this.parent=this.navParams.get('component');
    this.toggle=this.navParams.get('toggle');
  }
  ngOnInit(){
  }

  ionViewDidLoad() {
  }

  displayOrders(shipping){
    this.parent.displayOrders(shipping);
    this.navCtrl.pop();
  }

  toggleShippingFilter(){
    this.parent.toggleShippingFilter();
    this.navCtrl.pop();
  }


  openProfile(){
    this.navCtrl.push('ProfilPage');
  }
    
}
