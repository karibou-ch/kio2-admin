import { Component } from '@angular/core';
import { Events, IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';

import { Order,EnumFulfillments, OrderService } from 'kng2-core';

/**
 * Generated class for the OrderItemsPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
  selector: 'page-order-items',
  templateUrl: 'order-items.html',
})
export class OrderItemsPage {
  orders:Order[];
  vendor:string;
  shipping:Date;
  isReady:boolean=true;

  constructor(
    public events: Events,
    public navCtrl: NavController, 
    public navParams: NavParams,
    public $order:OrderService,
    private toast:ToastController
  ) {

    //
    // OrderItems[] for this vendor
    this.orders = this.navParams.get('orders')||[];
    this.vendor = this.navParams.get('vendor')||'';
    this.shipping = this.navParams.get('shipping');
  }


  isItemValid(item){
    return(item.fulfillment.status==='fulfilled');
//      'primary':'light';
  }

  isItemCancel(item){
    return(item.fulfillment.status==='failure');
//      'danger':'light';
  }

  doValidate(order, item){
    this.$order.updateItem(order,item,EnumFulfillments.fulfilled)
      .subscribe(ok=>{
        this.doToast("Validation enregistrée");
        //
        // when admin, we should remove other vendor items
        Object.assign(order,ok);
        order.items=order.items.filter(i=>i.vendor===item.vendor)
      },error=>this.doToast(error.text()));
  }
  
  doCancel(order, item){
    this.$order.updateItem(order,item,EnumFulfillments.failure)
      .subscribe(ok=>{
        this.doToast("Annulation enregistrée");
        //
        // when admin, we should remove other vendor items
        Object.assign(order,ok);
        order.items=order.items.filter(i=>i.vendor===item.vendor)
      },error=>this.doToast(error.text()));
  }

  doToast(msg){
    this.toast.create({
      message: msg,
      duration: 3000
    }).present()
  }

  doSelectAllPrice(event){
    //console.log('----',event);
    if(event.inputElement){
      return event.inputElement.select();
    }
    event.target.select();
  }

  doKeypress(kcode,order,item){
    //
    // case of enter
    if(kcode===13){
      this.doValidate(order,item);
    }
  }

  ionViewDidLoad() {
  }

  ionViewDidLeave(){
    this.events.publish('refresh');        
  }

}
