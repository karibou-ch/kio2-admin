import { Component, Input, OnInit } from '@angular/core';
import { ToastController, AlertController, ModalController } from '@ionic/angular';

import { Order, EnumFulfillments, OrderService, Product, OrderItem, ProductService, User } from 'kng2-core';
import { EngineService } from 'src/app/services/engine.service';
import { Router } from '@angular/router';

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


  @Input() vendor: string;
  @Input() shipping: Date;
  @Input() item: any;

  //
  // input props
  @Input() orders: Order[];
  @Input() header: boolean;


  //
  // Message
  public REPLACE_MSG = [
    {
      label: 'Produit annulé dans votre commande karibou.ch',
      body:
`Bonjour,\nLe produit «_ITEM_» de votre commande karibou.ch n'est plus disponible.\n
Nous sommes désolé pour ce désagrement\n`
    },
    {
      label: 'Remplacer un produit manquant de votre commande karibou.ch',
      body:
`Bonjour,\nLe produit *_ITEM_* de votre commande karibou.ch n'est plus disponible.\n
Si cela vous convient, je peux le remplacer par : \n
- \n
D'avance merci pour votre retour.`
    }
  ];

  constructor(
    public $alert: AlertController,
    public $engine: EngineService,
    public $order: OrderService,
    public $modal: ModalController,
    public $product: ProductService,
    public $router: Router,
    public $toast: ToastController
  ) {

    this.header = true;
    this.deltaPrice = 0;
    this.user = this.$engine.currentUser;

    //
    // OrderItems[] for this vendor
    this.item = {};
    this.orders = [];
    this.vendor = '';

    this.format = this.$engine.defaultFormat;

  }


  ngOnInit() {    
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

  buildCustomerMSG(customers, idx, item) {
    const subject = this.REPLACE_MSG[idx].label.replace(/_ITEM_/g, item.title);
    const body = this.REPLACE_MSG[idx].body.replace(/_ITEM_/g, item.title).replace(/[«»%]/g, '');
    //
    // SMS links are platform dependant
    // https://stackoverflow.com/a/19126326
    const prefix = (document.documentElement.classList.contains('ios')) ? '&' : '?';

    const sms = customers.map(customer => {
      return [customer.name.familyName, customer.phoneNumbers[0].number];
    });

    const phones = customers.filter(customer => {
       return (customer.phoneNumbers.some(phone => phone.number.indexOf('022') > -1 || phone.number.indexOf('004122') > -1));
    }).map(customer => '<li>' + customer.displayName + '</li>').join('\n');

    return {subject, body, prefix, sms, phones};
  }

  buildCancelMSG(customers, idx, item) {
    const subject = this.REPLACE_MSG[idx].label.replace(/_ITEM_/g, item.title);
    const body = this.REPLACE_MSG[idx].body.replace(/_ITEM_/g, item.title).replace(/[«»%]/g, '');
    //
    // SMS links are platform dependant
    // https://stackoverflow.com/a/19126326
    const prefix = (document.documentElement.classList.contains('ios')) ? '&' : '?';

    const sms = customers.map(customer => {
      return [customer.name.familyName, customer.phoneNumbers[0].number];
    });

    const phones = customers.filter(customer => {
       return (customer.phoneNumbers.some(phone => phone.number.indexOf('022') > -1 || phone.number.indexOf('004122') > -1));
    }).map(customer => '<li>' + customer.displayName + '</li>').join('\n');

    return {subject, body, prefix, sms, phones};
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

  doCustomerContact(item, $event) {
    const idx = +($event.detail && $event.detail.value) || $event;

    //
    // build content message
    const customers = item.customers.map(order => order.customer);
    const {subject, body, prefix, sms, phones} = this.buildCustomerMSG(customers, idx, item);

    // // <a href="sms:/* phone number here */&body=/* body text here */">Link</a>
    // const mailhref = 'mailto:' + this.user.email.address +
    //              '?bcc=' + names.join(',') +
    //              '&subject=' + subject +
    //              '&body=' + body;

    // <a href="sms:/* phone number here */&body=/* body text here */">Link</a>
    const sendSMS = '<a class="" href="sms:' + (sms.map(p => p[1]).join(',')) +
                                                    prefix + 'body=' + encodeURI(body) + '">' +
                                                    sms.map(p => p[0]).join(', ') + '</a>';

    const message = `
    Contacter par SMS :
    <div class="message">${sendSMS}</div>
    <h4>Sans téléphone mobile</h4>
    <ul class="message">${phones}</ul>`;

    this.$alert.create({
      header: this.REPLACE_MSG[idx].label,
      subHeader: item.title,
      message: (message),
      cssClass: 'customer-message'
    }).then(alert => alert.present());

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
        const title = item.title.substring(0, len) + (item.title.length > len ? '...' : '');
        this.doToast(title + ' dans sac ' + order.rank);
        Object.assign(order, ok);
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
      }, error => this.doToast(error.error, error));
  }

  doAskCancel(order, item) {
    const idx = 1;

    //
    // build content message
    const customers = [order.customer];
    const {subject, body, prefix, sms, phones} = this.buildCustomerMSG(customers, idx, item);

    // <a href="sms:/* phone number here */&body=/* body text here */">Link</a>
    const sendSMS = '<a class="" href="sms:' + (sms.map(p => p[1]).join(',')) +
                                                    prefix + 'body=' + encodeURI(body) + '">' +
                                                    'Contacter client par SMS</a>';


    //
    // dialog center message
    let message = `<div class="message">${sendSMS}</div></div>`;
    if (sms.length && sms[0].length) {
      const  callPhone = '<a class="" href="tel:' + sms[0][1] + '">Contacter client par TEL</a>';
      message += `<div class="message">${callPhone}</div>`;
    }
    message += `<div class="message">Ou informer karibou.ch</div><h5 class="message">L'état du produit est actuellement</h5>`;

    this.$alert.create({
      header: 'Remplacer le produit avant de l\'annuler?',
      subHeader: item.title,
      message: (message),
      cssClass: 'customer-message',
      buttons: [{
        text: 'REMPLACER',
        cssClass: 'cancel-replace',
        handler: () => {
          this.doValidate(order, item);
        }
      }, {
        text: 'ANNULER',
        role: 'cancel',
        cssClass: 'cancel-danger',
        handler: () => {
          this.doCancel(order, item);
        }
      }]
    }).then(alert => alert.present());

  }

  doReplace(order, item) {
    const idx = 1;

    //
    // build content message
    const customers = [order.customer];
    const {subject, body, prefix, sms, phones} = this.buildCustomerMSG(customers, idx, item);

    // // <a href="sms:/* phone number here */&body=/* body text here */">Link</a>
    // const mailhref = 'mailto:' + this.user.email.address +
    //              '?bcc=' + names.join(',') +
    //              '&subject=' + subject +
    //              '&body=' + body;

    // <a href="sms:/* phone number here */&body=/* body text here */">Link</a>
    const sendSMS = '<a class="" href="sms:' + (sms.map(p => p[1]).join(',')) +
                                                    prefix + 'body=' + encodeURI(body) + '">' +
                                                    sms.map(p => p[0]).join(', ') + '</a>';

    const message = `Contacter par SMS : <div class="message">${sendSMS}</div>`;

    this.$alert.create({
      header: this.REPLACE_MSG[idx].label,
      subHeader: item.title,
      message: (message),
      cssClass: 'customer-message',
      buttons: ['Annulé sans contact', 'Annulé avec contact']
    }).then(alert => alert.present());

  }

  doClose() {
    this.$modal.dismiss();
  }

  doCancel(order, item) {
    this.$order.updateItem(order, [item], EnumFulfillments.failure)
      .subscribe(ok => {
        this.doToast('Annulation enregistrée');
        Object.assign(order, ok);
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

