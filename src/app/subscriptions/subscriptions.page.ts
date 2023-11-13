import { Component, OnInit } from '@angular/core';
import { Config, User, CartSubscription, CartService } from 'kng2-core';
import { Router, ActivatedRoute } from '@angular/router';
import { EngineService } from '../services/engine.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'kng-subscriptions',
  templateUrl: './subscriptions.page.html',
  styleUrls: ['./subscriptions.page.scss'],
})
export class SubscriptionsPage implements OnInit {
  isReady: boolean;
  loadError: boolean;
  config: Config;
  user: User;

  weekdays = "dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_");
  hubs: any[];
  currentHub: any;
  subscriptions: CartSubscription[];

  cache: {
    active: boolean;
    search: string;
    subscriptions: CartSubscription[];
    step: number;
    start: number;
  };


  constructor(
    private $route: ActivatedRoute,
    private $router: Router,
    private $engine: EngineService,
    private $cart: CartService,
    private toast: ToastController,
  ) {
    this.cache = {
      active: true,
      search: '',
      subscriptions: [],
      step: 50,
      start: 0
    };

    this.subscriptions = [];
    this.hubs = [];
  }

  ngOnInit() {
    this.user = this.$engine.currentUser;
    this.config = this.$engine.currentConfig;
    const loader = this.$route.snapshot.data['loader'];

    //
    // select default HUB 
    this.hubs = (this.config.shared.hubs || []).slice();
    if (this.hubs.length) {
      //
      // if you are associed to one HUB
      this.currentHub = this.hubs[0];
      if (this.user.hubs && this.user.hubs.length === 1) {
        this.currentHub = this.hubs.find(hub => hub.slug === this.user.hubs[0])||this.currentHub;
      }
      this.currentHub.selected = true;
    }


    //
    // all available shops
    this.subscriptionsGet();

    this.subscriptions = this.cache.subscriptions;
  }

  namedDayOfWeek(day:number) {
    return this.weekdays[day];
  }

  subscriptionsGet() {
    this.cache.subscriptions = [];

    
    this.$cart.subscriptionsGetAll().subscribe(subscriptions => {
      this.subscriptions = this.cache.subscriptions = subscriptions.sort(this.sortBySubscription);
      this.isReady = true;
    }, status => {
      this.toast.create({
        message: (status.message || status),
        duration: 3000,
        color: 'alert'
      }).then(alert => alert.present());
    });
  }


  openDetails(subscription: CartSubscription) {
  }

  onSearchInput($event) {
    const search = this.cache.search.toLocaleLowerCase();
    if (search.length < 3) {
      return this.subscriptions = this.cache.subscriptions;
    }

    return this.subscriptions = this.cache.subscriptions.filter((subscription: CartSubscription) => {
      const content = (subscription.items.map(item=>item.title).join(' ') + subscription.description) || '';
      return content.toLocaleLowerCase().indexOf(search) > -1;
    });
  }

  onSearchCancel($event) {
    this.cache.search = '';
    this.cache.start = 0;
    this.subscriptions = this.cache.subscriptions;
  }

  setCurrentHub(hub) {
  }

  sortBySubscription(p1: CartSubscription, p2: CartSubscription) {
    if (p1.status !== "active" || p2.status !== "active") {
      return -1;
    }

    //return p2.nextInvoice.getTime() - (p1.nextInvoice.getTime());
    return 1;
  }

}
