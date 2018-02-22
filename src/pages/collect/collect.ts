import { Component } from '@angular/core';
import { Events, IonicPage, NavController, ToastController, NavParams } from 'ionic-angular';
import { EnumFulfillments, Order, OrderItem, OrderService, User } from 'kng2-core';

/**
 * Generated class for the CollectPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage({name:'CollectPage'})
@Component({
  selector: 'page-collect',
  templateUrl: 'collect.html',
})
export class CollectPage {

  orders:Order[];
  shipping:Date;
  toggleDisplay:boolean=false;
  vendors={
    list:[]
  };

  isReady: boolean;
  user: User = new User();

  constructor(
    public events: Events,
    public navCtrl: NavController,
    public navParams: NavParams,
    private $order: OrderService,
    private toast:ToastController
  ) {
    this.vendors.list=[];
    this.shipping=this.navParams.get('shipping');
  }

  doRefresh(refresher){
    this.events.publish('refresh');    
    setTimeout(() => {
      refresher.complete();
    }, 2000);    
  }

  doToast(msg){
    this.toast.create({
      message: msg,
      duration: 3000
    }).present()
  }
  

  //
  // groupd by vendors to prepare collect
  onInitOrders([orders,shipping]:[Order[],Date]){
    this.orders = orders;
    this.shipping=shipping;
    this.isReady=true;
    this.vendors={list:[]};
    this.orders.forEach(order=>{      
      order.items.forEach((item:OrderItem)=>{
        //
        // init item for this vendor
        if(!this.vendors[item.vendor]){
          this.vendors[item.vendor]={};
          Object.assign(this.vendors[item.vendor],order);          
          this.vendors[item.vendor].items=[];
          this.vendors.list.push(item.vendor);
        }
        // add item to this vendor
        this.vendors[item.vendor].items.push(item);

      })
    });
  }

  onSelectedOrders(orders:Order[]){
    this.toggleDisplay=!this.toggleDisplay;
  }  

  //
  // check if current vendor is already collected
  isCollected(vendor:string):boolean{
    let vendors={};
    this.orders.forEach(order=>{
          order.vendors.forEach(vendor=>{
            vendors[vendor.slug]=vendor.collected;
          });
    });
    return vendors[vendor];
  }

  filterOrderItemsByVendor(vendor){
    return this.orders.map(order=>{      
      let o=new Order(order);
      o.items=order.items.filter(order=>order.vendor===vendor)
      return o;
    }).filter(o=>o.items.length);
  }

  filterByDisplay(order){
    if(!this.toggleDisplay){
      return true;
    }
    return (order.items.filter(i=>i.fulfillment.status!==EnumFulfillments[EnumFulfillments.fulfilled]).length)>0;
  }

  openVendorItems(vendor:string){
    this.navCtrl.push('OrderItemsPage',{
      orders:this.filterOrderItemsByVendor(vendor),
      vendor:vendor,
      shipping:this.shipping
    });
  }

  setCollected(slug){
    this.orders.forEach(order=>{
          order.vendors.forEach(vendor=>{
            if(vendor.slug===slug)vendor.collected=true;
          });
    });
    
  }

  //
  // count items validated vs total items 
  getFulfilled(vendor:string):number{
    return this.vendors[vendor].items.reduce((count,item)=>{
      return (item.fulfillment.status===EnumFulfillments[EnumFulfillments.fulfilled])?(count+1):count;
    },0)
  }

  isFulfilled(vendor:string):boolean{
    return this.vendors[vendor].items.find(i=>i.fulfillment.status!==EnumFulfillments[EnumFulfillments.fulfilled]);
  }


  getAmount(vendor:string):number{
    return this.vendors[vendor].items.reduce((amount,item)=>
      (item.fulfillment.status!==EnumFulfillments[EnumFulfillments.failure])?(amount+item.finalprice):amount
    ,0).toFixed(2);
  }

  // ionViewCanEnter() {
  //   return this.userSrv.currentUser.isAuthenticated();
  // }

  ionViewDidLoad() {
    // this.loaderSrv.ready().subscribe((loader) => {
    //   Object.assign(this.user, loader[1]);
    //   this.isReady = true;
    // })
  }

  updateCollect(vendor) {
    let when=this.vendors[vendor].shipping.when;
    when.setHours(22,0,0,0);
    this.$order.updateCollect(vendor,true,when)
      .subscribe(ok=>{
        this.doToast("Collecte enregistrée");
        this.setCollected(vendor);
      },error=>this.doToast(error.text()))
  };



  //
  //
  selectOrderByShop=function(shop){
    // if(!shop){
    //   $scope.selected.items=[];
    //   $scope.selected.shop=false;        
    //   return;
    // }
    // $scope.selected.items=$scope.shops[shop];
    // $scope.selected.shop=shop;
  };

}
