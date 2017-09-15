import { Component, EventEmitter, ElementRef, Output, ViewChild } from '@angular/core';
import { LoaderService, Order, OrderService, Shop, User } from 'kng2-core';
import { Events, NavController, NavParams, PopoverController } from 'ionic-angular';

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

  @Output() ordersToPage = new EventEmitter<Order[]>(); //execute data fetcher function of parent component
  @Output() ordersToTrack = new EventEmitter<Order[]>(); //execute data fetcher function of parent component
  
  closedShippings: boolean;
  monthOrders: Map<number, Order[]> = new Map();
  currentShippingDate: Date;
  pickerShippingDate:string;
  availableDates: Date[] = [];
  private isReady;
 

  filtersOrder: any;
  FLOATING = { payment: 'authorized' };  //not yet handled by producers
  LOCKED = { fulfillments: 'fulfilled,partial' };  //got by the producers (sub-group of FLOATING)

  

  constructor(
    public events: Events,
    private $loader: LoaderService,
    public navCtrl: NavController, 
    private orderSrv: OrderService,
    private popoverCtrl:PopoverController
    //private userSrv:UserService
  ) {
    // most init values depends on config and the loader
  }

  ngOnInit() {
    this.$loader.ready().subscribe((loader) => {
      this.currentShippingDate = Order.currentShippingDay();
      this.pickerShippingDate = this.currentShippingDate.toISOString();
      this.currentShippingDate.setHours(0, 0, 0,0);
      this.filtersOrder = this.FLOATING;
      this.isReady=true;
      this.findAllOrdersForShipping();
    })

    this.events.subscribe('refresh',()=>{
      this.findAllOrdersForShipping();
    })

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
    let selected=new Date(this.pickerShippingDate);
    this.currentShippingDate=new Date(this.pickerShippingDate);
    this.currentShippingDate.setHours(0, 0, 0,0);
    this.findAllOrdersForShipping();
  }

  //
  // this header component provide data for all pages
  findAllOrdersForShipping() {
    let params = { month: (new Date(this.currentShippingDate).getMonth()) + 1, year: new Date(this.currentShippingDate).getFullYear() };
    Object.assign(params, this.filtersOrder);
    this.monthOrders = new Map();
    this.availableDates = [];
    this.orderSrv.findAllOrders(params).subscribe(orders => {
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
      this.displayOrders(shipping);
    })
  }


  displayOrders(shipping?){
    if(!shipping){
      return this.ordersToPage.emit([]);
    }
    this.currentShippingDate = new Date(shipping);
    this.currentShippingDate.setHours(0, 0, 0, 0);
    this.ordersToPage.emit(this.monthOrders.get(this.currentShippingDate.getTime()));
  }
  

  openCollect(){
    this.navCtrl.push('CollectPage');
  }

  //
  // fire event to display Map
  openMap() {
    let orders=this.monthOrders.get(this.currentShippingDate.getTime());
    this.ordersToTrack.emit(orders);
  }

  //
  // http://ionicframework.com/docs/components/#popovers
  openSettings(event) {
    this.navCtrl.push('LogisticSettingsPage',{
      shipping:this.availableDates,
      current:this.currentShippingDate,
      toggle:(this.filtersOrder===this.FLOATING),
      component:this
    })
    // let popover = this.popoverCtrl.create(LogisticSettingsComponent);
    // popover.present();
  }  
}

