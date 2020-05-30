import { Component, OnInit, OnDestroy } from '@angular/core';
import { Config, User, Order, LoaderService, OrderService, UserService } from 'kng2-core';
import { ModalController, ToastController, PopoverController } from '@ionic/angular';
import { TrackerProvider } from '../services/tracker/tracker.provider';
import { EngineService, OrdersCtx, OrderStatus } from '../services/engine.service';
import { TrackerPage } from '../tracker/tracker.page';
import { CalendarPage } from '../calendar/calendar.page';

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
  shipping: Date;
  planning = [];
  reorder = false;

  hubs: any[];
  currentHub: any;
  currentShopper: string;
  currentPlanning;
  format: string;
  pickerShippingDate: string;
  searchFilter: string;

  constructor(
    private $engine: EngineService,
    private $order: OrderService,
    private $popup: PopoverController,
    private $modal: ModalController,
    public $tracker: TrackerProvider,
    private toast: ToastController
  ) {
    this.isReady = false;
    this.format = this.$engine.defaultFormat;
  }

  ngOnInit() {
    this.user = this.$engine.currentUser;
    this.currentShopper = this.user.email.address;
    this.config = this.$engine.currentConfig;

    //
    // Manage HUB selections
    // back compatibility with K.v2
    this.hubs = (this.config.shared.hubs || []).slice();
    if (this.hubs.length) {
      this.hubs.forEach(hub => hub.orders = 0);
      this.hubs[0].selected = true;
      //
      // if you are associed to one HUB
      this.currentHub = this.hubs[0];
      if (this.user.hubs && this.user.hubs.length === 1) {
        this.currentHub = this.hubs.find(hub => hub.slug === this.user.hubs[0]);
      }
    }

    this.pickerShippingDate = this.$engine.currentShippingDate.toISOString();
    this.$engine.status$.subscribe(this.onEngineStatus.bind(this));
    this.$engine.selectedOrders$.subscribe(this.onInitOrders.bind(this));
    this.$engine.findAllOrdersForShipping();
  }

  ngOnDestroy() {
  }


  isDeposit(order) {
    // undefined test is for Bretzel
    return order.shipping.deposit || (order.shipping.deposit == undefined);
  }

  //
  // on selected date
  onDatePicker() {
    const date = new Date(this.pickerShippingDate);
    date.setHours(0, 0, 0, 0);
    date.setDate(2);


    this.pickerShippingDate = date.toISOString();
    this.$engine.currentShippingDate = date;
    this.$engine.findAllOrdersForShipping();
  }


  onEngineStatus(status: OrderStatus) {
    this.isReady = !status.running;
  }

  onInitOrders(ctx: OrdersCtx) {
    //
    // set default order value based on postalCode
    this.shipping = ctx.when;
    this.pickerShippingDate = ctx.when.toISOString();
    this.orders = ctx.orders.sort(this.sortOrdersByPosition);

    //
    // IFF HUBs are available
    if (this.hubs.length) {
      this.hubs.forEach(hub => hub.orders = 0);
      this.orders.forEach(order => {
        this.hubs.find(hub =>  order.hub === hub.id).orders ++;
      });
    }

    this.isReady = true;
    this.currentPlanning = null;
    this.trackPlanning(this.orders);
  }

  onDone(msg) {
    this.toast.create({
      message: msg,
      duration: 3000
    }).then(alert => alert.present());

  }
  onError(msg) {
    this.toast.create({
      message: msg,
      duration: 3000
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
      refresher.complete();
    }, 1000);
  }

  getPhoneNumber(order: Order) {
    if (!order || !order.customer.phoneNumbers || !order.customer.phoneNumbers.length) {
      return false;
    }
    return order.customer.phoneNumbers[0].number;
  }

  getOrders() {
    const filterByHub = (order) => {
      return !this.currentHub || order.hub === this.currentHub.id;
    };

    const filterByPlan = (order) => {
      if (this.currentPlanning == undefined) {
        return true;
      }
      return this.currentPlanning == order.shipping.priority;
    };
    if (!this.searchFilter) {
      return this.orders.filter(filterByHub.bind(this))
                        .filter(filterByPlan.bind(this));
    }
    return this.orders
                  .filter(filterByHub.bind(this))
                  .filter(filterByPlan.bind(this))
                  .filter(order => {
      const filter = order.email + ' ' + order.rank + ' ' + order.customer.displayName;
      return filter.toLocaleLowerCase().indexOf(this.searchFilter.toLocaleLowerCase()) > -1;
    });
  }

  isOrderSelected(order) {
    return this.selectedOrder[order.oid];
  }

  updateBag(order, count) {
    this.$order.updateBagsCount(order, count).subscribe(ok => {
          this.onDone('Nombre sac enregistré')
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
    const order = this.orders[index.detail.from];

    const priority = order.shipping.priority;
    const gt = order.shipping.position > this.orders[index.detail.to].shipping.position;
    order.shipping.position = (gt) ?
      this.orders[index.detail.to].shipping.position - 1 : this.orders[index.detail.to].shipping.position + 1;
    this.orders = this.orders.sort(this.sortOrdersByPosition);

    this.$order.updateShippingPriority(order, priority, order.shipping.position)
      .subscribe(ok => {
      }, error => this.onError(error.error));

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

    this.planning = orders.reduce((planning, order, i) => {
      if (order.shipping.priority &&
         planning.indexOf(order.shipping.priority) == -1) {
        planning.push(order.shipping.priority);
      }
      return planning.sort();
    }, []);

  }

  onEditCustomer(customer) {

  }

  openTracker() {
    const selected = Object.keys(this.selectedOrder).filter(oid=>this.selectedOrder[oid]);
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

  setShippingShopper(shopper: string) {
    const hub = this.currentHub && this.currentHub.slug;
    const when = this.shipping;
    this.$order.updateShippingShopper(hub,this.currentPlanning, when)
        .subscribe(ok => {
          this.onDone('Livraison planifiée');
        }, error => this.onError(error.error));
  }


  setShippingPriority(order: Order, pos: number) {
    const position = order.shipping.position;
    const priority = order.shipping.priority;
    this.$order.updateShippingPriority(order, priority, position)
        .subscribe(ok => {
          this.onDone('Livraison planifiée');
          this.trackPlanning(this.orders);
        }, error => this.onError(error.error));
  }

  setCurrentHub(hub) {
    this.hubs.forEach( h => h.selected = false);
    this.currentHub = this.hubs.find(h => h.id === hub.id) || {};
    this.currentHub.selected = true;
  }

  sortOrdersByCP(o1, o2) {
    // TODO checking type of postalCode is always a number
    return (o1.shipping.postalCode | 0) - (o2.shipping.postalCode | 0);
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


  filterByPlan(order: Order) {
    if (!this.currentPlanning) { return true; }
    return (this.currentPlanning === order.shipping.priority);
  }



}
