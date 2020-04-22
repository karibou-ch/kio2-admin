import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events, ToastController } from 'ionic-angular';

import { Dialogs } from '@ionic-native/dialogs';

import { Order, 
         OrderService , 
         User, 
         LoaderService,
         EnumCancelReason,
         OrderItem} from 'kng2-core';

export class OrderByItem{
  oid:number;
  email:string;
  customer:any;
  rank:number;
  payment:{
    status:string;
  };
  item:OrderItem;
}         

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
  isReady:boolean;
  orderAvg:number;
  orderTotal:number;
  orderBaseAmount: number=0;
  searchFilter: string;
  items:{
    [sku: number]: (OrderByItem[]|any);
  };

  constructor(
    public dialogs:Dialogs,
    public events: Events,
    public navCtrl: NavController, 
    public navParams: NavParams,
    public toast:ToastController,
    public $loader:LoaderService,
    public $order:OrderService
  ) {
    this.orders=[];
    this.cache={};
    this.items={};
    this.$loader.ready().subscribe((loader)=>{
        Object.assign(this.user,loader[1]);
        if(this.user.isAdmin()){
          // change the average
          this.orderBaseAmount=0;
        }
    })
  }


  doRefresh(refresher){
    this.events.publish('refresh');    
    setTimeout(() => {
      refresher.complete();
    }, 1000);    
  }
  
  emailVendors(){
    // inform all shops: 'shops'||false
    // FIXME sent ISO date get wrong on server 
    const UTC = new Date(this.shipping);
    UTC.setHours(8);

    this.$order.informShopToOrders('shops',UTC).subscribe(
      (result)=>{
        this.onDone("Mail envoyé à "+Object.keys(result).length+" destinataire(s)")
      },err=>this.onDone(err.error)
    );
  }

  emailCustomers(){

  }

  //
  // group by items,
  // - sku, title, 
  // - progress/length (validated customers)
  // - status (not)
  //
  getOrderByItems(){
    let keys=Object.keys(this.items||{});
    if(!keys.length){
      this.mapOrderByItems();
      keys=Object.keys(this.items);
    }
    return keys.map(sku=>this.items[sku]).sort((a,b)=>b.quantity-a.quantity);
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


  getOrders(){
    if(!this.searchFilter){
      return this.orders;
    }
    return this.orders.filter(order => {
      const filter = order.oid+' '+order.email+' '+order.rank+' '+order.customer.displayName
      return filter.toLocaleLowerCase().indexOf(this.searchFilter.toLocaleLowerCase())>-1;
    });
  }

  isDeposit(order){
    // undefined test is for Bretzel 
    return order.shipping.deposit||(order.shipping.deposit==undefined);
  }

  isOrderCapturable(order:Order){
    // admin test should be outside 
    return (['voided','paid','partially_refunded','manually_refunded','invoice'].indexOf(order.payment.status)===-1) && (order.fulfillments.status==='fulfilled');
  }
  
  isOrderSelected(order:Order){

  }

  isPaid(order:Order){
    return (['paid','partially_refunded','manually_refunded'].indexOf(order.payment.status)>-1);
  } 
  
  isFulfilled(order:Order){
    if(!order){
      return false;
    }
    if(this.cache[order.oid]===undefined){
      this.cache[order.oid]=(order.getProgress());
    }
    return this.cache[order.oid]>=99.9;
  }

  mapOrderByItems(){
    this.items={};
    let orders=this.orders||[];
    
    //
    // group orders by items
    orders.forEach(order=>{
      order.items.forEach(item=>{
        //
        // initial Grouped Item 
        if(!this.items[item.sku]){
          this.items[item.sku]={};
          this.items[item.sku].sku=item.sku;
          this.items[item.sku].title=item.title;
          this.items[item.sku].quantity=0;
          this.items[item.sku].amount=0;
          this.items[item.sku].progress=0;
          this.items[item.sku].done=false;
          this.items[item.sku].vendor=item.vendor;
          this.items[item.sku].customers=[];
        }
        this.items[item.sku].amount+=item.finalprice;
        this.items[item.sku].quantity+=item.quantity;
        //
        // 
        this.items[item.sku].customers.push({
          oid:order.oid,
          email:order.email,
          customer:order.customer,
          payment:{
            status:order.payment.status
          },
          rank:order.rank,
          item:item
        } as OrderByItem);
      })
    });
    //
    // for each items, count progress of validated 
    Object.keys(this.items).forEach(sku=>{
      this.items[sku].progress=this.items[sku].customers.reduce((count, customer:OrderByItem)=>{
        return customer.item.fulfillment.status=='fulfilled'?(count+1):count;
      },0);
    });

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
        Object.assign(order,ok);
        this.onDone("Commande payée");
      },
      error=>{
        this.onDone(error.error);
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
          Object.assign(order,ok);
          this.onDone("Commande annulée");
        },
        error=>{
          this.onDone(error.error);
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
        this.onDone(error.error);
      }
    );
  }

  openByItem(item:any){
    this.navCtrl.push('ItemOrderPage',{
      item:item,
      shipping:this.shipping,
      user:this.user
    });

  }

  openByOrder(order){
    this.navCtrl.push('OrderItemsPage',{
      orders:[order],
      shipping:this.shipping,
      user:this.user
    });
  }

  onInitOrders([orders,shipping]:[Order[],Date]){
    // console.log('---- init odrers',orders.length, shipping);
    this.items={};
    this.orders = orders.sort(this.sortOrdersByRank);

    // 
    // use shipping day from 
    // force current shipping day 
    this.shipping=shipping || Order.currentShippingDay();
    this.isReady=true;
    // AVG
    this.orderTotal=this.orders.reduce((sum,order,i)=>{
      return order.getSubTotal()+sum+this.orderBaseAmount;
    },0);
    this.orderAvg=this.orderTotal/this.orders.length;
    
  }

  onSearchInput($event){
  }

  onSearchCancel($event){
    this.searchFilter=null;
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
