import { Component, OnInit } from '@angular/core';
import { Product, Config, User, ProductService } from 'kng2-core';
import { EngineService } from '../services/engine.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
})
export class ProductsPage implements OnInit {


  isReady: boolean;
  loadError: boolean;
  noShop: boolean;
  config: Config;
  user: User;
  products: Product[];
  cache: {
    discount: boolean;
    active: boolean;
    boost: boolean;
    search: string;
    products: Product[];
    step: number;
    start: number;
  };


  constructor(

    private $engine: EngineService,
    private $product: ProductService,
    private toast: ToastController,
  ) {
    this.cache = {
      discount: false,
      active: true,
      boost: false,
      search: '',
      products: [],
      step: 50,
      start: 0
    };

    this.user = this.$engine.currentUser;
    this.config = this.$engine.currentConfig;
  }

  doCreateProduct() {
    // this.navCtrl.push('ProductDetailPage', {
    //   product: new Product(),
    //   config: this.config,
    //   user: this.user,
    //   create: true
    // });
  }

  doInfinite(infiniteScroll) {
    if (this.cache.search !== '') {
      return infiniteScroll.target.complete();
    }
    setTimeout(() => {
      this.cache.start += this.cache.step;
      this.products = this.sliceProducts();
      infiniteScroll.target.complete();
    }, 100);
  }

  filteredProducts() {
    return (this.products || []);
  }

  getAvatar(product: Product) {
    if (!product || !product.photo.url) {
      return '/assets/img/add.png';
    }
    return 'https:' + product.photo.url + '/-/resize/128x/';

  }

  getStateLabel(product: Product) {
    return product.attributes.available ? 'Disponible' : 'Indisponible';
  }

  ngOnDestroy() {
    // this.events.unsubscribe('refresh-products');
  }

  ngOnInit() {
  
    this.loadProducts();

    //
    // update product list after modification
    // this.events.subscribe('refresh-products', (product) => {
    //   if (product) {
    //     const idx = this.products.findIndex(prod => prod.sku == product.sku);
    //     const idxcached = this.cache.products.findIndex(prod => prod.sku == product.sku);
    //     if (idxcached) {
    //       Object.assign(this.cache.products[idxcached], product);
    //     }
    //     if (idx) {
    //       Object.assign(this.products[idx], product);
    //     }
    //     if (idx || idxcached) {
    //       return;
    //     }

    //   }
    //   this.loadProducts();
    // });

  }

  loadProducts() {
    const params:any = {};
    //
    // get select products
    if (this.user.shops.length) {
      params.shopname = this.user.shops.map(shop => shop.urlpath);
    }
    if (!this.user.isAdmin() && !this.user.shops.length) {
      params.shopname = ['no-shop-to-list'];
      this.noShop = true;
    }

    if (!this.user.isAuthenticated()) {
      this.loadError = true;
      return;
    }

    this.$product.select(params).subscribe(
      (products: Product[]) => {
        //
        // FIXME remove filter, server should clean orphan products!
        this.cache.products = products.filter(p => p.vendor).sort(this.sortByVendorAndStock);
        this.products = this.sliceProducts();
      }
    );
  }

  onDone(msg) {
    this.toast.create({
      message: msg,
      duration: 3000
    }).then(alert => alert.present());
  }


  openDetails(product: Product) {
    // this.navCtrl.push('ProductDetailPage', {
    //   product,
    //   config: this.config,
    //   user: this.user
    // });

  }

  onSearchInput($event) {
    this.sliceProducts();
  }

  onSearchCancel($event) {
    this.cache.search = '';
    this.cache.start = 0;
    this.products = this.sliceProducts();
  }


  resume(product: Product) {
    // product.pricing.price
    // product.pricing.stock
    // product.pricing.part
    // product.attributes.available
    // product.attributes.discount
    return product.pricing.price;
  }

  //
  // infiniteScroll OR filter options change
  sliceProducts(len?) {
    const search = this.cache.search.toLocaleLowerCase();

    this.products = this.cache.products
      .filter((product, i) => {
        return !this.cache.boost || product.attributes.discount || product.attributes.home;
      })
      .filter((product) => {
        if(!this.cache.discount){
          return true;
        }
        return product.attributes.discount;
      })
      .filter((product) => {
        return this.cache.active === product.attributes.available;
      })
      .filter(product => {
        if (search == '') {
          return true;
        }
        return (product.title +
          product.details.description +
          product.vendor.name +
          product.details.keywords).toLocaleLowerCase().indexOf(search) > -1;
      })
      .slice(0, this.cache.start + this.cache.step);
    return this.products;
  }


  sortByVendorAndStock(p1: Product, p2: Product) {
    const vendor = (p1.vendor).urlpath.localeCompare(p2.vendor.urlpath);
    if (vendor != 0) {
      return vendor;
    }
    // order by stock
    return p1.pricing.stock - p2.pricing.stock;
  }

  toggleActive(product: Product) {
    product.attributes.available = !product.attributes.available;
    this.$product.save(product).subscribe(
      () => {
        this.onDone('Enregistré');
      },
      (error) => {
        this.onDone(error.error);
      }
    );
  }



}
