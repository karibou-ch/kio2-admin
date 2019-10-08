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

  @Input() format:string="d MMM y";
  @Input() title:string="";
  @Input() month:number;
  @Input() year:number;

  @Input() currentShippingDate: Date;
  @Input() stock:boolean;
  @Input() vendor:boolean;
  @Input('orders') hideOrders:boolean=false;
  @Input('collect') hideCollect:boolean=false;
  @Output() doInitOrders = new EventEmitter<[Order[],Date,Date[],string]>(); //execute data fetcher function of parent component
  @Output() doSelectedOrders = new EventEmitter<[Order[],Date]>(); //execute data fetcher function of parent component

  // Keep options in memory cross windows
  static filtersOrder: any;


  user:User=new User();
  closedShippings: boolean;
  monthOrders: Map<number, Order[]> = new Map();
  pickerShippingDate:string;
  availableDates: Date[] = [];
  isReady;
  isNetworkReady:boolean=true;
  inAdvance:number;
  netSubs:Subscription;
  OPEN = { payment: 'authorized' };  //not yet handled by producers
  LOCKED = { fulfillments: 'fulfilled,partial' };  //got by the producers (sub-group of OPEN)

  

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
    //
    // IMPORTANT
    this.events.unsubscribe("refresh");
    if(this.netSubs){
      this.netSubs.unsubscribe();
    }
  }

  ngOnInit() {
    // keep in touch! 

    this.$user.subscribe(user=>{
      Object.assign(this.user,user);
    });

    try{
      this.netSubs=this.$network.onchange().subscribe(() => {
        this.isNetworkReady=(this.$network.type!='none');
      });  
    }catch(e){
      console.log('----- $network service error',e.message)
    }

    this.$loader.ready().subscribe((loader) => {
      let pickerDate;
      LogisticHeaderComponent.filtersOrder = LogisticHeaderComponent.filtersOrder||this.OPEN;
      //
      // FIXME issue with stream ordering (test right fter a login)
      this.user=(this.user&&this.user.id)?this.user:loader[1];      
      this.currentShippingDate = this.currentShippingDate||Order.currentShippingDay();
      //
      // initial picker date
      pickerDate=new Date(this.currentShippingDate);
      if(this.month){
        pickerDate.setMonth((this.month)-1);
      }
      if(this.year){
        pickerDate.setYear(this.year);
      }

      this.pickerShippingDate = pickerDate.toISOString();
      this.currentShippingDate.setHours(0, 0, 0, 0);


      this.findAllOrdersForShipping();

      //
      // the case of hiding collect button
      if(!this.hideCollect&&!this.user.isAdmin()&&!this.user.hasRole('logistic')){
        this.hideCollect=true;
      }
      //
      // case of orders button
      if(!this.hideOrders&&!this.user.isAdmin()){
        this.hideOrders=true;
      }
      this.isReady=true;      
    })

    //
    // refresh
    this.events.subscribe('refresh',this.findAllOrdersForShipping.bind(this));

  }

  //
  // on toggle orders filter
  toggleShippingFilter() {
    if (LogisticHeaderComponent.filtersOrder.payment) {
      LogisticHeaderComponent.filtersOrder = this.LOCKED;
    } else {
      LogisticHeaderComponent.filtersOrder = this.OPEN;
    }
    this.findAllOrdersForShipping();
  }

  //
  // on selected date
  updateDateFromPicker(){
    this.currentShippingDate=new Date(this.pickerShippingDate);

    this.currentShippingDate.setHours(0, 0, 0,0);
    this.currentShippingDate.setDate(2);
    this.pickerShippingDate = this.currentShippingDate.toISOString();

    this.findAllOrdersForShipping();
  }

  //
  // this header component provide data for all pages
  findAllOrdersForShipping() {

    let Orders;
    let params = { 
      month: (new Date(this.currentShippingDate).getMonth()) + 1, 
      year: new Date(this.currentShippingDate).getFullYear(),
      padding:true
    };
    Object.assign(params, LogisticHeaderComponent.filtersOrder);
    this.monthOrders = new Map();
    this.availableDates = [];

    //
    // check orders source
    if(this.user.shops.length){
      Orders=this.$order.findOrdersByShop(null,params);
    }else{
      Orders=this.$order.findAllOrders(params);      
    }
    
    Orders.subscribe(orders => {
      orders.forEach((order: Order) => {        
        order.shipping.when = new Date(order.shipping.when);
        order.shipping.when.setHours(0, 0, 0,0)
        if (!this.monthOrders.get(order.shipping.when.getTime())) {
          this.monthOrders.set(order.shipping.when.getTime(), []);
          this.availableDates.push(order.shipping.when);
        }
        this.monthOrders.get(order.shipping.when.getTime()).push(order);
      });

      //
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
    let current=Order.currentShippingDay();
    if(!shipping){
      return this.doInitOrders.emit([[],this.currentShippingDate,this.availableDates,this.pickerShippingDate]);
    }
    this.currentShippingDate = new Date(shipping);
    this.currentShippingDate.setHours(0, 0, 0, 0);
    if(this.currentShippingDate>current){

    }
    this.doInitOrders.emit([this.monthOrders.get(this.currentShippingDate.getTime()),this.currentShippingDate,this.availableDates,this.pickerShippingDate]);
    
  }
  

  openCollect(){
    this.navCtrl.push('CollectPage',{
      shipping:this.currentShippingDate
    });
  }

  openOrders(){
    this.navCtrl.push('OrderCustomersPage');    
  }

  openStock(){
    this.navCtrl.push('ProductsPage',{
      user:this.user
    });
  }

  openVendor(){
    this.navCtrl.push('VendorPage',{
      user:this.user      
    });
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
      toggle:(LogisticHeaderComponent.filtersOrder.payment&&true),
      component:this,
      user:this.user
    })
    // let popover = this.popoverCtrl.create(LogisticSettingsComponent);
    // popover.present();
  }  
}

