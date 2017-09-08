import { Component, ViewChild } from '@angular/core';
import { Content, IonicPage, ModalController, NavController, NavParams } from 'ionic-angular';
import { LoaderService, Order, OrderService, EnumFinancialStatus, User, UserService } from 'kng2-core';
import { ShopperItemComponent } from '../../components/shopper-item/shopper-item'
import 'rxjs/Rx';
import { Observable } from 'rxjs/Rx';
import { TrackerPage } from '../tracker/tracker';
/**
 * Generated class for the ShopperPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage({name:'shopper'})
@Component({
  selector: 'page-shopper',
  templateUrl: 'shopper.html'
})
export class ShopperPage {

  @ViewChild(Content) content: Content;


  isReady: boolean;
  user: User = new User();
  closedShippings: boolean; //"ouvertes", "fermées"
  nbCabas;

  FLOATING = { payment: 'authorized' };  //not yet handled by producers
  LOCKED = { fulfillments: 'fulfilled,partial' };  //got by the producers (sub-group of FLOATING)

  filtersOrder: any;

  selectedDate: string = new Date().toISOString();
  currentShippingDate: Date;
  availableOrders: Date[] = [];
  monthOrders: Map<number, Order[]> = new Map();

  constructor(
    private loaderSrv: LoaderService,
    private modalCtrl: ModalController,
    public navCtrl: NavController,
    public navParams: NavParams,
    private orderSrv: OrderService,
    private userSrv: UserService
  ) {
    this.currentShippingDate = Order.currentShippingDay();
    this.currentShippingDate.setHours(0, 0, 0);
    this.filtersOrder = this.FLOATING;

  }



  ngOnInit() {
    this.loaderSrv.ready().subscribe((loader) => {
      Object.assign(this.user, loader[1]);
      this.isReady = true;
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
    this.availableOrders = [];
    this.orderSrv.findAllOrders(params).subscribe(orders => {
      orders.forEach((order: Order) => {
        order.shipping.when = new Date(order.shipping.when);
        order.shipping.when.setHours(0, 0, 0)
        // Object.keys(this.monthOrders)
        if (!this.monthOrders.has(order.shipping.when.getTime())) {
          this.monthOrders.set(order.shipping.when.getTime(), []);
          this.availableOrders.push(order.shipping.when);
        }
        this.monthOrders.get(order.shipping.when.getTime()).push(order);
      });
      //set currentshipping with first key
      this.currentShippingDate = new Date(this.monthOrders.keys().next().value);

    })
  }

  openTracker() {
    this.modalCtrl.create(TrackerPage, { results: this.monthOrders.get(this.currentShippingDate.getTime()) }).present();
  }

  openTracker4One(order){
    this.modalCtrl.create(TrackerPage, { results: order }).present();

  }

  sortOrdersByCP(o1,o2){
    //TODO checking type of postalCode is always a number
    return (o1.shipping.postalCode|0)-(o2.shipping.postalCode|0);
  }

}
