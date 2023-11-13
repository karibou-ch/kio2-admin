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
  statusColor = {
    open:{background:"greenyellow",text:"black"},
    closed:{background:"#777",text:"white"}
  }
  planning = [];
  reorder = false;

  hubs: any[];
  hubsRank: any;
  currentHub: any;
  currentShopper: string;
  currentPlanning;
  format: string;
  pickerShippingDate: Date;
  searchFilter: string;

  shippingShopper: {[key: string]: ShopperPlan};
  shippingShoppers: string[];
  shippingComplement: {[key: string]: number};

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
        this.currentHub = this.hubs.find(hub => hub.slug === this.user.hubs[0]) || this.currentHub;
      }
      this.currentHub.selected = true;

    }

    //
    // use valid date
    this.initDate();

    this.pickerShippingDate = this.$engine.currentShippingDate;
    this.$engine.status$.subscribe(this.onEngineStatus.bind(this));
    this.$engine.selectedOrders$.subscribe(this.onInitOrders.bind(this));
    this.$engine.findAllOrders();
  }

  set pickerShippingString(date: string){
    this.pickerShippingDate = new Date(date);
    this.pickerShippingDate.setHours(0,0,0,0);
  }

  get pickerShippingString(){
    return this.pickerShippingDate.toYYYYMMDD('-');
  }

  get highlightedOrders() {
    const highlighted = this.$engine.availableOrders.map(order => {
      const status = order.closed?'closed':'open'
      return {
        date: order.shipping.when.toYYYYMMDD('-'),
        textColor: this.statusColor[status].text,
        backgroundColor: this.statusColor[status].background,        
      }
    });
    // console.log(highlighted[0],this.$engine.availableOrders[0].shipping.when)
    return highlighted;
  }


  get currentOrders() {
    //
    // FIXME removed filter by hub
    // .filter(filterByHub.bind(this))                    
    // const filterByHub = (order) => {
    //   return !this.currentHub ||
    //   order.hub === this.currentHub.id;
    // };

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

    //
    // FIXME removed filter by hub
    // .filter(filterByHub.bind(this))                    
    if (!this.searchFilter) {
      return this.orders.filter(order => !order.shipping.parent)
                        .filter(filterByPlan.bind(this));
    }
    //
    // FIXME removed filter by hub
    // .filter(filterByHub.bind(this))                    
    return this.orders
                .filter(order => !order.shipping.parent)
                .filter(filterByPlan.bind(this))
                .filter(filterByText.bind(this));
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
    const queryWhen = new Date(+this.$route.snapshot.queryParams['when']);
    const month = isNaN(queryWhen.getTime()) ? (currentDate.getMonth() + 1) : queryWhen.getMonth() + 1;
    const year = isNaN(queryWhen.getTime()) ? (currentDate.getFullYear()) : queryWhen.getFullYear();

    currentDate.setFullYear(year);
    currentDate.setMonth(month - 1);
    //
    // constraint Date engine with month/year
    this.$engine.currentShippingDate = currentDate;

    //
    // use full Date for Display
    this.pickerShippingDate = isNaN(queryWhen.getTime()) ? currentDate : queryWhen;
  }

  isDeposit(order) {
    // undefined test is for Bretzel
    return order.shipping.deposit || (order.shipping.deposit == undefined);
  }

  //
  // on selected date
  onDatePicker(popover) {
    const date = this.$engine.currentShippingDate = this.pickerShippingDate;
    const orders = this.$engine.getOrdersByDay(date);
    const today = new Date();    
    const thisWeek = today.plusDays(- today.getDay());    
    const nextWeek = today.plusDays(7 - today.getDay());
    date.setHours(0, 0, 0, 0);

    if(date < thisWeek && !orders.length) {
      this.$engine.selectOrderArchives(true);  
    }else if (date>nextWeek && !orders.length){
      this.$engine.selectOrderArchives(false);  
    }else if(!orders.length){
      this.$engine.selectOrderArchives(false);  
      this.$engine.currentShippingDate = date;
    }else{
      this.$router.navigate([], { queryParams: { when: (date.getTime()) }});

      this.onInitOrders({
        orders: (orders),
        when: (date)
      } as OrdersCtx);

    }


    popover.dismiss();
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
    this.pickerShippingDate = ctx.when;
    this.orders = ctx.orders.sort(this.sortOrdersByPosition);    
    // this.orders.filter(o => o.shipping.priority === 1).forEach(order => {
    //   console.log('---- priority,position',order.rank,order.shipping.priority, order.shipping.position);
    // });

    //
    // map parent orders with complement count
    this.shippingComplement = {};
    this.orders.forEach(order => {
      if(order.shipping.parent) {
        const parent = this.orders.find(o => o.oid == order.shipping.parent);
        this.shippingComplement[order.oid] = (parent)? parent.rank : 0;
      }
    });

    //
    // IFF HUBs are available
    if (this.hubs.length) {
      this.hubs.forEach(hub => hub.orders = 0);
      this.orders.forEach(order => {
        if(order.shipping.parent){
          return;
        }
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


  getOrdersComplement(order) {
    return this.shippingComplement[order.oid] || 0;
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
    //
    // list orders for this planning
    const orders = this.currentOrders;
    const lastIdx = orders.length - 1;
    //
    // depending the direction, we should compare the position 
    const direction = (index.detail.from > index.detail.to) ? -1 : 1;
    const to = orders[index.detail.to];
    const from = orders[index.detail.from];
    let position;

    // console.log('----DBG from',from.rank,index.detail.from,lastIdx);
    // console.log('----DBG to',to.rank,index.detail.to);

    //
    // place the order before the first one
    if(index.detail.to == 0) {
      position=(orders[0].shipping.position)-2;
    }
    //
    // place the order after the last one
    else if(index.detail.to == lastIdx) {
      position=orders[lastIdx].shipping.position+2;
    }else {
      // get the position of the previous//next order AND add//substract 1
      // Going UP == -1
      // Going DOWN == +1
      const forceAVG = (to.shipping.position==orders[index.detail.to+direction].shipping.position)?5:0;
      position=(to.shipping.position+orders[index.detail.to+direction].shipping.position+forceAVG)/2;
      //console.log('--DBG position',from.rank,'=>',(to.shipping.position+orders[index.detail.to+direction].shipping.position+forceAVG)/2,direction)
    }
    let priority = from.shipping.priority;


    from.shipping.position = position;
    this.orders = this.orders.sort(this.sortOrdersByPosition);

    this.$order.updateShippingPriority(from, priority, position)
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
      }
      if(order.shipping.shopper){
        shoppers[order.shipping.shopper] = true;
      }
        

      //
      // list shopper
      if (order.shipping.priority) {
        this.shippingShopper[order.shipping.priority] = {
          shopper: order.shipping.shopper,
          plan: order.shipping.priority,
          time: (order.shipping.shopper_time),
          hub: order.hub
        };
      }
      return planning.sort();
    }, []);

    //
    // update the available shoppers
    // FIXME only avilable for managers ?
    shoppers[this.user.email.address] = true;
    this.shippingShoppers = Object.keys(shoppers).filter(shopper => !!shopper);
  }

  onEditCustomer(customer) {

  }

  openTracker() {
    const selected = Object.keys(this.selectedOrder).filter(oid => this.selectedOrder[oid]);
    const countSelected = selected.length;
    const orders = this.orders.filter(order => !countSelected || (selected.indexOf(order.oid + '') > -1))
                              .filter(order => !order.shipping.parent)
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
    const shopper = $event.shopper || this.shippingShopper[plan].shopper || this.shippingShoppers[0];
    let time: any = (this.shippingShopper[plan].time);

    //
    // return silently if setup is not complet
    if (!time || !shopper) {
      return;
    }
    if (!/^\d{1,2}:\d{1,2}$/.test(time)) {
      time = new Date(time);
      if(isNaN(time.getTime())) {
        return;
      }
      time = time.getHours() + ':' + ('0' + time.getMinutes()).slice(-2);
      this.shippingShopper[plan].time = time;
      this.shippingShopper[plan].shopper = shopper;
    }

    this.$order.updateShippingShopper(hub, shopper, plan, when, time)
        .subscribe(ok => {
          this.onDone('Livraisons planifiées');
        }, status => {
          this.onError(status.error || status.message)
          //
          // restore all plan
          this.trackPlanning(this.orders);
        });
  }


  setShippingPriority(order: Order, pos: number) {
    const position = order.shipping.position;
    const priority = order.shipping.priority;
    this.$order.updateShippingPriority(order, priority, position)
        .subscribe(ok => {
          this.onDone('Tournée planifiée');
          //
          // update all plan
          this.trackPlanning(this.orders);
        }, status => {
          this.onError(status.error);          
        });
  }

  setCurrentHub(hub) {
    this.hubs.forEach( h => h.selected = false);
    this.currentHub = this.hubs.find(h => h.id === hub.id) || {};
    this.currentHub.selected = true;
    this.currentPlanning = null;
    //
    // FIXME, currently force find-all-orders to reset local shippingShopper[plan]
    // this.$engine.findAllOrders();
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
      //return this.sortOrdersByRankAndComplement(o1,o2);
    }
    return delta;
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


  filterByPlan(order: Order) {
    if (!this.currentPlanning) { return true; }
    return (this.currentPlanning === order.shipping.priority);
  }



}
