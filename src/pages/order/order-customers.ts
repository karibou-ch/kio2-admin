import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events, ToastController } from 'ionic-angular';

import { Dialogs } from '@ionic-native/dialogs';

import { EnumFulfillments, 
         Order, 
         OrderService , 
         User, 
         UserService, 
         LoaderService,
         EnumCancelReason} from 'kng2-core';


@IonicPage()
@Component({
  selector: 'kio2-order-customers',
  templateUrl: 'order-customers.html',
})
export class OrderCustomersPage {

  user:User=new User();
  shipping:Date;
  orders:Order[];
  cache:any;

  constructor(
    public dialogs:Dialogs,
    public events: Events,
    public $loader:LoaderService,
    public navCtrl: NavController, 
    public navParams: NavParams,
    public $order:OrderService,
    private toast:ToastController
  ) {
    this.orders=[];
    this.cache={};
    this.$loader.ready().subscribe((loader)=>{
        Object.assign(this.user,loader[1]);
    })
  }


  doRefresh(refresher){
    this.events.publish('refresh');    
    setTimeout(() => {
      refresher.complete();
    }, 1000);    
  }
  
  isOrderCapturable(order:Order){
    // admin test should be outside 
    return (['voided','paid','invoice'].indexOf(order.payment.status)===-1) && (order.fulfillments.status==='fulfilled');
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

  onDone(msg){
    this.toast.create({
      message: msg,
      duration: 3000
    }).present();

  }

  orderCapture(order:Order){
    this.$order.capture(order).subscribe(
      (ok)=>{
        this.onDone("Commande payée");
      },
      error=>{
        this.onDone(error.text());
      }
    );
    
  }
  
  orderCancel(order:Order){
    this.dialogs.confirm("SUPPRIMER LA COMMANDE").then(action=>{
      // 0:dismiss,1:OK,2:cancel
      if(action!=1){
        return;
      }
      this.$order.cancelWithReason(order,EnumCancelReason.customer).subscribe(
        (ok)=>{
          this.onDone("Commande annulée");
        },
        error=>{
          this.onDone(error.text());
        }
      );
        
    });
  }

  orderShippingFees(order){
    this.$order.updateShippingPrice(order,order.payment.fees.shipping).subscribe(
      (ok)=>{
        this.onDone("Livraison modifiée");
      },
      error=>{
        this.onDone(error.text());
      }
    );
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


  validateAll(order){

  }
}
