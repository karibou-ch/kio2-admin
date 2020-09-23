import { Component, OnInit, OnDestroy } from '@angular/core';
import { Config, User, Order, OrderService } from 'kng2-core';
import { ModalController, ToastController, PopoverController, AlertController } from '@ionic/angular';
import { EngineService, OrdersCtx, OrderStatus } from '../services/engine.service';
import { TrackerPage } from '../tracker/tracker.page';
import { CalendarPage } from '../calendar/calendar.page';
import { Router, ActivatedRoute } from '@angular/router';

export interface ShopperPlan {
  shopper: string;
  plan: number;
  time: string;
  hub: string;
}

@Component({
  selector: 'kio2-shopper',
  templateUrl: './shopper.page.html',
  styleUrls: ['./shopper.page.scss'],
})
export class ShopperPage implements OnInit, OnDestroy {

  selectedOrder = {};
  user: User;
  config: Config;
  isReady: boolean;
  orders: Order[] = [];
  planning = [];
  reorder = false;

  hubs: any[];
  hubsRank: any;
  currentHub: any;
  currentShopper: string;
  currentPlanning;
  format: string;
  pickerShippingDate: string;
  searchFilter: string;

  shippingShopper: {[key: string]: ShopperPlan};
  shippingShoppers: string[];

  constructor(
    private $alert: AlertController,
    private $engine: EngineService,
    private $modal: ModalController,
    private $order: OrderService,
    private $popup: PopoverController,
    private $route: ActivatedRoute,
    private $router: Router,
    private $toast: ToastController
  ) {
    this.isReady = false;
    this.format = this.$engine.defaultFormat;
    this.shippingShoppers = [];
    this.shippingShopper = {};
  }

  ngOnInit() {
    this.user = this.$engine.currentUser;
    this.currentShopper = this.user.email.address;
    this.config = this.$engine.currentConfig;

    //
    // Manage HUB selections
    // back compatibility with K.v2
    this.hubsRank = {undefined: { prefix: ''}};
    this.hubs = (this.config.shared.hubs || []).slice();
    if (this.hubs.length) {
      this.hubs.forEach(hub => {
        hub.orders = 0;
        this.hubsRank[hub.id] = hub;
        this.hubsRank[hub.id].prefix = hub.name[0].toUpperCase();
      });
      //
      // if you are associed to one HUB
      this.currentHub = this.hubs[0];
      if (this.user.hubs && this.user.hubs.length === 1) {
        this.currentHub = this.hubs.find(hub => hub.slug === this.user.hubs[0]);
      }
      this.currentHub.selected = true;

    }

    //
    // use valid date
    this.initDate();


    this.pickerShippingDate = this.$engine.currentShippingDate.toISOString();
    this.$engine.status$.subscribe(this.onEngineStatus.bind(this));
    this.$engine.selectedOrders$.subscribe(this.onInitOrders.bind(this));
    this.$engine.findAllOrders();
  }

  ngOnDestroy() {
  }

  doDisplayPhone(order) {
    const phone = this.getPhoneNumber(order);
    this.$alert.create({
      header: 'Numéro de téléphone',
      subHeader: order.customer.displayName,
      message: 'Appeler <a href="tel:' + phone + '">' + phone + '</a>',
    }).then(alert => alert.present());
  }

  doDisplayMail(order) {
    this.$alert.create({
      header: 'Mail de la commande',
      subHeader: order.customer.displayName,
      message: 'Contacter <a href="mailto:' + order.email + '">' + order.email + '</a>',
    }).then(alert => alert.present());
  }

  getOrderRank(order: Order) {
    const prefix = this.hubsRank[order.hub].prefix;
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

  //
  // on selected date
  onDatePicker() {
    const today = new Date();
    const date = new Date(this.pickerShippingDate);
    date.setHours(0, 0, 0, 0);
    date.setDate(1);

    this.$engine.selectOrderArchives(date < today);

    this.pickerShippingDate = date.toISOString();
    this.$engine.currentShippingDate = date;
    this.$engine.findAllOrders();

    //
    // update route
    this.$router.navigate([], {queryParams: { when: (date.getTime()) }});
  }


  onEngineStatus(status: OrderStatus) {
    this.isReady = !status.running;
  }

  onInitOrders(ctx: OrdersCtx) {
    //
    // set default order value based on postalCode
    this.pickerShippingDate = ctx.when.toISOString();
    this.orders = ctx.orders.sort(this.sortOrdersByPosition);
    // this.orders.filter(o => o.shipping.priority === 1).forEach(order => {
    //   console.log('---- priority,position',order.rank,order.shipping.priority, order.shipping.position);
    // });

    //
    // IFF HUBs are available
    if (this.hubs.length) {
      this.hubs.forEach(hub => hub.orders = 0);
      this.orders.forEach(order => {
        this.hubs.find(hub =>  order.hub === hub.id).orders ++;
      });

      const select = this.hubs.find(hub => hub.orders > 0);
      if (select) {this.setCurrentHub(select); }
    }

    this.isReady = true;
    this.currentPlanning = undefined;
    this.trackPlanning(this.orders);
  }

  onDone(msg) {
    this.$toast.create({
      message: msg,
      duration: 3000,
      color: 'dark'
    }).then(alert => alert.present());

  }
  onError(msg) {
    this.$toast.create({
      message: msg,
      duration: 3000,
      color: 'danger'
    }).then(alert => alert.present());

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

  isPlanified() {

  }

  doRefresh(refresher) {
    //
    // use Observer to complete refresher
    this.$engine.refresh();
    setTimeout(() => {
      refresher.target.complete();
    }, 500);
  }

  getPhoneNumber(order: Order) {
    if (!order || !order.customer.phoneNumbers || !order.customer.phoneNumbers.length) {
      return false;
    }
    return order.customer.phoneNumbers[0].number;
  }

  getOrders() {
    const filterByHub = (order) => {
      return !this.currentHub ||
      order.hub === this.currentHub.id;
    };

    const filterByPlan = (order) => {
      if (!this.currentPlanning ) {
        return true;
      }
      return this.currentPlanning == order.shipping.priority;
    };

    const filterByText = (order) => {
      const filter = order.email + ' ' + order.rank + ' ' + order.customer.displayName;
      return filter.toLocaleLowerCase().indexOf(this.searchFilter.toLocaleLowerCase()) > -1;
    };

    if (!this.searchFilter) {
      return this.orders.filter(filterByHub.bind(this))
                        .filter(filterByPlan.bind(this));
    }
    return this.orders
                  .filter(filterByHub.bind(this))
                  .filter(filterByPlan.bind(this))
                  .filter(filterByText.bind(this));
  }

  isOrderSelected(order) {
    return this.selectedOrder[order.oid];
  }

  updateBag(order, count) {
    this.$order.updateBagsCount(order, count).subscribe(ok => {
      this.onDone('Nombre sac enregistré');
    }, (error) => this.onError(error.error));
  }

  getShopperInfo(order: Order) {
    if (!order || !order.shipping.shopper) {
      return '';
    }
    // priority and initials from emails
    let initials = order.shipping.shopper.split('@')[0];
    initials = initials[0] + initials[1];
    return '(' + order.shipping.priority + ')(' + initials + ')';
  }


  debug() {
    // this.orders.forEach(o=>{
    //   console.log('-----init orders rans',o.rank,'position',o.shipping.position)
    // })
  }

  //
  // manual reorder of items
  reorderItems(index) {
    const orders = this.orders.filter(order => !this.currentPlanning || order.shipping.priority === this.currentPlanning);
    // console.log('--- index f,t', index.detail.from, index.detail.to);
    const order = orders[index.detail.from];
    const priority = order.shipping.priority;

    //
    // depending the direction, we should sum or substract the DELTA
    const direction = (index.detail.from < index.detail.to) ? 1 : -1;
    //
    // get priority value from  previous order (order[index - 1])
    const pFrom = (index.detail.to > 1) ?
          orders[index.detail.to - 1].shipping.position : orders[index.detail.from].shipping.position;

    const pTo = orders[index.detail.to].shipping.position;

    //
    // if position are equal, we should add one unit to compute a DELTA
    const inc = (pTo === pFrom) ? 1 : 0;

    //
    // final position is an Epsylon added or substracted on the destination
    const pFinal = pTo + (Math.abs(pTo - pFrom) + inc) / 2 * direction;

    order.shipping.position = pFinal;


    this.orders = this.orders.sort(this.sortOrdersByPosition);

    this.$order.updateShippingPriority(order, priority, order.shipping.position)
      .subscribe(ok => {
        // UX is not nice
        // index.detail.complete();
      }, status => this.onError(status.error));
    index.detail.complete();
  }

  toggleOrder(order) {
    this.selectedOrder[order.oid] = !this.selectedOrder[order.oid];
  }


  togglePlanning(plan) {
    if (this.currentPlanning === plan) {
      return this.currentPlanning = undefined;
    }
    this.currentPlanning = plan;
  }

  toggleReorder() {
    this.reorder = !this.reorder;
  }


  trackPlanning(orders: Order[]) {
    const shoppers = {};
    this.planning = orders.reduce((planning, order, i) => {
      //
      // create planning
      if (order.shipping.priority &&
         planning.indexOf(order.shipping.priority) == -1) {
        planning.push(order.shipping.priority);
        shoppers[order.shipping.shopper] = true;
      }

      //
      // list shopper
      if (order.shipping.priority) {
        this.shippingShopper[order.shipping.priority] = {
          shopper: order.shipping.shopper,
          plan: order.shipping.priority,
          time: order.shipping.shopper_time,
          hub: order.hub
        };
      }
      return planning.sort();
    }, []);

    //
    // update the available shoppers
    // FIXME only avilable for managers ?
    shoppers[this.user.email.address] = true;
    this.shippingShoppers = Object.keys(shoppers);

  }

  onEditCustomer(customer) {

  }

  openTracker() {
    const selected = Object.keys(this.selectedOrder).filter(oid => this.selectedOrder[oid]);
    const countSelected = selected.length;
    const orders = this.orders.filter(order => !countSelected || (selected.indexOf(order.oid + '') > -1))
                              .filter(this.filterByPlan.bind(this));
    const params = {
      orders: (orders)
    };
    this.$modal.create({
      component: TrackerPage,
      componentProps: params
    }).then(alert => alert.present());
  }


  onSearchInput($event) {
  }

  onSearchCancel($event) {
    this.searchFilter = null;
  }

  setShippingShopper($event?) {
    const hub = this.currentHub && this.currentHub.slug;
    const when = new Date(this.pickerShippingDate);
    const plan = this.currentPlanning;
    const shopper = $event.shopper || this.shippingShopper[plan].shopper;
    let time: any = (this.shippingShopper[plan].time);

    //
    // return silently if setup is not complet
    if (!time || !shopper) {
      return;
    }
    if (!/^\d{1,2}:\d{1,2}$/.test(time)) {
      time = new Date(time);
      time = time.getHours() + ':' + ('0' + time.getMinutes()).slice(-2);
    }

    this.$order.updateShippingShopper(hub, shopper, plan, when, time)
        .subscribe(ok => {
          this.onDone('Livraisons planifiées');
        }, status => {
          this.onError(status.error || status.message)
        });
  }


  setShippingPriority(order: Order, pos: number) {
    const position = order.shipping.position;
    const priority = order.shipping.priority;
    this.$order.updateShippingPriority(order, priority, position)
        .subscribe(ok => {
          this.onDone('Tournée planifiée');
          this.trackPlanning(this.orders);
        }, error => this.onError(error.error));
  }

  setCurrentHub(hub) {
    this.hubs.forEach( h => h.selected = false);
    this.currentHub = this.hubs.find(h => h.id === hub.id) || {};
    this.currentHub.selected = true;

    //
    // FIXME, currently force find-all-orders to reset local shippingShopper[plan]
    this.$engine.findAllOrders();
  }

  sortOrdersByCP(o1, o2) {
    // TODO checking type of postalCode is always a number
    return (+o1.shipping.postalCode) - (+o2.shipping.postalCode);
  }

  sortOrdersByPosition(o1, o2) {
    // TODO checking type of postalCode is always a number
    // console.log('sort',(o1.shipping.position*10+o1.rank),(o2.shipping.position*10+o2.rank))
    const delta = (+o1.shipping.position) - (+o2.shipping.position);
    if (delta === 0) {
      return o1.rank - o2.rank;
    }
    return delta;
  }


  filterByPlan(order: Order) {
    if (!this.currentPlanning) { return true; }
    return (this.currentPlanning === order.shipping.priority);
  }



}
