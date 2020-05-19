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

  }

  ngOnInit() {
    this.user = this.$engine.currentUser;
    this.config = this.$engine.currentConfig;
    const loader = this.$route.snapshot.data.loader;

    //
    // all available shops
    if (this.user.isAdmin()) {
      this.cache.shops = (loader[3] || []).sort(this.sortByVendor);
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


  onCreateVendor() {
    // this.navCtrl.push('VendorCreatePage', {
    //   user: this.user,
    //   categories: this.categories
    // });
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
  }

  onSearchInput($event) {
    const search = this.cache.search.toLocaleLowerCase();
    console.log('--- search',this.cache.search, $event.target.value);
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
