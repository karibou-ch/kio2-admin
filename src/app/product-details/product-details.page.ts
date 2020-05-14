import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { Product, Config, Category, Shop, User, LoaderService, ProductService } from 'kng2-core';
import { LoadingController, ToastController, ModalController } from '@ionic/angular';
import { EngineService } from '../services/engine.service';
import { UploadImagePage } from '../upload-image/upload-image.page';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, fromEvent, of } from 'rxjs';
import { debounceTime, filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.page.html',
  styleUrls: ['./product-details.page.scss'],
})
export class ProductDetailsPage implements OnInit {

  defaultProduct: Product = new Product();
  detailled = false;
  create = false;
  config: Config;
  categories: Category[] = [];
  currentCategory: Category;
  product: Product;
  shops: Shop[];
  TVAs: number[];
  title: string;
  user: User;
  sku: string;


  constructor(
    private $elem: ElementRef,
    private $engine: EngineService,
    private $loading: LoadingController,
    private $modal: ModalController,
    private toast: ToastController,
    private $loader: LoaderService,
    private $product: ProductService,
    private $route: ActivatedRoute
  ) {

    this.user = this.$engine.currentUser;
    this.config = this.$engine.currentConfig;
    this.shops = this.user.shops || [];
    this.sku = this.$route.snapshot.params.sku;


    this.create = (this.sku === 'create');


    this.title = '';
    this.TVAs = [];
  }

  ngAfterViewInit() {
    fromEvent(this.$elem.nativeElement, 'focusout').pipe(
      debounceTime(2000),
      map($event => this.shops.find(shop => shop._id === this.product.vendor)),
      filter(shop => {
        return !this.isProductReadyTosave(this.product, shop);
      })
   ).subscribe(shop => {
    this.doSave(this.product, true);
   });

  }

  ngOnInit() {

    const product$ = (this.create) ? of(this.product) : this.$product.get(this.sku);

    combineLatest(
      this.$loader.ready(),
      product$,
    ).subscribe(([loader, product]: any) => {
      //
      // only interrested by active category
      this.categories = (loader[2] || []).filter(c => c.type === 'Category' && c.active);
      //
      // admin can move a product to all shops
      if (this.user.isAdmin()) {
        this.shops = loader[3].sort((s1, s2) => s1.urlpath.localeCompare(s2.urlpath));
      }

      this.TVAs = this.config.shared.TVA;

      this.product = product;
      this.product.categories = product.categories || {};
      this.product.categories = product.categories._id || this.product.categories;
      this.product.vendor = product.vendor._id || this.product.vendor;
      this.product.belong = product.belong || {name: null, weight: 0};
      this.title = product.title;

      //
      // default vendor
      if ((this.shops.length > 0 || this.shops.length < 3) &&
         (typeof this.product.vendor !== 'string')) {
        this.product.vendor = this.shops[0]._id;
      }

      //
      // default categories
      this.currentCategory = this.categories.find(cat => (cat._id + '') == this.product.categories);
    });

  }

  categoryChange() {
    this.currentCategory = this.categories.find(cat => (cat._id + '') == this.product.categories);
  }


  getChild() {
    if (!this.currentCategory) {
      return [];
    }
    return (this.currentCategory.child || []);
  }

  isReady() {
    if (!this.product) {
      return false;
    }
    return this.product.vendor && this.product.categories;
  }

  isProductReadyTosave(product: Product, shopowner: Shop): number {
    if (!shopowner || !shopowner.urlpath) {
      //
      // TODO DEBUG only
      console.log('---- vendor', this.shops);
      console.log('---- p.vendor', product.vendor);
      console.log('---- shopowner', shopowner);

      return 1;
    }


    //
    // validate belong
    if (product.belong.name && this.currentCategory) {
      const child = this.currentCategory.child.find(child => child.name === product.belong.name);
      if (!child) {
       return 2;
      }

      //
      // update belong value
      product.belong = child;
      delete product.belong['_id'];
     }

    return 0;
  }

  roundN(val, N?) {
    if (val <= 5) {
      return val.toFixed(1);
    }
    if (val <= 50) {
      return Math.round(val);
    }
    N = N || 5;
    return (Math.round(val / N) * N);
  }

  portionStr(part, def?) {
    if (!def) {def=''; }
    if (!part) { return ""; }
    let m = part.match(/~([0-9.]+) ?(.+)/);
    if (!m && def) {m=def.match(/~([0-9.]+) ?(.+)/); }
    if (!m || m.length < 2) {return ''; }
    let w = parseFloat(m[1]), unit = (m[2]).toLowerCase();
    return 'une portion entre ' + this.roundN(w - w * 0.07) + unit + ' et ' + this.roundN(w + w * 0.07) + '' + unit;
  }



  doSave(product: Product, silent?: boolean) {
    const shopowner = this.shops.find(shop => shop._id === product.vendor);
    const error = this.isProductReadyTosave(product, shopowner);

    if(error === 1) {
      silent || this.$loading.dismiss();
      return this.toast.create({
        message: 'La boutique n\'a pas été sélectionnée',
        duration: 3000
      }).then(alert => alert.present());
    }

    if(error === 2) {
      silent || this.$loading.dismiss();
      return this.toast.create({
        message: 'La sous catégorie  n\'est pas compatible',
        duration: 3000
      }).then(alert => alert.present());
    }

    if (!silent) {
      this.$loading.create({
        message: 'Please wait...'
      }).then(alert => alert.present());
    }


    // this.product.hasFixedPortion();
    const product$ = (this.create) ?
      this.$product.create(this.product, shopowner.urlpath) : this.$product.save(this.product);

    product$.subscribe(
      (product) => {
        this.create = false;
        this.product.sku = product.sku;
        this.product.categories = product.categories._id|| product.categories;
        this.product.vendor = product.vendor._id|| product.vendor;

        //
        // cached
        this.$engine.setCurrentProduct(this.product);

        if (!silent) {
          this.$loading.dismiss();
          this.toast.create({
            message: 'Enregistré',
            duration: 3000
          }).then(alert => alert.present());
        }
      },
      error => {
        if (!silent) {
          this.$loading.dismiss();
        }
        this.toast.create({
          message: error.error,
          duration: 5000,
          position: 'top',
          cssClass: 'toast-error'
        }).then(alert => alert.present());
      }
    );
  }

  doCreate() {

  }


  getCategories() {
    return this.categories;
  }


  uploadImage(product: Product) {
    const params = {
      user: this.user,
      config: this.config,
      product: this.product
    };

    this.$modal.create({
      component: UploadImagePage,
      componentProps: params
    }).then(alert => alert.present());

  }


}