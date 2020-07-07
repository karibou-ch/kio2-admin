import { Component, OnInit } from '@angular/core';
import { Config, User, Shop, ShopService } from 'kng2-core';
import { Router, ActivatedRoute } from '@angular/router';
import { EngineService } from '../services/engine.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-vendors',
  templateUrl: './vendors.page.html',
  styleUrls: ['./vendors.page.scss'],
})
export class VendorsPage implements OnInit {
  isReady: boolean;
  loadError: boolean;
  noShop: boolean;
  config: Config;
  user: User;
  shops: Shop[];
  hubs: any[];
  currentHub: any;

  cache: {
    discount: boolean;
    active: boolean;
    boost: boolean;
    search: string;
    shops: Shop[];
    step: number;
    start: number;
  };


  constructor(
    private $route: ActivatedRoute,
    private $router: Router,
    private $engine: EngineService,
    private $shop: ShopService,
    private toast: ToastController,
  ) {
    this.cache = {
      discount: false,
      active: true,
      boost: false,
      search: '',
      shops: [],
      step: 50,
      start: 0
    };

    this.hubs = [];
  }

  ngOnInit() {
    this.user = this.$engine.currentUser;
    this.config = this.$engine.currentConfig;
    const loader = this.$route.snapshot.data.loader;

    //
    // select default HUB 
    this.hubs = (this.config.shared.hubs || []).slice();
    if (this.hubs.length) {
      //
      // if you are associed to one HUB
      this.currentHub = this.hubs[0];
      if (this.user.hubs && this.user.hubs.length === 1) {
        this.currentHub = this.hubs.find(hub => hub.slug === this.user.hubs[0]);
      }
      this.currentHub.selected = true;
    }


    //
    // all available shops
    if (this.user.isAdmin()) {
      this.cache.shops = (loader[3] || []).sort(this.sortByVendor);
      if (!this.cache.shops.length) {
        this.getVendors();
      }
    } else {
      this.cache.shops = this.user.shops || [];
    }

    this.shops = this.cache.shops;

    this.$shop.shop$.subscribe(
      shop => {
        this.cache.shops.some((origin, i) => {
          if (shop.urlpath === origin.urlpath) {
            this.cache.shops[i] = shop;
            return true;
          }
          return false;
        });
      }
    );
  }

  getVendors() {
    const options: any = {

    };
    //
    // set default HUB
    if (this.currentHub) {
      options.hub = this.currentHub.slug;
    }
    this.$shop.query(options).subscribe(shops => {
      this.shops = this.cache.shops = shops.sort(this.sortByVendor);
    }, status => {
      this.toast.create({
        message: (status.message || status),
        duration: 3000,
        color: 'alert'
      }).then(alert => alert.present());
    });
  }

  onCreateVendor() {
    // this.navCtrl.push('VendorCreatePage', {
    //   user: this.user,
    //   categories: this.categories
    // });
    this.$router.navigate(['/vendor', 'create']);
  }

  onDone(msg) {
    this.toast.create({
      message: msg,
      duration: 3000
    }).then(alert => alert.present());
  }

  openDetails(shop: Shop) {
    // this.navCtrl.push('VendorDetailsPage',{
    //   shop:shop,
    //   user:this.user,
    //   categories:this.categories
    // });
    this.$router.navigate(['/vendor', shop.urlpath]);
  }

  onSearchInput($event) {
    const search = this.cache.search.toLocaleLowerCase();
    if (search.length < 3) {
      return this.shops = this.cache.shops;
    }

    this.shops = this.cache.shops.filter((shop: Shop) => {
      const content = (shop.name + shop.description) || '';
      return content.toLocaleLowerCase().indexOf(search) > -1;
    });
  }

  onSearchCancel($event) {
    this.cache.search = '';
    this.cache.start = 0;
    this.shops = this.cache.shops;
  }

  setCurrentHub(hub) {
    this.hubs.forEach( h => h.selected = false);
    this.currentHub = this.hubs.find(h => h.id === hub.id) || {};
    this.currentHub.selected = true;
    this.getVendors();
  }

  sortByVendor(p1: Shop, p2: Shop) {
    if (p1.available.active) {
      return -1;
    }
    if (p2.available.active) {
      return 1;
    }

    return p1.urlpath.localeCompare(p2.urlpath);
  }

}
