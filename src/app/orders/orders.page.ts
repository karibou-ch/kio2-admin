import { Component, OnInit, OnDestroy } from '@angular/core';
import { EngineService, OrderStatus, OrdersCtx } from '../services/engine.service';
import { User, LoaderService, OrderService, Order, OrderItem, EnumCancelReason } from 'kng2-core';
import { ToastController, PopoverController, ModalController, LoadingController } from '@ionic/angular';
import { CalendarPage } from '../calendar/calendar.page';
import { OrdersItemsPage, OrdersByItemsPage } from './orders-items.page';
import { Router, ActivatedRoute } from '@angular/router';
import { interval } from 'rxjs';

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

export class PlanningByItem {
  status: string;
  item: string;
  sku: number;
  quantity: number;
}

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
})
export class OrdersCustomerPage implements OnInit, OnDestroy {


  planning = [];
  currentPlanning;

  maxErrors:number;
  format: string;
  formatWeek: string;
  user: User = new User();
  shipping: Date;
  orders: Order[];
  cache: any;
  hasAudio: any;
  isReady: boolean;
  complementsLength: number;
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
  interval$;

  currentDates: Date[];
  openItems: {
    [when: number]: (PlanningByItem[]|any);
  };

  shippingComplement: {[key: string]: number};


  constructor(
    public $engine: EngineService,
    public $modal: ModalController,
    public $toast: ToastController,
    public $loader: LoaderService,
    public $loading: LoadingController,
    public $popup: PopoverController,
    public $route: ActivatedRoute,
    public $router: Router,
    public $order: OrderService
  ) {
    this.orders = [];
    this.cache = {};
    this.items = {};
    this.hasAudio = {};
    this.currentDates = [];
    this.openItems = {};
    this.shippingComplement = {};
  }

  get ordersCount() {
    return this.orders.filter(order => !order.shipping.parent).length;
  }

  ngOnDestroy() {
    if (this.interval$) {
      this.interval$.unsubscribe();
    }
  }

  ngOnInit() {

    this.maxErrors = this.$engine.currentConfig.shared.issue.verification;
    //
    // load Hubs
    this.hubs = {undefined: { prefix: ''}};
    (this.$engine.currentConfig.shared.hubs || []).forEach(hub => {
      this.hubs[hub.id] = hub;
      this.hubs[hub.id].prefix = hub.name[0].toUpperCase();
    });

    this.format = this.$engine.defaultFormat;
    this.formatWeek = this.$engine.defaultWeek;

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

    //
    // update orders state
    const vendors = this.user.shops.map(shop => shop.urlpath);
    const isAdmin = this.user.isAdmin();
    this.$order.order$.subscribe(order => {
      const idx = this.orders.findIndex(o => o.oid === order.oid);
      if ( idx > -1) {
        //
        // FIXME this filter must be made in server side
        order.items = order.items.filter(item => isAdmin || (vendors.indexOf(item.vendor) > -1));
        this.orders[idx] = order;
      }
    });

    //
    // pooling data every 10 minutes
    this.interval$ = interval(60000 * 10).subscribe(() => {
      this.$engine.findAllOrders();
    });
  }



  doRefresh(refresher) {
    // this.events.publish('refresh');
    // setTimeout(() => {
    //   refresher.complete();
    // }, 1000);
    window.location.reload();
  }

  doTogglePlanning(plan) {
    if (this.currentPlanning === plan) {
      return this.currentPlanning = undefined;
    }
    this.currentPlanning = plan;
  }

  emailVendors() {
    // inform all shops: 'shops'||false
    // FIXME sent ISO date get wrong on server
    const UTC = new Date(this.shipping);
    UTC.setHours(8);
    const loading = this.$loading.create({
      cssClass: '',
      message: 'Please wait...',
      duration: 2000
    }).then(load => load.present());


    this.$order.informShopToOrders('shops', UTC).subscribe(
      (result) => {
        this.$loading.dismiss();
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

  getOrdersComplement(order) {
    return this.shippingComplement[order.oid] || 0;
  } 

  getOrdersCountByDate(when: Date) {
    return this.openItems[when.getTime()].count || 0;
  }

  getOrdersByDate(when: Date) {
    return this.openItems[when.getTime()];
  }

  //
  // FIXME use localOrders
  getOrdersLength() {

  } 
  //
  // get orders by HUB
  getOrders() {
    let orders = [];
    if (!this.searchFilter) {
      orders = this.orders.filter(order => (!this.currentPlanning || this.currentPlanning === order.shipping.priority));
    } else  {
      orders = this.orders.filter(order => {
        const filter = order.oid + ' ' + order.email + ' ' + order.rank + ' ' + order.customer.displayName;
        const planning = (!this.currentPlanning || this.currentPlanning === order.shipping.priority);
        return planning && filter.toLocaleLowerCase().indexOf(this.searchFilter.toLocaleLowerCase()) > -1;
      });  
    }
    this.complementsLength = orders.filter(order => order.shipping.parent).length;
    return orders;
  }

  getUniqueOrders(){
    return (this.orders).filter(order => !order.shipping.parent);
  }

  getOrderRank(order: Order) {
    const prefix = this.hubs[order.hub].prefix;
    return prefix + order.rank;
  }

  initDate() {
    const queryWhen = new Date(+this.$route.snapshot.queryParams.when);
    //
    // if no date is specified, then make sure that 
    if (isNaN(queryWhen.getTime())) {
      this.$engine.initDate();
    }

    const currentDate = this.$engine.currentShippingDate;
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

  isAudio(order){
    return !!this.hasAudio[order.oid];
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


  mapItemsPlanning() {
    this.openItems = {};
    const ordersMap = this.$engine.getAllOrdersByDate();
    this.currentDates = Array.from(ordersMap.keys()).map(when => new Date(when));

    //
    // sort planing
    this.currentDates = this.currentDates.sort((a,b) => a.getTime() - b.getTime());

    //
    // group items by date
    this.currentDates.forEach(when => {
      const time = when.getTime();
      if (!this.openItems[time]) {
        this.openItems[time] = [];
        this.openItems[time].count = ordersMap.get(time).length;
      }

      ordersMap.get(time).forEach(order => {
        //
        // create the list for that time
        order.items.forEach(item => {
          const elem = this.openItems[time].find( $i => $i.sku === item.sku && $i.status === item.fulfillment.status);
          if(elem) {
            elem.quantity += item.quantity;
          } else {
            this.openItems[time].push({
              status: item.fulfillment.status ,
              issue: item.fulfillment.issue ,
              title: item.title,
              sku: item.sku,
              quantity: item.quantity
            });
          }
        });
        //
        // order the list by title
        this.openItems[time] = this.openItems[time].sort((a, b) => {
          if (a.title > b.title) {
            return 1;
          }
          if (b.title > a.title) {
              return -1;
          }
          return 0;
        });
      });
    });
  }

  onDone(msg) {
    this.$toast.create({
      message: msg,
      duration: 3000,
      color: 'dark'
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
    if (confirm('SUPPRIMER LA COMMANDE???')) {
      this.$order.cancelWithReason(order, EnumCancelReason.customer).subscribe(
        (ok) => {
          Object.assign(order, ok);
          this.onDone('Commande annulée');
        },
        error => {
          this.onDone(error.error);
        }
      );
    }
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
    this.mapItemsPlanning();

    //
    // map child orders that have parent complement
    this.shippingComplement = {};
    this.orders.forEach(order => {
      this.hasAudio[order.oid] = order.items.some(item => item.audio);

      if(order.shipping.parent) {
        const parent = this.orders.find(o => o.oid == order.shipping.parent);
        this.shippingComplement[order.oid] = (parent)? parent.rank : 0;
      }

      if (order.shipping.priority &&
        this.planning.indexOf(order.shipping.priority) == -1) {
        this.planning.push(order.shipping.priority);
        this.planning = this.planning.sort();
      }


    });

    //
    // use shipping day from
    // force current shipping day
    this.shipping = ctx.when;
    this.pickerShippingDate = ctx.when.toISOString();
    // console.log('---- ctx.when',ctx.when.getTime(),ctx.when);

    // AVG
    this.orderTotal = this.orders.reduce((sum, order, i) => {
      return order.getSubTotal({ withoutCharge: true }) + sum + this.orderBaseAmount;
    }, 0);
    this.orderAvg = this.orderTotal / this.ordersCount;

  }

  onSearchInput($event) {
    this.cache.searchFilter = ($event.target.value || '').toLocaleLowerCase();
  }

  onSearchCancel($event) {
    this.searchFilter = null;
  }

  //
  // sort by (parent)->rank, 
  sortOrdersByRankAndComplement(o1, o2) {
    // get source rank
    const rank1 = this.shippingComplement[o1.oid] || o1.rank;
    const rank2 = this.shippingComplement[o2.oid] || o2.rank;
    const sorted = (rank1 - rank2);
    if(!sorted) {
      return o1.shipping.name.localeCompare(o2.shipping.name);
    }
    return sorted;
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

@Component({
  selector: 'kio2-orders-planning',
  templateUrl: 'orders-planning.html',
  styleUrls: ['./orders.page.scss']
})
export class OrdersPlanningPage extends OrdersCustomerPage {
  displayOnlyFailure: boolean;

  doOpenOrders($event, date) {
    this.$router.navigate(['/orders'], { queryParams: { when: (date.getTime()) }});
  }
}
