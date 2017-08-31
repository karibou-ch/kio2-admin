import { Component, EventEmitter, Output } from '@angular/core';
import { LoaderService, Order, OrderService, Shop, User } from 'kng2-core';
import { ModalController, NavController, NavParams } from 'ionic-angular';
import { TrackerPage } from '../../pages/tracker/tracker';
import 'rxjs/Rx';

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
  closedShippings: boolean;
  monthCommands: Map<number, Shop[]> = new Map();
  monthOrders: Map<number, Order[]> = new Map();
  currentShippingDate: Date;
  selectedDate: string = new Date().toISOString();
  availableDates: Date[] = [];
  private isReady;
 

  filtersOrder: any;
  FLOATING = { payment: 'authorized' };  //not yet handled by producers
  LOCKED = { fulfillments: 'fulfilled,partial' };  //got by the producers (sub-group of FLOATING)

  

  constructor(
    private modalCtrl: ModalController,
    private loaderSrv: LoaderService,
    public navCtrl: NavController, 
    public navParams: NavParams,
    private orderSrv: OrderService,
    //private userSrv:UserService
  ) {
    this.currentShippingDate = Order.currentShippingDay();
    this.currentShippingDate.setHours(0, 0, 0);
    this.filtersOrder = this.FLOATING;
  }

  ngOnInit() {
    this.loaderSrv.ready().subscribe((loader) => {
      //Object.assign(this.user, loader[1]);
      this.isReady=true;
      this.findAllOrdersForShipping();
    })
  }

  toggleFilter() {
    if (this.filtersOrder.payment) {
      this.filtersOrder = this.LOCKED;
    } else {
      this.filtersOrder = this.FLOATING;
    }
    this.findAllOrdersForShipping();
  }

  findAllOrdersForShipping() {
    let params = { month: (new Date(this.selectedDate).getMonth()) + 1, year: new Date(this.selectedDate).getFullYear() };
    Object.assign(params, this.filtersOrder);
    this.monthOrders = new Map();
    this.availableDates = [];
    this.orderSrv.findAllOrders(params).subscribe(orders => {
      orders.forEach((order: Order) => {
        order.shipping.when = new Date(order.shipping.when);
        order.shipping.when.setHours(0, 0, 0)
        // Object.keys(this.monthOrders)
        if (!this.monthOrders.has(order.shipping.when.getTime())) {
          this.monthOrders.set(order.shipping.when.getTime(), []);
          this.availableDates.push(order.shipping.when);
        }
        this.monthOrders.get(order.shipping.when.getTime()).push(order);
      });
      //set currentshipping with first key
      this.currentShippingDate = new Date(this.monthOrders.keys().next().value);
      this.displayOrders(this.currentShippingDate);
    })
  }

  displayOrders(shipping:Date){
    this.currentShippingDate = shipping;
    this.ordersToPage.emit(this.monthOrders.get(this.currentShippingDate.getTime()));
  }
  
  openTracker() {
    this.modalCtrl.create(TrackerPage, { results: this.monthOrders.get(this.currentShippingDate.getTime()) }).present();
  }
}
