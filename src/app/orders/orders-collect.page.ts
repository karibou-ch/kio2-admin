import { Component, OnInit } from '@angular/core';
import { ToastController, ModalController, PopoverController } from '@ionic/angular';
import { EnumFulfillments, Order, OrderItem, OrderService, User, Shop } from 'kng2-core';
import { EngineService, OrderStatus, OrdersCtx } from '../services/engine.service';
import { OrdersItemsPage } from './orders-items.page';
import { CalendarPage } from '../calendar/calendar.page';


@Component({
  selector: 'kio-orders-collect',
  templateUrl: 'orders-collect.page.html',
  styleUrls: ['./orders.page.scss'],
})
export class OrdersCollectPage  implements OnInit{

  orders: Order[];
  shipping: Date;
  toggleDisplay= false;
  vendors = {
    list: []
  };

  isReady: boolean;
  user: User;
  pickerShippingDate: string;
  format: string;
  searchFilter: string;
  collected: boolean;

  constructor(
    private $engine: EngineService,
    private $modal: ModalController,
    private $order: OrderService,
    private $popup: PopoverController,
    private $toast: ToastController
  ) {
    this.vendors.list = [];
    this.shipping = this.$engine.currentShippingDate;
  }

  ngOnInit() {
    this.user = this.$engine.currentUser;
    this.format = this.$engine.defaultFormat;
    this.pickerShippingDate = this.$engine.currentShippingDate.toISOString();
    this.$engine.status$.subscribe(this.onEngineStatus.bind(this));
    this.$engine.selectedOrders$.subscribe(this.onInitOrders.bind(this));
    this.$engine.findAllOrdersForShipping();
  }

  doRefresh(refresher) {
    this.$engine.refresh();

    setTimeout(() => {
      refresher.target.complete();
    }, 2000);
  }

  doToast(msg) {
    this.$toast.create({
      message: msg,
      duration: 3000
    }).then(alert => alert.present());
  }

  filterOrderItemsByVendor(vendor) {
    return this.orders.map(order => {
      const o = new Order(order);
      o.items = order.items.filter((order) => order.vendor === vendor);
      return o;
    }).filter(o => o.items.length);
  }

  filterByDisplay(order) {
    if (!this.toggleDisplay) {
      return true;
    }
    return (order.items.filter(i => i.fulfillment.status !== EnumFulfillments[EnumFulfillments.fulfilled]).length) > 0;
  }

  getShopPhone(vendor: string) {
    const shop = this.vendors[vendor];
    console.log('----', shop);
  }


  //
  // count items validated vs total items
  getFulfilled(vendor: string): number {
    return this.vendors[vendor].items.reduce((count, item) => {
      return (item.fulfillment.status === EnumFulfillments[EnumFulfillments.fulfilled]) ? (count + 1) : count;
    }, 0);
  }

  getCustomerRanks(vendor: string) {
    return this.vendors[vendor].ranks;
  }


  getAmount(vendor: string): number {
    return this.vendors[vendor].items.reduce((amount, item) =>
      (item.fulfillment.status !== EnumFulfillments[EnumFulfillments.failure]) ? (amount + item.finalprice) : amount
    , 0).toFixed(2);
  }

  getVendors(){
    return this.vendors.list.filter(vendor => {
      if (!this.searchFilter) {
        return true;
      }
      return vendor.indexOf(this.searchFilter) > -1;
    }).sort();
  }

  isFulfilled(vendor: string): boolean {
    return this.vendors[vendor].items.find(i => i.fulfillment.status !== EnumFulfillments[EnumFulfillments.fulfilled]);
  }
  //
  // check if current vendor is already collected
  isCollected(vendor: string): boolean {
    const vendors = {};
    this.orders.forEach(order => {
          order.vendors.forEach(vendor => {
            vendors[vendor.slug] = vendor.collected;
          });
    });
    return vendors[vendor];
  }


  //
  // groupd by vendors to prepare collect
  onInitOrders(ctx: OrdersCtx) {
    this.orders = ctx.orders;
    this.shipping = ctx.when;
    this.isReady = true;
    this.vendors = {list: []};
    this.orders.forEach(order => {
      order.items.forEach((item: OrderItem) => {
        //
        // init item for this vendor
        if (!this.vendors[item.vendor]) {
          this.vendors[item.vendor] = {};
          this.vendors[item.vendor].shipping = order.shipping;
          this.vendors[item.vendor].items = [];
          this.vendors[item.vendor].ranks = [];
          this.vendors.list.push(item.vendor);
        }
        // add item to this vendor
        this.vendors[item.vendor].items.push(item);
        this.vendors[item.vendor].ranks.push((order.rank|0));
        //
        // filter unique ranks
        const ranks = this.vendors[item.vendor].ranks;
        this.vendors[item.vendor].ranks = ranks.filter((rank,index) => ranks.indexOf(rank) === index).sort();


      });
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


  onSelectedOrders(orders: Order[]) {
    this.toggleDisplay = !this.toggleDisplay;
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


  openVendorItems(vendor: string) {
    const params = {
      orders: this.filterOrderItemsByVendor(vendor),
      shipping: this.shipping,
      vendor: (vendor)
    }
    this.$modal.create({
      component: OrdersItemsPage,
      componentProps: params
    }).then(alert => alert.present());
  }


  setCollected(slug) {
    this.orders.forEach(order => {
          order.vendors.forEach(vendor => {
            if (vendor.slug === slug) {vendor.collected=true; }
          });
    });

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



  updateCollect(vendor) {
    const when = this.vendors[vendor].shipping.when;
    when.setHours(22, 0, 0, 0);
    this.$order.updateCollect(vendor, true, when)
      .subscribe(ok => {
        this.doToast('Collecte enregistrée');
        this.setCollected(vendor);
      }, error => this.doToast(error.error));
  }



}
