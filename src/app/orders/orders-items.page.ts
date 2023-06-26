import { Component, Input, OnInit } from '@angular/core';
import { ToastController, AlertController, ModalController, PopoverController } from '@ionic/angular';

import { Order, EnumFulfillments, OrderService, Product, OrderItem, ProductService, User } from 'kng2-core';
import { EngineService } from 'src/app/services/engine.service';
import { Router } from '@angular/router';
import { CustomerMessage } from '../customer-message/customer-message.page';

@Component({
  selector: 'kio2-orders-items',
  templateUrl: 'orders-items.html',
  styleUrls: ['./orders-items.scss'],
})
export class OrdersItemsPage implements OnInit {
  public isReady: boolean;
  public user: User;
  public deltaPrice: number;
  public format: string;
  public hubs: any;
  public displayForCheck: boolean;
  public filterItem: string;
  public doubleCheck: boolean;


  @Input() vendor: string;
  @Input() shipping: Date;
  @Input() item: any;

  //
  // input props
  @Input() orders: Order[];
  @Input() header: boolean;
  @Input() defaultSmall:boolean;


  constructor(
    public $alert: AlertController,
    public $engine: EngineService,
    public $order: OrderService,
    private $popup: PopoverController,
    public $modal: ModalController,
    public $product: ProductService,
    public $router: Router,
    public $toast: ToastController
  ) {

    this.deltaPrice = 0;
    this.user = this.$engine.currentUser;

    //
    // OrderItems[] for this vendor
    this.item = {};
    this.orders = [];
    this.vendor = '';

    this.format = this.$engine.defaultFormat;
    this.doubleCheck = false;
    this.header = true;
  }


  ngOnInit() {  
    
    if(this.defaultSmall) {
      this.doubleCheck = true;
      this.displayForCheck = true;
      //this.header = false;
    }
    //
    // load Hubs
    this.hubs = {undefined: { prefix: ''}};
    (this.$engine.currentConfig.shared.hubs || []).forEach(hub => {
      this.hubs[hub.id] = hub;
      this.hubs[hub.id].prefix = hub.name[0].toUpperCase();
    });

    if (this.orders.length == 1) {
      this.shipping = this.orders[0].shipping.when;
      this.computeDeltaPrice(this.orders[0]);
      if(this.user.hasRole('logistic')){
        this.doubleCheck = this.orders[0].customer.latestErrors>0;
      }else{
        this.doubleCheck = this.orders[0].customer.latestErrors == 0 && this.orders[0].getSubTotal()>120;
      }
    }

    //
    // set vendor when not admin (filter after save)
    // FIXME only one shop will be considered
    if (!this.vendor && !this.user.isAdmin()) {
      this.vendor = this.user.shops.map(shop => shop.urlpath)[0];
    }

    //
    // check content
    if (this.orders.length && !this.item.sku) {
      return;
    }
    //
    // create orders by Item
    this.isReady = (this.orders.length > 0) || (this.vendor != '') || (!!this.shipping) || (!!this.item.customer);
  }


  computeDeltaPrice(order: Order) {
    //
    // case of Orders By Item
    try{
      if (!order.getSubTotal) {
        return;
      }
  
      let originAmount = 0;
      const finalAmount: number = order.getSubTotal({ withoutCharge: true });
      this.deltaPrice = 0;
      order.items.forEach((item) => {
        //
        // item should not be failure (fulfillment)
        if (item.fulfillment.status !== EnumFulfillments[EnumFulfillments.failure]) {
          originAmount += (item.price * item.quantity);
        }
      });
      this.deltaPrice = parseFloat((finalAmount / originAmount - 1).toFixed(2));  
    }catch(err) {
      console.log('---- ERROR',err);
    }
  }

  doDisplayMail(order) {
    const email = order.email;
    this.$alert.create({
      header: 'Adresse Mail',
      subHeader: order.customer.displayName,
      message: 'Mail <a href="mailto:' + email + '">' + email + '</a>',
    }).then(alert => alert.present());
  }

  doDisplayphone(order) {
    const phone = this.getPhoneNumber(order);

    this.$alert.create({
      header: 'Numéro de téléphone',
      subHeader: order.customer.displayName,
      message: 'Appeler <a href="tel:' + phone + '">' + phone + '</a>',
    }).then(alert => alert.present());
  }

  doRefundHUB(order: Order) {
    const max = order.getSubTotal();
    this.$alert.create({
      header: 'Rembousement à la charge du HUB',
      subHeader: 'ATTENTION',
      inputs: [{
        name: 'amount',
        placeholder: 'Max ' + max + ' fr',
        type: 'number'
      }],
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
          handler: data => {
          }
        }, {
          text: 'Rembouser',
          handler: data => {
            this.$order.hub_refund(order, data.amount).subscribe(
              () => {
                this.doToast('Montant: ' + data.amount + ' remboursé');
              }, error => this.doToast(error.error, error)
            );
          }
        }
      ]
    }).then(alert => alert.present());

  }

  doRefund(order: Order, item: OrderItem) {
    this.$alert.create({
      header: 'Rembousement partiel',
      subHeader: item.quantity + 'x ' + item.title + ' ' + item.finalprice + ' fr',
      inputs: [{
        name: 'amount',
        placeholder: 'Max ' + item.finalprice + ' fr',
        type: 'number'
      }],
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
          handler: data => {
          }
        }, {
          text: 'Rembouser',
          handler: data => {
            const tosave = Object.assign({}, item);
            tosave.finalprice = tosave.finalprice - data.amount;
            this.$order.refund(order, tosave).subscribe(
              () => {
                item.finalprice = tosave.finalprice;
                item.fulfillment = tosave.fulfillment;
                this.doToast('Montant: ' + data.amount + ' remboursé');
              }, error => this.doToast(error.error, error)
            );
          }
        }
      ]
    }).then(alert => alert.present());

  }

  doValidateAll(order) {
    const items = JSON.parse(JSON.stringify(order.items.
                  filter(item => item.fulfillment.status !== 'failure')));

    this.$order.updateItem(order, items, EnumFulfillments.fulfilled)
      .subscribe(ok => {
        const len = 18;
        this.doToast('Articles du sac ' + order.rank);
        Object.assign(order, ok);

        //
        // when not admin, we should remove other vendor items
        // FIXME this items filter should be on server for NON admin user
        if (!this.user.isAdmin()) {
          const vendor = items[0].vendor; /** items MUST BE for the same vendor */
          order.items = order.items.filter(i => i.vendor === vendor);
        }

        // FIXME this items filter should be on server for NON admin user
        // For Admin we should ALWAYS constraint to the vendor
        if (this.vendor) {
          order.items = order.items.filter(i => i.vendor === this.vendor);
        }

        this.computeDeltaPrice(order);
      }, error => this.doToast(error.error, error));
  }

  doValidate(order, item) {
    const copy = JSON.parse(JSON.stringify(item));
    this.$order.updateItem(order, [copy], EnumFulfillments.fulfilled)
      .subscribe(ok => {
        const len = 18;
        const indexSrc = order.items.findIndex(i=> i.sku == item.sku);
        const indexDst = ok.items.findIndex(i=> i.sku == item.sku);
        Object.assign(order.items[indexSrc],ok.items[indexDst]);
        Object.assign(item,ok.items[indexDst]);

        //
        // when not admin, we should remove other vendor items
        // FIXME this items filter should be on server for NON admin user
        if (!this.user.isAdmin()) {
          order.items = order.items.filter(i => i.vendor === item.vendor);
        }

        // // FIXME this items filter should be on server for NON admin user
        // // For Admin we should ALWAYS constraint to the vendor
        // // vendor is set on collect page
        if (this.vendor) {
          order.items = order.items.filter(i => i.vendor === this.vendor);
        }
        this.computeDeltaPrice(order);
        const title = item.title.substring(0, len) + (item.title.length > len ? '...' : '');
        this.doToast(title + ' dans sac ' + order.rank);

      }, error => this.doToast(error.error, error));
  }

  doReplace(order,item) {

  }
  async doAskCancel($event, order, item) {
    const pop = await this.$popup.create({
      component: CustomerMessage,
      translucent: false,
      cssClass: 'customer-contact-popover',
      componentProps: {
        order,item
      }
    });

    //
    // when a shipping date is selected
    pop.onDidDismiss().then(result => {
      if (result.data == 'replace') {
        this.doValidate(order,item);
      }
      if (result.data == 'cancel') {
        this.doCancel(order,item);
      }

    });

    return await pop.present();
  }



  doClose() {
    this.$modal.dismiss();
  }

  doCancel(order, item) {
    this.$order.updateItem(order, [item], EnumFulfillments.failure)
      .subscribe(ok => {
        this.doToast('Annulation enregistrée');
        const indexSrc = order.items.findIndex(i=> i.sku == item.sku);
        const indexDst = ok.items.findIndex(i=> i.sku == item.sku);
        Object.assign(order.items[indexSrc],ok.items[indexDst]);
        Object.assign(item,ok.items[indexDst]);


        //
        // when not admin, we should remove other vendor items
        // FIXME this items filter should be on server for NON admin user
        if (!this.user.isAdmin()) {
          order.items = order.items.filter(i => i.vendor === item.vendor);
        }

        // For Admin we should ALWAYS constraint to the vendor
        // vendor is set on collect page
        if (this.vendor) {
          order.items = order.items.filter(i => i.vendor === this.vendor);
        }

        this.computeDeltaPrice(order);
      }, error => this.doToast(error.error, error));
  }


  doOpenProduct(item: OrderItem) {
    this.$router.navigate(['/product', item.sku],{ queryParams: { option: 'zindex' } });
  }

  doToggleCheck(item: any) {
   item['checked'] = !item['checked'];
  }

  doToast(msg, error?) {

    // FIXME manage 401 error!
    // if (error && error.status == 401) {
    //   this.events.publish('unauthorized');
    // }
    const out = error && error.message || msg;
    const params: any = {
      message: out,
      cssClass: 'toast-message',
      color: 'dark',
      duration: 5000
    };
    if (error) {
      params.position = 'bottom';
      params.color = 'danger';
    }
    this.$toast.create(params).then(alert => alert.present());
  }

  doSelectAllPrice(event) {
    if (event.inputElement) {
      setTimeout(function() {
          try {event.inputElement.setSelectionRange(0, 9999); } catch (e) {}
      }, 1);
      return event.inputElement.select();
    }

    // check this on safari
    setTimeout(function() {
      try {event.target.setSelectionRange(0, 9999); } catch (e) {}
    }, 1);
    event.target.select();
  }

  doKeypress(kcode, order, item) {
    console.log('---- keycode',kcode)
    //
    // case of enter
    if (kcode === 13) {
      this.doValidate(order, item);
    }
  }

  doFilterInput($event) {
    this.filterItem = ($event.target.value || '').toLocaleLowerCase()
  }

  doClearFilter($event) {
    this.filterItem = null;
  }


  getOrderRank(order: Order) {
    const prefix = this.hubs[order.hub].prefix;
    return prefix + order.rank;
  }

  getPhoneNumber(order: Order) {
    if (!order || !order.customer.phoneNumbers || !order.customer.phoneNumbers.length) {
      return false;
    }
    return order.customer.phoneNumbers[0].number;
  }


  isItemValid(item) {
    return(item.fulfillment.status == 'fulfilled');
//      'primary':'light';
  }

  isItemCancel(item) {
    return(item.fulfillment.status == 'failure');
//      'danger':'light';
  }

  isPaid(order: Order) {
    return (['paid', 'partially_refunded', 'manually_refunded'].indexOf(order.payment.status) > -1);
  }

  //
  // First sorted by vendors, then sorted by Cat
  sortedItem(order: Order) {
    const items = (order&&order.items||[]).filter(item => {
      if(!this.filterItem || this.filterItem.length<3){
        return true;
      }
      //
      // filter by vendor
      if([',','.','#'].indexOf(this.filterItem[0])>-1) {
        const search = this.filterItem.slice(1).toLocaleLowerCase();
        return item.vendor.indexOf(search) > -1;  
      }

      //
      // filter by title
      return item.title.toLocaleLowerCase().indexOf(this.filterItem) > -1;
    });

    return items.sort((a, b) => {
        const vendorCmp = a.vendor.localeCompare(b.vendor);
        if (vendorCmp !== 0) {
          return vendorCmp;
        }
        return a.category.localeCompare(b.category);
    });
  }

  //
  // First sorted by vendors, then sorted by Cat
  sortedItemByName(order: Order) {
    const items = (order&&order.items||[]).filter(item => {
      if(!this.filterItem || this.filterItem.length<3){
        return true;
      }
      //
      // filter by vendor
      if([',','.','#'].indexOf(this.filterItem[0])>-1) {
        const search = this.filterItem.slice(1).toLocaleLowerCase();
        return item.vendor.indexOf(search) > -1;  
      }

      //
      // filter by title
      return item.title.toLocaleLowerCase().indexOf(this.filterItem) > -1;
    });
    return items.sort((a, b) => {
        return a.title.localeCompare(b.title);
    });
  }

}


@Component({
  selector: 'kio2-orders-by-items',
  templateUrl: 'orders-by-items.html',
  styleUrls: ['./orders-items.scss']
})
export class OrdersByItemsPage extends OrdersItemsPage {
}

