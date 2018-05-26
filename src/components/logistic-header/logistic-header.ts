import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LoaderService, Order, OrderService, User, UserService } from 'kng2-core';
import { Events, NavController, ToastController } from 'ionic-angular';
import { Network } from '@ionic-native/network';
import { Subscription } from 'rxjs';


/**
 * Generated class for the LogisticHeaderComponent component.
 *
 * See https://angular.io/docs/ts/latest/api/core/index/ComponentMetadata-class.html
 * for more info on Angular Components.
 */
@Component({
  selector: 'logistic-header',
  templateUrl: 'logistic-header.html'
})
export class LogisticHeaderComponent {

  @Input() currentShippingDate: Date;
  @Input() stock:boolean;
  @Input() vendor:boolean;
  @Input('collect') hideCollect:boolean=false;
  @Output() doInitOrders = new EventEmitter<[Order[],Date]>(); //execute data fetcher function of parent component
  @Output() doSelectedOrders = new EventEmitter<[Order[],Date]>(); //execute data fetcher function of parent component
  
  user:User=new User();
  closedShippings: boolean;
  monthOrders: Map<number, Order[]> = new Map();
  pickerShippingDate:string;
  availableDates: Date[] = [];
  isReady;
  isNetworkReady:boolean=true;
  netSubs:Subscription;
  filtersOrder: any;
  FLOATING = { payment: 'authorized' };  //not yet handled by producers
  LOCKED = { fulfillments: 'fulfilled,partial' };  //got by the producers (sub-group of FLOATING)

  

  constructor(
    public events: Events,
    private $loader: LoaderService,
    public navCtrl: NavController, 
    private $network: Network,
    private $order: OrderService,
    private toast:ToastController,
    private $user:UserService

    //private userSrv:UserService
  ) {
    // most init values depends on config and the loader
  }

  displayMsg(msg:string){
    this.toast.create({
      message: msg,
      duration: 3000
    }).present();
  }

  ngOnDestroy(){
    this.netSubs.unsubscribe();
  }

  ngOnInit() {
    // keep in touch! shop1@karibou.ch
    this.$user.subscribe(user=>{
      Object.assign(this.user,user);
    });

    this.netSubs=this.$network.onchange().subscribe(() => {
      this.isNetworkReady=(this.$network.type!='none');
    });

    this.$loader.ready().subscribe((loader) => {
      //
      // FIXME issue with stream ordering (test right fter a login)
      this.user=(this.user.id)?this.user:loader[1];

      this.currentShippingDate = this.currentShippingDate||Order.currentShippingDay();
      this.pickerShippingDate = this.currentShippingDate.toISOString();
      this.currentShippingDate.setHours(0, 0, 0,0);
      this.filtersOrder = this.FLOATING;
      this.isReady=true;
      this.findAllOrdersForShipping();

      //
      // the case of hiding collect button
      if(!this.hideCollect&&!this.user.isAdmin()&&!this.user.hasRole('logistic')){
        this.hideCollect=true;
      }
    })

    this.events.subscribe('refresh',()=>{
      this.findAllOrdersForShipping();
    });


  }

  //
  // on toggle orders filter
  toggleShippingFilter() {
    if (this.filtersOrder.payment) {
      this.filtersOrder = this.LOCKED;
    } else {
      this.filtersOrder = this.FLOATING;
    }
    this.findAllOrdersForShipping();
  }

  //
  // on selected date
  updateDateFromPicker(){
    // let selected=new Date(this.pickerShippingDate);
    this.currentShippingDate=new Date(this.pickerShippingDate);
    this.currentShippingDate.setHours(0, 0, 0,0);
    this.findAllOrdersForShipping();
  }

  //
  // this header component provide data for all pages
  findAllOrdersForShipping() {
    let Orders;
    let params = { month: (new Date(this.currentShippingDate).getMonth()) + 1, year: new Date(this.currentShippingDate).getFullYear() };
    Object.assign(params, this.filtersOrder);
    this.monthOrders = new Map();
    this.availableDates = [];

    //
    // check orders source
    // console.log('------------load ',this.user)
    if(this.user.shops.length){
      Orders=this.$order.findOrdersByShop(null,params);
    }else{
      Orders=this.$order.findAllOrders(params);      
    }
    
    Orders.subscribe(orders => {
      orders.forEach((order: Order) => {        
        order.shipping.when = new Date(order.shipping.when);
        order.shipping.when.setHours(0, 0, 0,0)
        // Object.keys(this.monthOrders)
        if (!this.monthOrders.get(order.shipping.when.getTime())) {
          this.monthOrders.set(order.shipping.when.getTime(), []);
          this.availableDates.push(order.shipping.when);
        }
        this.monthOrders.get(order.shipping.when.getTime()).push(order);
      });
      //set currentshipping with first key
      let shipping=(this.monthOrders.get(this.currentShippingDate.getTime()))?
            this.currentShippingDate:this.monthOrders.keys().next().value;
      this.initOrders(shipping);
    },error=>{
      //Cette fonctionalité est réservée à la logistique
      this.displayMsg(error.error);
    })
  }


  initOrders(shipping?){
    if(!shipping){
      return this.doInitOrders.emit([[],this.currentShippingDate]);
    }
    this.currentShippingDate = new Date(shipping);
    this.currentShippingDate.setHours(0, 0, 0, 0);
    this.doInitOrders.emit([this.monthOrders.get(this.currentShippingDate.getTime()),this.currentShippingDate]);
  }
  

  openCollect(){
    this.navCtrl.push('CollectPage',{
      shipping:this.currentShippingDate
    });
  }

  openStock(){
    this.navCtrl.push('ProductsPage');
  }

  openVendor(){
    this.navCtrl.push('VendorPage');
  }
    
  //
  // fire event to display Map
  openMap() {
    let orders=this.monthOrders.get(this.currentShippingDate.getTime());
    this.doSelectedOrders.emit([orders,this.currentShippingDate]);
  }

  //
  // http://ionicframework.com/docs/components/#popovers
  openSettings(event) {
    this.navCtrl.push('AdminSettingsPage',{
      shipping:this.availableDates,
      current:this.currentShippingDate,
      toggle:(this.filtersOrder===this.FLOATING),
      component:this
    })
    // let popover = this.popoverCtrl.create(LogisticSettingsComponent);
    // popover.present();
  }  
}

