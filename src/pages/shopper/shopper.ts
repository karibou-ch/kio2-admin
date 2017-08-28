import { Component, ViewChild } from '@angular/core';
import { Content, IonicPage, NavController, NavParams } from 'ionic-angular';
import { LoaderService, Order, OrderService, EnumFinancialStatus, User, UserService } from 'kng2-core';
import { ShopperItemComponent } from '../../components/shopper-item/shopper-item';
import { LogisticHeaderComponent }  from '../../components/logistic-header/logistic-header';
import 'rxjs/Rx';
import { Observable } from 'rxjs/Rx';
/**
 * Generated class for the ShopperPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
  selector: 'page-shopper',
  templateUrl: 'shopper.html'
})
export class ShopperPage {

  @ViewChild(LogisticHeaderComponent) header: LogisticHeaderComponent;

  isReady: boolean;
  user: User = new User();
  nbCabas;


  constructor(

  ) {


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
        if (!this.monthOrders[order.shipping.when.getTime()]) {
          this.monthOrders[order.shipping.when.getTime()] = [];
          this.availableOrders.push(new Date(order.shipping.when));
          console.log("availableOrders", this.availableOrders);
        }
        this.monthOrders[order.shipping.when.getTime()].push(order);
      });
      this.currentShippingDate = Order.currentShippingDay();
    })
  }





}
