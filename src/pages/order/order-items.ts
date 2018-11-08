import { Component, Input } from '@angular/core';
import { Events, IonicPage, NavController, NavParams, ToastController, AlertController } from 'ionic-angular';

import { Order,EnumFulfillments, OrderService, Product, OrderItem, ProductService, User } from 'kng2-core';

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
  public user:User;

  //
  // input props
  @Input() orders:Order[];
  @Input() header:boolean=true;

  constructor(
    public alertCtrl: AlertController,
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
    this.user = this.navParams.get('user');
    
  }

  ngOnInit() {
    this.isReady= (this.orders.length>0)|| (this.vendor!='') || (this.shipping!=null);
    //console.log('-----',this.orders,(this.orders.length>0),(this.vendor!='') , (this.shipping!=null))
  }

  ngOnDestroy(){
    this.events.publish('refresh');        
  }

  
  doRefund(order:Order,item:OrderItem){
    this.alertCtrl.create({
      title: 'Rembousement partiel',
      subTitle: item.quantity+'x '+item.title+' '+item.finalprice+' fr',      
      inputs:[{
        name: 'amount',
        placeholder: 'Max '+item.finalprice+' fr',
        type: 'number'
      }],
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
          handler: data => {
          }
        },{
          text: 'Rembouser',
          handler: data => {
            let tosave=Object.assign({},item);
            tosave.finalprice=tosave.finalprice-data.amount
            this.$order.refund(order,tosave).subscribe(
              ()=>{
                item.finalprice=tosave.finalprice;
                item.fulfillment=tosave.fulfillment;
                this.doToast("Montant: "+data.amount+" remboursé")
              },error=>this.doToast(error.error,error.status)      
            )        
          }
        }
      ]
    }).present();

  }

  doValidate(order, item){
    this.$order.updateItem(order,item,EnumFulfillments.fulfilled)
      .subscribe(ok=>{
        this.doToast("Validation enregistrée");
        //
        // when admin, we should remove other vendor items
        Object.assign(order,ok);
        order.items=order.items.filter(i=>i.vendor===item.vendor)
      },error=>this.doToast(error.error,error.status));
  }
  
  doCancel(order, item){
    this.$order.updateItem(order,item,EnumFulfillments.failure)
      .subscribe(ok=>{
        this.doToast("Annulation enregistrée");
        //
        // when admin, we should remove other vendor items
        Object.assign(order,ok);
        order.items=order.items.filter(i=>i.vendor===item.vendor)
      },error=>this.doToast(error.error,error.status));
  }

 
  doOpenProduct(item:OrderItem){
    this.$product.get(item.sku).subscribe(
      (product:Product)=>{
        this.navCtrl.push('ProductDetailPage',{
          product:product,
          user:this.user
        });    
      }
    )
  }
  
  doToast(msg,status?){
    if(status==401){
      this.events.publish('unauthorized');        
    }
    this.toast.create({
      message: msg,
      duration: 3000
    }).present()
  }

  doSelectAllPrice(event){
    if(event.inputElement){
      setTimeout(function() {
          try{event.inputElement.setSelectionRange(0, 9999);}catch(e){}
      }, 1);            
      return event.inputElement.select();
    }

    // check this on safari
    setTimeout(function() {
      try{event.target.setSelectionRange(0, 9999);}catch(e){}
    }, 1);            
    event.target.select();
  }

  doKeypress(kcode,order,item){
    //
    // case of enter
    if(kcode===13){
      this.doValidate(order,item);
    }
  }  

  getPhoneNumber(order:Order){
    if(!order||!order.customer.phoneNumbers||!order.customer.phoneNumbers.length){
      return false;
    }
    return order.customer.phoneNumbers[0].number;
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
    return (['paid','partially_refunded','manually_refunded'].indexOf(order.payment.status)>-1);
  } 



}
