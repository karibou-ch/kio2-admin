import { Component, OnInit, OnDestroy } from '@angular/core';
import { ToastController, ModalController, PopoverController } from '@ionic/angular';
import { Config, EnumFulfillments, Order, OrderItem, OrderService, User, Shop, HubService } from 'kng2-core';
import { EngineService, OrderStatus, OrdersCtx } from '../services/engine.service';
import { OrdersItemsPage } from './orders-items.page';
import { CalendarPage } from '../calendar/calendar.page';
import { ActivatedRoute, Router } from '@angular/router';
import { interval } from 'rxjs';


@Component({
  selector: 'kio-orders-collect',
  templateUrl: 'orders-collect.page.html',
  styleUrls: ['./orders.page.scss'],
})
export class OrdersCollectPage  implements OnInit, OnDestroy {

  config: Config;
  hubs: any[];
  hubsVendors: any;
  currentHub: any;
  orders: Order[];
  shipping: Date;
  toggleDisplay = false;
  vendors = {
    list: []
  };

  isReady: boolean;
  user: User;
  pickerShippingDate: Date;
  format: string;
  searchFilter: string;
  toCollect: boolean;
  interval$;


  statusColor = {
    open:{background:"greenyellow",text:"black"},
    closed:{background:"#777",text:"white"}
  }


  constructor(
    private $engine: EngineService,
    private $modal: ModalController,
    private $hub: HubService,
    private $order: OrderService,
    private $popup: PopoverController,
    private $route: ActivatedRoute,
    private $router: Router,
    private $toast: ToastController
  ) {
    this.vendors.list = [];
    this.shipping = this.$engine.currentShippingDate;

    this.user = this.$engine.currentUser;
    this.config = this.$engine.currentConfig;
    this.hubs = (this.config.shared.hubs || []).slice();
    this.orders = [];
    this.hubsVendors = {};

    //
    // Manage HUB selections
    // back compatibility with K.v2
    if (this.hubs.length) {
      this.hubs.forEach(hub => hub.orders = 0);
      //
      // if you are associed to one HUB
      this.currentHub = this.hubs[0];
      if (this.user.hubs && this.user.hubs.length === 1) {
        this.currentHub = this.hubs.find(hub => hub.slug === this.user.hubs[0]) || this.currentHub;
        this.currentHub.selected = true;
      } else {
        this.hubs[0].selected = true;
      }
    }

    //
    // get vendors by HUB
    this.$hub.list().subscribe(hubs => {
      hubs.forEach(hub => this.hubsVendors[hub.name]=hub.vendors);
    });

    //
    // keep orders sync
    this.$order.order$.subscribe(order => {
      const idx = this.orders.findIndex(o => o.oid === order.oid);
      if( idx > -1) {
        this.orders[idx] = order;
        const time = Date.now();
        //
        // for each update, we have to recreate the index
        this.vendors = {list: []};
        this.orders.forEach(this.orderToVendor.bind(this));
        console.log('index created in', ( Date.now() - time) , 'ms');
      }
    });
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



  ngOnDestroy() {
    if (this.interval$) {
      this.interval$.unsubscribe();
    }
  }

  ngOnInit() {
    this.initDate();
    this.format = this.$engine.defaultFormat;
    this.pickerShippingDate = this.$engine.currentShippingDate;
    this.$engine.status$.subscribe(this.onEngineStatus.bind(this));
    this.$engine.selectedOrders$.subscribe(this.onInitOrders.bind(this));
    this.$engine.findAllOrders();

    //
    // pooling data every 10 minutes
    this.interval$ = interval(60000 * 10).subscribe(() => {
      this.$engine.findAllOrders();
    });
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


  private orderToVendor(order) {
    //
    // select visible HUB
    // FIXME: this is not a good solution, needs to update specs
    // if (this.currentHub && this.currentHub.id !== order.hub) {
    //   return;
    // }
    order.items.forEach((item: OrderItem) => {
      //
      // init item for this vendor
      // console.log('orderToVendor', item.vendor,order.vendors);
      if (!this.vendors[item.vendor]) {
        const vendor = order.vendors.find(v => v.slug === item.vendor);
        const collected = vendor.collected;
        const address = vendor.address.split('tel:');
        this.vendors[item.vendor] = {};
        this.vendors[item.vendor]._id = vendor.ref;
        this.vendors[item.vendor].address = address[0];
        this.vendors[item.vendor].geo = vendor.geo;
        this.vendors[item.vendor].phone = (address.length > 1) ? address[1] : null;
        this.vendors[item.vendor].shipping = order.shipping;
        this.vendors[item.vendor].hubs = [order.hub];
        this.vendors[item.vendor].items = [];
        this.vendors[item.vendor].oids = [];
        this.vendors[item.vendor].complements = [];
        this.vendors[item.vendor].collected = collected;
        this.vendors[item.vendor].collected_timestamp = vendor.collected_timestamp? new Date(vendor.collected_timestamp):vendor.collected_timestamp;
        this.vendors.list.push(item.vendor);
      }

      // add hub to this vendor
      if(this.vendors[item.vendor].hubs.indexOf(order.hub) == -1){
        this.vendors[item.vendor].hubs.push(order.hub);
      }


      // add item to this vendor
      this.vendors[item.vendor].items.push(item);
      //
      // filter unique ranks

      if(order.shipping.parent && this.vendors[item.vendor].complements.indexOf(order.oid) === -1){
        this.vendors[item.vendor].complements.push((order.oid));
      }
      if (this.vendors[item.vendor].oids.indexOf(order.oid) === -1){
        this.vendors[item.vendor].oids.push((order.oid));
      }
    });
  }

  private orderItemsByVendorAndHub(vendor) {
    this.currentHub = this.hubs.find(hub => hub.selected) || {};
    //
    // FIXME removed hub filter
    // --> this.orders.filter(order =>  !this.currentHub || order.hub === this.currentHub.id)
    return this.orders.map(order => {
      const o = new Order(order);
      o.items = order.items.filter((item) => item.vendor === vendor);
      return o;
    }).filter(o => o.items.length).sort((a,b) => {
      return a.rank - b.rank;
    });
  }

  doRefresh(refresher) {
    this.$engine.refresh();

    setTimeout(() => {
      refresher.target.complete();
    }, 2000);
  }

  doToast(msg, error?) {
    this.$toast.create({
      message: msg,
      duration: 3000,
      color: (error ? 'danger' : 'dark')
    }).then(alert => alert.present());
  }


  filterByDisplay(order) {
    if (!this.toggleDisplay) {
      return true;
    }
    return (order.items.filter(i => i.fulfillment.status !== EnumFulfillments[EnumFulfillments.fulfilled]).length) > 0;
  }

  getShopPhone(vendor: string) {
    return this.vendors[vendor].phone;
  }


  //
  // count items validated vs total items
  getFulfilled(vendor: string): number {
    return this.vendors[vendor].items.reduce((count, item) => {
      return (item.fulfillment.status === EnumFulfillments[EnumFulfillments.fulfilled]) ? (count + 1) : count;
    }, 0);
  }

  getVendorOids(vendor: string) {
    return this.vendors[vendor].oids;
  }

  getVendorComplements(vendor: string) {
    return this.vendors[vendor].complements;
  }


  getAmount(vendor: string): number {
    // this.vendors[vendor].items.forEach((item,i) => {
    //   if(vendor==='boulangerie-leonhard-bretzel') console.log(i+1 ,'----',vendor,item.finalprice,item.fulfillment.status);
    // });
    return this.vendors[vendor].items.reduce((amount, item) =>
      (item.fulfillment.status !== 'failure') ? (amount + item.finalprice) : amount
    , 0).toFixed(2);
  }

  getVendors() {
    const collected = this.vendors.list.every(slug => !!this.vendors[slug].collected_timestamp);
    const sortByCollect =(a,b) => {
      if(collected){
        return this.vendors[a].collected_timestamp.getTime() - this.vendors[b].collected_timestamp.getTime();
      }
      return a.localeCompare(b);
    };

    if (!this.searchFilter) {
      return this.vendors.list.sort(sortByCollect);
    }
    const search = this.searchFilter.toLocaleLowerCase();
    return this.vendors.list.filter(vendor => {
      return vendor.indexOf(search) > -1;
    }).sort(sortByCollect);
  }

  isFulfilled(vendor: string): boolean {
    return this.vendors[vendor].items.find(i => i.fulfillment.status !== EnumFulfillments[EnumFulfillments.fulfilled]);
  }


  //
  // check if current vendor is already collected
  isCollected(vendor: string): boolean {
    return this.vendors[vendor].collected;
  }

  isActiveHub(vendor: string): boolean {
    const name = (this.currentHub && this.currentHub.name);
    return (this.hubsVendors[name]||[]).indexOf(this.vendors[vendor]._id)>-1;
  }


  //
  // groupd by vendors to prepare collect
  onInitOrders(ctx: OrdersCtx) {
    this.orders = ctx.orders;
    this.shipping = ctx.when;
    this.isReady = true;
    this.vendors = {list: []};
    this.pickerShippingDate = ctx.when;

    //
    // init orders count
    this.hubs.forEach(hub => hub.orders = 0);
    this.orders.forEach(order => {
      if (this.hubs.length) {
        this.hubs.find(hub =>  (order.hub['_id']||order.hub) === hub.id).orders ++;
      }
      this.orderToVendor(order);
    });
  }

  onEngineStatus(status: OrderStatus) {
    this.isReady = !status.running;
  }

  onSearchInput($event) {
  }

  onSearchCancel($event) {
    this.searchFilter = null;
  }

  openPhone(vendor) {
    const link = 'tel:' + this.getShopPhone(vendor);
    window.location.href = link;
  }


  //
  // on selected date
  onDatePicker(popover) {
    // use one full week
    const date = new Date(this.pickerShippingDate);
    //const date = new Date(this.pickerShippingDate).plusDays( - this.pickerShippingDate.getDay());


    this.$engine.currentShippingDate = date;
    this.$engine.findAllOrders();
    //
    // update route
    this.$router.navigate([], { queryParams: { when: (date.getTime()) }});
    popover.dismiss();
  }


  openVendorItems(vendor: string) {
    const params = {
      orders: this.orderItemsByVendorAndHub(vendor),
      shipping: this.shipping,
      defaultSmall: true,
      vendor: (vendor)
    };

    this.$modal.create({
      component: OrdersItemsPage,
      componentProps: params
    }).then(alert => alert.present());
  }

  setCurrentHub(hub) {
    this.hubs.forEach( h => h.selected = false);
    this.currentHub = this.hubs.find(h => h.id === hub.id) || {};
    this.currentHub.selected = true;
    this.vendors = {
      list: []
    };
    this.orders.forEach(order => {
      this.orderToVendor(order);
    });
  }

  setCollected(slug) {
    this.orders.forEach(order => {
          order.vendors.forEach(vendor => {
            if (vendor.slug === slug) {vendor.collected = true; }
          });
    });
    this.vendors[slug].collected = true;
  }


  //
  //
  selectOrderByShop = function(shop) {
    // if(!shop){
    //   $scope.selected.items=[];
    //   $scope.selected.shop=false;
    //   return;
    // }
    // $scope.selected.items=$scope.shops[shop];
    // $scope.selected.shop=shop;
  };


  toggleCollect($event) {
    this.toCollect = !this.toCollect;
  }


  updateCollect(vendor) {
    const when = this.vendors[vendor].shipping.when;
    this.currentHub = this.hubs.find(hub => hub.selected) || {};
    when.setHours(22, 0, 0, 0);
    this.$order.updateCollect( vendor, true, when)
      .subscribe(orders => {
        if(orders.length) {
          this.doToast('Collecte enregistrée');
          this.setCollected(vendor);
        } else {
          this.doToast('Collecte n\'a pas eu être enregistrée', true);
        }
      }, error => this.doToast(error.error));
  }



}
