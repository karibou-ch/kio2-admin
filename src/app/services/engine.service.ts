import { Injectable } from '@angular/core';
import { User, Order, OrderService, Product, Config } from 'kng2-core';
import { ReplaySubject, from } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

//
// orders and context used by subject$
export interface OrdersCtx {
  orders: Order[];
  when: Date;
}

export interface OrderStatus {
  running: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EngineService {

  // Local storage of orders
  private monthOrders: Map<number, Order[]> = new Map();
  private orderStatus: any;
  private shippingDate: Date;
  private config: Config;
  private user: User;

  private cached: any;

  //
  // calendar of loaded Orders
  shippingWeek: Date[];


  //
  // get only authorized orders (IN PROCESSING)
  OPEN = { payment: 'authorized' };

  //
  // get fulfilled Orders, means paid,authorized or refunded
  ARCHIVE = { fulfillments: 'fulfilled,partial' };

  defaultFormat = 'EEEE d MMM';


  selectedOrders$: ReplaySubject<OrdersCtx>;
  status$: ReplaySubject<OrderStatus>;


  constructor(
    private $order: OrderService,
    private $route: ActivatedRoute,
    ) {

    //
    // order params
    this.initDate();
    this.orderStatus = this.OPEN;
    this.selectedOrders$ = new ReplaySubject<OrdersCtx>(1);
    this.status$ = new ReplaySubject(1);
    this.cached = {};
    this.user = new User();
  }

  initDate() {
    const today = new Date();
    this.currentShippingDate = today.dayToDates([2, 3, 4, 5, 6])[0];
  }

  get availableDates() {
    return this.shippingWeek;
  }
  set currentConfig(config: Config) {
    this.config = config;
  }
  get currentConfig() {
    return this.config;
  }


  set currentUser(user: User) {
    this.user = user;
  }
  get currentUser() {
    return this.user;
  }

  setCurrentProduct(product: Product) {
    this.cached[product.sku] = product;
  }

  getCurrentProduct(sku) {
    return this.cached[sku];
  }

  set currentShippingDate(date: Date) {
    this.shippingDate = date;
  }

  get currentShippingDate() {
    return this.shippingDate;
  }

  get currentOrderStatus() {
    return (!!this.orderStatus.payment);
  }

  getOrdersByDay(shipping: Date) {
    return (this.monthOrders.get(shipping.getTime())) || [];
  }
  //
  // load orders for Shipping and for Vendors
  findAllOrders() {

    //
    // check for preferred day (in week)
    const queryWhen: number = parseInt(this.$route.snapshot.queryParamMap.get('when'), 10);
    this.status$.next({running: true});
    //
    // order settings

    const params = Object.assign({}, this.orderStatus);
    params.month = (new Date(this.currentShippingDate).getMonth()) + 1;
    params.year = new Date(this.currentShippingDate).getFullYear();
    if (this.orderStatus.payment) {
      params.padding = true;
    }



    this.monthOrders = new Map();
    this.monthOrders.clear();
    this.shippingWeek = [];


    //
    // use right orders source
    const orders$ = (this.user.shops.length) ?
        this.$order.findOrdersByShop(null, params) : this.$order.findAllOrders(params);

    orders$.subscribe(orders => {

      orders.forEach((order: Order) => {
        order.shipping.when = new Date(order.shipping.when);
        order.shipping.when.setHours(0, 0, 0, 0);
        const orderTime = order.shipping.when.getTime();
        if (!this.monthOrders.has(orderTime)) {
          this.monthOrders.set(orderTime, []);
          this.shippingWeek.push(order.shipping.when);
        }

        this.monthOrders.get(orderTime).push(order);
      });

      //
      // get the must recent value
      const times = Array.from(this.monthOrders.keys()).sort((a, b) => a - b);


      //
      // sort shipping dates
      this.shippingWeek = this.shippingWeek.sort((a: Date, b: Date) => a.getTime() - b.getTime());

      //
      // publish status
      this.status$.next({running: false});

      //
      // select current Times
      const currentTime = this.currentShippingDate.getTime();
      let preferredWhen;

      if (queryWhen && this.monthOrders.get(queryWhen)) {
        preferredWhen = queryWhen;
      } else
      if (this.monthOrders.get(currentTime)) {
        preferredWhen = currentTime;
      } else
      if (times[0]) {
        preferredWhen = times[0]
      } else {
        preferredWhen = currentTime;
      }


      //
      // update currentshipping that containes orders
      this.currentShippingDate = new Date(preferredWhen);


      //
      // publish content
      const result = (this.monthOrders.get(preferredWhen)) || [];
      this.selectedOrders$.next({
        orders: result,
        when: this.currentShippingDate
      } as OrdersCtx);
    }, error => {
      // publish status
      this.status$.next({running: false});
      // Cette fonctionalité est réservée à la logistique
      this.selectedOrders$.error(error);
    });
  }

  refresh() {
    return this.findAllOrders();
  }

  selectOrderArchives(archive: boolean) {
    this.orderStatus = (archive) ? this.ARCHIVE : this.OPEN;
    this.findAllOrders();
  }

}
