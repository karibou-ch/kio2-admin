import { Injectable } from '@angular/core';
import { User, Order, OrderService } from 'kng2-core';
import { ReplaySubject } from 'rxjs';

//
// orders and context used by subject$
export interface OrdersCtx {
  orders: Order[];
  when: Date;
}

@Injectable({
  providedIn: 'root'
})
export class EngineService {

  // Local storage of orders
  private monthOrders: Map<number, Order[]> = new Map();


  //
  // get only authorized orders (IN PROCESSING)
  OPEN = { payment: 'authorized' };

  //
  // get fulfilled Orders, means paid,authorized or refunded
  LOCKED = { fulfillments: 'fulfilled,partial' };

  defaultFormat = 'EEEE d MMM';

  orderStatus: any;
  shippingDate: Date;

  //
  // calendar of loaded Orders
  shippingWeek: Date[];

  selectedOrders$: ReplaySubject<OrdersCtx>;

  user: User;

  constructor(public $order: OrderService) {

    //
    // order params
    this.orderStatus = this.OPEN;
    this.currentShippingDate = (new Date()).dayToDates([2, 3, 4, 5, 6])[0];
    this.selectedOrders$ = new ReplaySubject<OrdersCtx>(1);
  }

  get availableDates() {
    return this.shippingWeek;
  }

  set currentUser(user: User) {
    this.user = user;
  }
  get currentUser() {
    return this.user;
  }

  set currentShippingDate(date: Date) {
    this.shippingDate = date;
  }

  get currentShippingDate() {
    return this.shippingDate;
  }


  //
  // load orders for Shipping and for Vendors
  findAllOrdersForShipping() {

    //
    // order settings
    const params = Object.assign({}, this.orderStatus);
    params.month = (new Date(this.currentShippingDate).getMonth()) + 1;
    params.year = new Date(this.currentShippingDate).getFullYear();
    params.padding = true;


    this.monthOrders = new Map();
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

      // FIXME, when currentDay is empty (orders == 0) then keys().next().value is wrong
      let closestValue = 9000000000000;
      this.monthOrders.forEach((orders, time) => {
        closestValue = Math.min(closestValue, time);
      });

      //
      // update currentshipping that containes orders
      const currentTime = this.currentShippingDate.getTime();
      this.currentShippingDate = (this.monthOrders.has(currentTime)) ?
        this.currentShippingDate : (new Date(closestValue));

      //
      // sort shipping dates
      this.shippingWeek = this.shippingWeek.sort((a: Date, b: Date) => a.getTime() - b.getTime());


      //
      // publish content
      const result = (this.monthOrders.get(this.currentShippingDate.getTime())) || [];
      this.selectedOrders$.next({
        orders: result,
        when: this.currentShippingDate
      } as OrdersCtx);
    }, error => {
      // Cette fonctionalité est réservée à la logistique
      this.selectedOrders$.error(error);
    });
  }

  refresh() {
    return this.findAllOrdersForShipping();
  }

  toggleOrderStatus() {
    this.orderStatus = (this.orderStatus.payment) ? this.LOCKED : this.OPEN;
    this.findAllOrdersForShipping();
  }

}
