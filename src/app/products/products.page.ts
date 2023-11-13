import { Component, OnInit } from '@angular/core';
import { Product, Config, User, ProductService, ShopService, Shop } from 'kng2-core';
import { EngineService, OrdersCtx } from '../services/engine.service';
import { ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';

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
  defaultShop: string;
  skus: string[];
  products: Product[];
  cache: {
    discount: boolean;
    subscription: boolean;
    active: boolean;
    boost: boolean;
    search: string;
    products: Product[];
    step: number;
    start: number;
  };


  constructor(
    private $route: ActivatedRoute,
    private $router: Router,
    private $engine: EngineService,
    private $product: ProductService,
    private $shop: ShopService,
    private toast: ToastController,
  ) {
    this.cache = {
      discount: false,
      subscription:false,
      active: true,
      boost: false,
      search: '',
      products: [],
      step: 50,
      start: 0
    };

    this.user = this.$engine.currentUser;
    this.config = this.$engine.currentConfig;

    const loader = this.$route.snapshot.data['loader'];
    //
    // filter active shop and order by name
    this.skus = [];
    this.$engine.findVendors();

  }

  get isManager() {
    return this.user.isAdmin() || this.user.hasRole('manager');
  }

  get isManagerOrLogistic(){
    return this.user.isAdmin() || this.user.hasRole('manager') || this.user.hasRole('logistic');
  }

  get shops(): Shop[]{
    return this.$engine.shops;
  }


  ngAfterViewInit() {
    // console.log('---', window.history)
  }

  doCreateProduct() {
    this.$router.navigateByUrl('/product/create');
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

  ngOnInit() {
    this.$engine.selectedOrders$.subscribe(this.onInitOrders.bind(this));
    this.$engine.findAllOrders()

  }

  loadProducts(forceShops?) {
    this.isReady = false;


    const params:any = {};
    params.shopname = ['no-shop-to-list'];
    this.noShop = true;

    if (!this.user.isAuthenticated()) {
      this.loadError = true;
      return;
    }

    //
    // get selected product for admin or manager
    //
    
    // case of admin
    if(forceShops) {
      params.shopname = forceShops;
      params.skus = [];
    }
    else if (this.user.isAdmin() || this.user.hasRole('manager') || this.user.hasRole('logistic')){
      params.skus = this.skus.slice();
      params.shopname = [];
    }

    //
    // get select products for vendor
    if (this.user.shops.length) {
      params.shopname = this.user.shops.map(shop => shop.urlpath);
    }


    //
    // force reload
    params.rnd = Date.now();

    this.$product.select(params).subscribe(
      (products: Product[]) => {
        //
        // FIXME remove filter, server should clean orphan products!
        this.isReady = true;
        this.cache.products = products.filter(p => p.vendor).sort(this.sortByVendorAndStock);
        this.products = this.sliceProducts();
      }
    );
  }

  onInitOrders(ctx: OrdersCtx) {
    //
    // set default order value based on postalCode
    const skus = ctx.orders.map(order => order.items.map(item => item.sku+''))
                           .reduce((flatten, array) => flatten.concat(array), []);
    this.skus = [...new Set(skus)] as string[];

    this.loadProducts();
  }

  onSelectDefaultShop($event) {
    const shop = $event.detail.value;
    console.log('def ',shop);
    this.loadProducts([shop]);

  }

  onDone(msg) {
    this.toast.create({
      message: msg,
      duration: 3000
    }).then(alert => alert.present());
  }

  openDetails(product: Product) {
    const params = {
      product: (product)
    };
    this.$router.navigate(['/product', product.sku]);
    // this.$modal.create({
    //   component: ProductDetailsPage,
    //   componentProps: params
    // }).then(alert => alert.present());
  }

  onSearchInput($event) {
    this.sliceProducts();
  }

  onSearchCancel($event) {
    this.cache.search = '';
    this.cache.start = 0;
    this.products = this.sliceProducts();
  }

  onUpdateStock(product: Product, count: number) {
    product.pricing.stock = count;
    this.$product.save(product).subscribe(
      () => {
        this.onDone('Enregistré');
      },
      (error) => {
        this.onDone(error.error);
      }
    );
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
        if(!this.cache.subscription){
          return true;
        }
        return product.attributes.subscription;
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
