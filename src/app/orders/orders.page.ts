import { Component, OnInit } from '@angular/core';
import { EngineService, OrderStatus, OrdersCtx } from '../services/engine.service';
import { User, LoaderService, OrderService, Order, OrderItem, EnumCancelReason } from 'kng2-core';
import { ToastController, PopoverController, ModalController } from '@ionic/angular';
import { CalendarPage } from '../calendar/calendar.page';
import { OrdersItemsPage, OrdersByItemsPage } from './orders-items.page';
import { Router, ActivatedRoute } from '@angular/router';

export class OrderByItem {
  oid: number;
  email: string;
  customer: any;
  rank: number;
  payment: {
    status: string;
  };
  index: string;
  item: OrderItem;
}

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
})
export class OrdersCustomerPage {


  format: string;
  user: User = new User();
  shipping: Date;
  orders: Order[];
  cache: any;
  isReady: boolean;
  orderAvg: number;
  orderTotal: number;
  orderBaseAmount = 0;
  displayByItems: boolean;
  hubs: any;
  items: {
    [sku: number]: (OrderByItem[]|any);
  };

  pickerShippingDate: string;
  searchFilter: string;


  constructor(
    private $engine: EngineService,
    private $modal: ModalController,
    public $toast: ToastController,
    public $loader: LoaderService,
    private $popup: PopoverController,
    private $route: ActivatedRoute,
    private $router: Router,
    public $order: OrderService
  ) {
    this.orders = [];
    this.cache = {};
    this.items = {};
  }

  ngOnInit() {
    //
    // load Hubs
    this.hubs = {undefined: { prefix: ''}};
    (this.$engine.currentConfig.shared.hubs || []).forEach(hub => {
      this.hubs[hub.id] = hub;
      this.hubs[hub.id].prefix = hub.name[0].toUpperCase();
    });

    this.format = this.$engine.defaultFormat;
    this.user = this.$engine.currentUser;
    if (this.user.isAdmin()) {
      // change the average
      this.orderBaseAmount = 0;
    }

    //
    // use correct date
    this.initDate();

    this.$engine.status$.subscribe(this.onEngineStatus.bind(this));
    this.$engine.selectedOrders$.subscribe(this.onInitOrders.bind(this));
    this.$engine.findAllOrders();
    this.$order.order$.subscribe(order => {
      const idx = this.orders.findIndex(o => o.oid === order.oid);
      if( idx > -1) {
        this.orders[idx] = order;
      }
    });
  }


  doRefresh(refresher) {
    // this.events.publish('refresh');
    // setTimeout(() => {
    //   refresher.complete();
    // }, 1000);
  }

  emailVendors() {
    // inform all shops: 'shops'||false
    // FIXME sent ISO date get wrong on server
    const UTC = new Date(this.shipping);
    UTC.setHours(8);

    this.$order.informShopToOrders('shops', UTC).subscribe(
      (result) => {
        this.onDone('Mail envoyé à '+ Object.keys(result).length +' destinataire(s)');
      }, err => this.onDone(err.error)
    );
  }

  emailCustomers() {

  }

  //
  // group by items,
  // - sku, title,
  // - progress/length (validated customers)
  // - status (not)
  //
  getOrderByItems() {
    const keys = Object.keys(this.items);
    return keys.map(sku => this.items[sku])
          .filter(item => !this.cache.searchFilter || item.title.toLocaleLowerCase().indexOf(this.cache.searchFilter) > -1)
          .sort((a, b) => b.quantity - a.quantity);
  }

  sortedItem(order: Order) {
    return order.items.sort((a, b) => {
        const catCmp = a.category.localeCompare(b.category);
        if (catCmp !== 0) {
          return catCmp;
        }
        return a.vendor.localeCompare(b.vendor);
    });
  }


  //
  // get orders by HUB
  getOrders() {
    if (!this.searchFilter) {
      return this.orders;
    }
    return this.orders.filter(order => {
      const filter = order.oid + ' ' + order.email + ' ' + order.rank + ' ' + order.customer.displayName;
      return filter.toLocaleLowerCase().indexOf(this.searchFilter.toLocaleLowerCase()) > -1;
    });
  }

  getOrderRank(order: Order) {
    const prefix = this.hubs[order.hub].prefix;
    return prefix + order.rank;
  }

  initDate() {
    const currentDate = this.$engine.currentShippingDate;
    const queryWhen = new Date(+this.$route.snapshot.queryParams.when);
    const month = isNaN(queryWhen.getTime()) ? (currentDate.getMonth() + 1) : queryWhen.getMonth() + 1;
    const year = isNaN(queryWhen.getTime()) ? (currentDate.getFullYear()) : queryWhen.getFullYear();

    currentDate.setFullYear(year);
    currentDate.setMonth(month - 1);
    //
    // constraint Date engine with month/year
    this.$engine.currentShippingDate = currentDate;

    //
    // use full Date for Display
    this.pickerShippingDate = isNaN(queryWhen.getTime()) ? currentDate.toISOString() : queryWhen.toISOString();
  }

  isDeposit(order) {
    // undefined test is for Bretzel
    return order.shipping.deposit || (order.shipping.deposit == undefined);
  }

  isOrderCapturable(order: Order) {
    // admin test should be outside
    return (['voided', 'paid', 'partially_refunded', 'manually_refunded', 'invoice'].indexOf(order.payment.status) === -1) && (order.fulfillments.status === 'fulfilled');
  }

  isOrderSelected(order: Order) {

  }

  isPaid(order: Order) {
    return (['paid', 'partially_refunded', 'manually_refunded'].indexOf(order.payment.status) > -1);
  }

  isFulfilled(order: Order) {
    if (!order) {
      return false;
    }
    if (this.cache[order.oid] === undefined) {
      this.cache[order.oid] = (order.getProgress());
    }
    return this.cache[order.oid] >= 99.9;
  }

  mapOrderByItems() {
    this.items = {};
    const orders = this.orders || [];

    //
    // group orders by items
    orders.forEach(order => {
      order.items.forEach(item => {
        //
        // initial Grouped Item
        if (!this.items[item.sku]) {
          this.items[item.sku] = {};
          this.items[item.sku].sku = item.sku;
          this.items[item.sku].title = item.title;
          this.items[item.sku].quantity = 0;
          this.items[item.sku].amount = 0;
          this.items[item.sku].progress = 0;
          this.items[item.sku].done = false;
          this.items[item.sku].vendor = item.vendor;
          this.items[item.sku].customers = [];
        }
        this.items[item.sku].amount += item.finalprice;
        this.items[item.sku].quantity += item.quantity;
        //
        //
        this.items[item.sku].customers.push({
          oid: order.oid,
          email: order.email,
          customer: order.customer,
          payment: {
            status: order.payment.status
          },
          rank: order.rank,
          item
        } as OrderByItem);
      });
    });
    //
    // for each items, count progress of validated
    Object.keys(this.items).forEach(sku => {
      this.items[sku].progress = this.items[sku].customers.reduce((count, customer: OrderByItem) => {
        return customer.item.fulfillment.status == 'fulfilled' ? (count + 1) : count;
      }, 0);
    });

  }

  onDone(msg) {
    this.$toast.create({
      message: msg,
      duration: 3000
    }).then(alert => alert.present());

  }

  orderCapture(order: Order) {
    this.$order.capture(order).subscribe(
      (ok) => {
        Object.assign(order, ok);
        this.onDone('Commande payée');
      },
      error => {
        this.onDone(error.error);
      }
    );

  }

  orderCancel(order: Order) {
    // FIXME
    // this.dialogs.confirm('SUPPRIMER LA COMMANDE').then(action => {
    //   // 0:dismiss,1:OK,2:cancel
    //   if (action != 1) {
    //     return;
    //   }
    //   this.$order.cancelWithReason(order, EnumCancelReason.customer).subscribe(
    //     (ok) => {
    //       Object.assign(order, ok);
    //       this.onDone('Commande annulée');
    //     },
    //     error => {
    //       this.onDone(error.error);
    //     }
    //   );

    // });
  }

  orderShippingFees(order) {
    this.$order.updateShippingPrice(order, order.payment.fees.shipping).subscribe(
      (ok) => {
        this.onDone('Livraison modifiée');
      },
      error => {
        this.onDone(error.error);
      }
    );
  }

  async openCalendar($event) {
    const pop = await this.$popup.create({
      component: CalendarPage,
      translucent: true,
      event: $event,
      componentProps: {
        orders: this.orders
      }
    });

    //
    // when a shipping date is selected
    pop.onDidDismiss().then(result => {
      if (result.data) {
        const when = result.data[0];
        const orders = this.$engine.getOrdersByDay(when);
        this.$router.navigate([], { queryParams: { when: (when.getTime()) }});

        this.onInitOrders({
          orders: (orders),
          when: (when)
        } as OrdersCtx);
      }
    });

    return await pop.present();

  }

  openByItem(item: any) {
    // this.navCtrl.push('ItemOrderPage', {
    //   item,
    //   shipping: this.shipping,
    //   user: this.user
    // });

    const params = {
      item: (item),
      shipping: this.shipping
    }
    this.$modal.create({
      component: OrdersByItemsPage,
      componentProps: params
    }).then(alert => alert.present());

  }

  openByOrder(order) {
    const params = {
      orders: [order],
      shipping: this.shipping
    }
    this.$modal.create({
      component: OrdersItemsPage,
      componentProps: params
    }).then(alert => alert.present());
  }

  //
  // on selected date
  onDatePicker() {
    const date = new Date(this.pickerShippingDate);
    date.setHours(0, 0, 0, 0);
    date.setDate(1);


    this.pickerShippingDate = date.toISOString();
    this.$engine.currentShippingDate = date;
    this.$engine.findAllOrders();

    //
    // update route
    this.$router.navigate([], { queryParams: { when: (date.getTime()) }});
  }

  onEngineStatus(status: OrderStatus) {
    this.isReady = !status.running;
  }

  onInitOrders(ctx: OrdersCtx) {
    this.items = {};
    this.orders = ctx.orders.sort(this.sortOrdersByRank);

    this.mapOrderByItems();

    //
    // use shipping day from
    // force current shipping day
    this.shipping = ctx.when;
    this.pickerShippingDate = ctx.when.toISOString();

    // AVG
    this.orderTotal = this.orders.reduce((sum, order, i) => {
      return order.getSubTotal() + sum + this.orderBaseAmount;
    }, 0);
    this.orderAvg = this.orderTotal / this.orders.length;

  }

  onSearchInput($event) {
    this.cache.searchFilter = ($event.target.value || '').toLocaleLowerCase();
  }

  onSearchCancel($event) {
    this.searchFilter = null;
  }


  sortOrdersByRank(o1, o2) {
    return o1.rank - o2.rank;
  }

  sortOrdersByPosition(o1, o2) {
    // TODO checking type of postalCode is always a number
    // console.log('sort',(o1.shipping.position*10+o1.rank),(o2.shipping.position*10+o2.rank))
    const delta = ((o1.shipping.position | 0)) - ((o2.shipping.position | 0));
    if (delta === 0) {
      return o1.rank - o2.rank;
    }
    return delta;
  }

  updateBag(order, count) {
    this.$order.updateBagsCount(order, count).subscribe(ok => {
          this.onDone('Nombre sac enregistré');
    }, (error) => this.onDone(error.error));
  }

  validateAll(order) {

  }

}
