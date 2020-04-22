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
  public item:any;
  public deltaPrice:number;

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

    this.deltaPrice=0;

    //
    // OrderItems[] for this vendor
    this.item = this.navParams.get('item')||{};
    this.orders = this.navParams.get('orders')||[];
    this.vendor = this.navParams.get('vendor')||'';
    this.shipping = this.navParams.get('shipping');
    this.user = this.navParams.get('user');
    
    if(this.orders.length == 1) {
      this.shipping = this.orders[0].shipping.when;
      this.computeDeltaPrice(this.orders[0]);
    }

    //
    // set vendor when not admin (filter after save)
    // FIXME only one shop will be considered
    if(!this.vendor && !this.user.isAdmin()) {
      this.vendor = this.user.shops.map(shop=>shop.urlpath)[0];
    }
    
    //
    // check content 
    if(this.orders.length && !this.item.sku){
      return;
    }
    //
    // create orders by Item
    console.log('---',this.item);
  }

  ngOnInit() {
    this.isReady= (this.orders.length>0)|| (this.vendor!='') || (!!this.shipping) || (!!this.item.customer);
    //console.log('-----',this.orders,(this.orders.length>0),(this.vendor!='') , (this.shipping!=null))
  }

  ngOnDestroy(){
    this.events.publish('refresh');        
  }

  computeDeltaPrice(order:Order){    
    let originAmount:number = 0;
    let finalAmount:number = order.getSubTotal();
    this.deltaPrice = 0;
    order.items.forEach((item) => {
      //
      // item should not be failure (fulfillment)
      if (item.fulfillment.status !== EnumFulfillments[EnumFulfillments.failure]) {
        originAmount += (item.price * item.quantity);
      }
    });
    this.deltaPrice = parseFloat((finalAmount/originAmount-1).toFixed(2)); 
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
              },error=>this.doToast(error.error,error)      
            )        
          }
        }
      ]
    }).present();

  }

  doValidateAll(order){
    const items = this.sortedItem(order);
    this.$order.updateItem(order,items,EnumFulfillments.fulfilled)
      .subscribe(ok=>{
        const len = 18;
        this.doToast("Articles du sac "+order.rank);
        Object.assign(order,ok);
        
        
        // FIXME this items filter should be on server for NON admin user
        // For Admin we should ALWAYS constraint to the vendor
        if(this.vendor){
          order.items=order.items.filter(i=>i.vendor===this.vendor);
        }

        this.computeDeltaPrice(order);
        console.log('---- vendor',this.vendor);
      },error=>this.doToast(error.error,error));
  }

  doValidate(order, item){
    this.$order.updateItem(order,[item],EnumFulfillments.fulfilled)
      .subscribe(ok=>{
        const len = 18;
        const title = item.title.substring(0,len)+(item.title.length>len?'...':'');
        this.doToast(title+" dans sac "+order.rank);
        Object.assign(order,ok);
        //
        // when not admin, we should remove other vendor items
        // FIXME this items filter should be on server
        if(!this.user.isAdmin()){
          order.items=order.items.filter(i=>i.vendor===item.vendor)
        }
        this.computeDeltaPrice(order);
      },error=>this.doToast(error.error,error));
  }
  
  doCancel(order, item){
    this.$order.updateItem(order,[item],EnumFulfillments.failure)
      .subscribe(ok=>{
        this.doToast("Annulation enregistrée");
        Object.assign(order,ok);
        //
        // when not admin, we should remove other vendor items
        // FIXME this items filter should be on server
        if(!this.user.isAdmin()){
          order.items=order.items.filter(i=>i.vendor===item.vendor)
        }        
        this.computeDeltaPrice(order);
      },error=>this.doToast(error.error,error));
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
  
  doToast(msg,error?){
    if(error&&error.status==401){
      this.events.publish('unauthorized');        
    }
    let params:any={
      message: msg,
      cssClass: 'toast-item',
      duration: 4000
    }
    if(error){
      params.position='top';
      params.cssClass='toast-error';
    }
    this.toast.create(params).present()
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

  sortedItem(order:Order) {
    return order.items.sort((a,b) => {
        const catCmp = a.category.localeCompare(b.category);
        if(catCmp !== 0) {
          return catCmp;
        }
        return a.vendor.localeCompare(b.vendor);
    });
  }

}

