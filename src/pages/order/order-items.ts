import { Component, Input } from '@angular/core';
import { Events, IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';

import { Order,EnumFulfillments, OrderService, Product, OrderItem, ProductService } from 'kng2-core';

/**
 * Generated class for the OrderItemsPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
  selector: 'kio2-order-items',
  templateUrl: 'order-items.html',
})
export class OrderItemsPage {
  public vendor:string;
  public shipping:Date;
  public isReady:boolean;

  //
  // input props
  @Input() orders:Order[];
  @Input() header:boolean=true;

  constructor(
    public events: Events,
    public navCtrl: NavController, 
    public navParams: NavParams,
    public $order:OrderService,
    public $product:ProductService,
    public toast:ToastController
  ) {

    //
    // OrderItems[] for this vendor
    this.orders = this.navParams.get('orders')||[];
    this.vendor = this.navParams.get('vendor')||'';
    this.shipping = this.navParams.get('shipping');
    
  }


  isItemValid(item){
    return(item.fulfillment.status=='fulfilled');
//      'primary':'light';
  }

  isItemCancel(item){
    return(item.fulfillment.status=='failure');
//      'danger':'light';
  }

  isPaid(order:Order){
    return (['paid'].indexOf(order.payment.status)>-1);
  } 

  doRefund(order:Order,item:OrderItem){

    this.$order.refund(order,item.finalprice).subscribe(
      ()=>{
        this.doToast("Montant: "+item.finalprice.toFixed(2)+" remboursé")
      },error=>this.doToast(error.text())      
    )
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

 
  doOpenProduct(item:OrderItem){
    this.$product.get(item.sku).subscribe(
      (product:Product)=>{
        this.navCtrl.push('ProductDetailPage',{
          product:product
        });    
      }
    )
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

  ngOnInit() {
    this.isReady= (this.orders.length>0)|| (this.vendor!='') || (this.shipping!=null);
    //console.log('-----',this.orders,(this.orders.length>0),(this.vendor!='') , (this.shipping!=null))
  }

  ionViewDidLeave(){
    this.events.publish('refresh');        
  }

}
