import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events, ToastController } from 'ionic-angular';

import { EnumFulfillments, 
         Order, 
         OrderService , 
         User, 
         UserService } from 'kng2-core';

/**
 * Generated class for the VendorPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'kio2-order-customers',
  templateUrl: 'order-customers.html',
})
export class OrderCustomersPage {

  shipping:Date;
  orders:Order[];
  cache:any;

  constructor(
    public events: Events,
    public navCtrl: NavController, 
    public navParams: NavParams,
    public $order:OrderService,
    private toast:ToastController    
  ) {
    this.orders=[];
    this.cache={};
  }

  isOrderSelected(order:Order){

  }
  
  isFulfilled(order:Order){
    if(!order){
      return false;
    }
    if(this.cache[order.oid]===undefined){
      this.cache[order.oid]=order.getProgress();
    }
    return this.cache[order.oid]>=99.9;
  }

  ionViewDidLoad() {
  }

  openOrder(order){
    this.navCtrl.push('OrderItemsPage',{
      orders:[order],
      shipping:this.shipping
    });

  }

  onInitOrders([orders,shipping]:[Order[],Date]){
    this.orders = orders.sort(this.sortOrdersByRank);
    this.shipping=shipping;
  }

  sortOrdersByRank(o1,o2){
    return o1.rank-o2.rank;
  }

  sortOrdersByPosition(o1,o2){
    //TODO checking type of postalCode is always a number
    //console.log('sort',(o1.shipping.position*10+o1.rank),(o2.shipping.position*10+o2.rank))
    let delta=((o1.shipping.position|0))-((o2.shipping.position|0));
    if(delta===0){
      return o1.rank-o2.rank;
    }
    return delta;
  }  
}
