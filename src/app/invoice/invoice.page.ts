import { Component, OnInit } from '@angular/core';
import { OrderService, Order, Config, User } from 'kng2-core';
import { EngineService } from '../services/engine.service';
import { AlertController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-invoice',
  templateUrl: './invoice.page.html',
  styleUrls: ['./invoice.page.scss'],
})
export class InvoicePage implements OnInit {

  hubs: any[];
  hubsRank: any;
  currentHub: any;
  orders: Order[];
  paids: Order[];
  user: User;
  config: Config;
  isReady: boolean;

  constructor(
    private $alert: AlertController,
    private $engine: EngineService,
    public $toast: ToastController,
    private $order: OrderService,
  ) {
    this.orders = [];
    this.paids = [];

    this.user = this.$engine.currentUser;
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

  }

  get ordersAll(){
    return this.paids.concat(this.orders);
  }

  ngOnInit() {
    const options = {
      fulfillments: 'fulfilled',
      payment: 'invoice'
    };

    this.$order.findAllOrders(options).subscribe(orders => {
      this.orders = orders as Order[];
      this.isReady = true;
    });
    options.payment='invoice_paid'
    this.$order.findAllOrders(options).subscribe(orders => {
      this.paids = orders as Order[];
      this.isReady = true;
    });

  }


  doRefresh(refresher) {
    //
    // use Observer to complete refresher
    setTimeout(() => {
      window.location.reload();
      refresher.target.complete();
    }, 500);
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


  getPhoneNumber(order: Order) {
    if (!order || !order.customer.phoneNumbers || !order.customer.phoneNumbers.length) {
      return false;
    }
    return order.customer.phoneNumbers[0].number;
  }

  getTotal(order: Order) {
    return order.getTotalPrice();
  }

  getSubTotal(order: Order) {
    return order.getSubTotal();
  }


  isDeposit(order) {
    // undefined test is for Bretzel
    return order.shipping.deposit || (order.shipping.deposit == undefined);
  }


  orderCapture(order: Order) {
    this.$order.capture(order).subscribe(
      (ok) => {
        Object.assign(order, ok);
        this.onDone('Commande payée');
      },
      status => {
        this.onDone(status.error);
      }
    );

  }

  onDone(msg) {
    this.$toast.create({
      message: msg,
      duration: 3000,
      color: 'dark'
    }).then(alert => alert.present());

  }


}
