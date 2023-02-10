import { Component, OnInit, ElementRef, KeyValueDiffers, KeyValueDiffer } from '@angular/core';
import { Product, ProductPortion, Utils, Config, Category, Shop, User, LoaderService, ProductService, ShopService, OrderService } from 'kng2-core';
import { LoadingController, ToastController, ModalController } from '@ionic/angular';
import { EngineService } from '../services/engine.service';
import { UploadImagePage } from '../upload-image/upload-image.page';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, of } from 'rxjs';

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
  recipes: string[] = [];
  product: Product;
  productInOrders: any[];
  portion: ProductPortion;
  shops: Shop[];
  TVAs: number[];
  title: string;
  user: User;
  sku: string;

  //
  // TODO make this compliant with the server.
  productDiff:KeyValueDiffer<string, any>;
  saveBeforeQuit = false;


  constructor(
    private $differs: KeyValueDiffers,
    private $engine: EngineService,
    private $modal: ModalController,
    private $toast: ToastController,
    private $loader: LoaderService,
    private $product: ProductService,
    private $shops: ShopService,
    private $orders: OrderService,
    private $route: ActivatedRoute,
    private $router: Router
  ) {

    const loader = this.$route.snapshot.data.loader;
    this.categories = loader[2];

    this.user = this.$engine.currentUser;
    this.config = this.$engine.currentConfig;
    this.recipes = this.$engine.currentConfig.shared.recipes ||[];

    this.shops = this.user.shops || [];
    this.sku = this.$route.snapshot.params.sku;
    this.productInOrders = [];


    if (this.sku === 'create') {
      // create a copy ?
      this.create = true;
      this.product = new Product();
      this.portion = this.product.getPortionParts();
    }


    this.title = '';
    this.TVAs = [];
  }

  ngAfterViewInit() {
    // console.log('--- ngAfterViewInit')
  //   fromEvent(this.$elem.nativeElement, 'focusout').pipe(
  //     debounceTime(2000),
  //     skip(1),
  //     map($event => this.shops.find(shop => shop._id === this.product.vendor)),
  //     filter(shop => {
  //       return !this.isProductReadyTosave(this.product, shop);
  //     })
  //  ).subscribe(shop => {
  //   this.doSave(this.product, true);
  //  });

  }



  //
  // ngOnChanges
  // https://angular.io/guide/lifecycle-hooks#using-change-detection-hooks
  // ngDoCheck() {
  // }  

  ngOnDestroy() {
    const routerOutlet = document.getElementsByTagName('ion-router-outlet');
    routerOutlet.length && (routerOutlet[0].classList.remove('boost-zindex'));
  }

  ngOnInit() {
    if(this.$route.snapshot.queryParamMap.has('option')) {
      const routerOutlet = document.getElementsByTagName('ion-router-outlet');
      routerOutlet.length && (routerOutlet[0].classList.add('boost-zindex'));  
    }

    const orders$ = (this.create)? of([]):this.$orders.findProductsInPendingOrders([this.sku]);

    const product$ = (this.create) ? of(this.product) : this.$product.get(this.sku);
    if( !this.shops.length) {
      this.getVendors();
    }

    combineLatest([
      this.$loader.ready(),
      product$,
      orders$
    ]).subscribe(([loader, product,orders]: any) => {

      this.productInOrders = orders || [];
      //
      // only interrested by active category
      this.categories = (loader[2] || []).filter(c => c.type === 'Category' && c.active);
      //
      // admin can move a product to all shops
      if (this.user.isAdmin()) {
        this.shops = (loader[3] || []).sort((s1, s2) => s1.urlpath.localeCompare(s2.urlpath));
      }

      this.TVAs = this.config.shared.TVA;

      this.doInitProduct(product);
      //
      // default categories
      this.currentCategory = this.categories.find(cat => (cat._id + '') == this.product.categories);

    });

  }

  doInitProduct(product){
    this.product = product;
    this.product.sku = product.sku;
    this.product.categories = product.categories || {};
    this.product.categories = product.categories._id || this.product.categories;
    this.product.vendor = product.vendor._id || this.product.vendor;
    this.product.belong = product.belong || {name: null, weight: 0};
    this.product.details = product.details || {};
    this.title = product.title;

    this.portion = product.getPortionParts();

    //
    // default vendor
    if ((this.shops.length > 0 && this.shops.length < 3) &&
       (typeof this.product.vendor !== 'string')) {
      this.product.vendor = this.shops[0]._id;
    }

      //
      // default product differ!
      const dotNotation = this.$product.dotNotation(this.product);
      this.productDiff = this.$differs.find(dotNotation).create();
      this.productDiff.diff(dotNotation);
  }

  doCreateVariant(product: Product) {
    if (!product.variants) {
      product.variants = [];
    }
    product.variants.push({
      title: '',
      short: ''
    });
  }

  //
  // create a copy of this product
  doCreateCopy(product: Product) {
    const copy = (product) => {
      const details = {
        description: product.details.description,
        origin: product.details.origin,
      };
      return Object.assign({}, {
        belong: product.belong,
        categories: product.categories,
        details: (details),
        pricing: product.pricing,
        recipes: product.recipes,
        quantity: product.quantity,
        shelflife: product.shelflife,
        title: product.title,
      });
    };
    const content = JSON.stringify(copy(product));
    this.$router.navigateByUrl('/product/create');

    this.create = true;
    this.product = new Product(JSON.parse(content));
    this.currentCategory = this.categories.find(cat => (cat._id + '') == this.product.categories);

  }

  doUpdatePart(part) {
    this.product.pricing.part = part;
    this.portion = this.product.getPortionParts();
  }

  doUpdatePriceKG($event) {
    const price = parseFloat($event.target.value);
    if(isNaN(price)) {
      return;
    }
    this.product.pricing.price = Utils.roundAmount(price/1000 * this.portion.part);
    this.portion = this.product.getPortionParts();
  }

  categoryChange($event) {
    // this.product.categories = $event.detail.value;
    if(!$event.detail.value) {
      return;
    }
    const id = $event.detail.value._id || $event.detail.value;
    this.currentCategory = this.categories.find(cat => (cat._id + '') == id);
    this.product.categories = this.currentCategory._id;
  }

  isDisabled() {
    return !this.product || !!this.product.attributes.available;
  }

  getHistory() {
    this.$product.history(this.sku).subscribe(history => {
      history.forEach(activity => {
        console.log('-- ',(new Date(activity.when)).toDateString(),activity.who.email);
        console.log('',activity.content);
      });
  
    });
  }

  getVendors() {
    const options: any = {      
    };
    this.$shops.query(options).subscribe(shops => {
      this.shops = shops.sort(this.sortByVendor);
    }, status => {
      this.$toast.create({
        message: (status.message || status),
        duration: 3000,
        color: 'alert'
      }).then(alert => alert.present());
    });
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

  isProductModified() {
    let changed = false;
    if(!this.productDiff ) {
      return false;
    }
    const changes = this.productDiff.diff(this.$product.dotNotation(this.product));
    if (changes) {      
      changes.forEachAddedItem((record) => {
        const previous = record.previousValue && record.previousValue.valueOf();
        console.log(record.key,'added',previous,'=>',record.currentValue.valueOf());        
        changed = true;
      });      

      changes.forEachChangedItem((record) => {
        const previous = record.previousValue && record.previousValue.valueOf();
        console.log(record.key,'update',previous,'=>',record.currentValue.valueOf());        
        changed = true;
      });      
    }
    return changed;
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
    if (!product.belong.name) {
      return 2;
    }
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


  async doBack() {
    try{
      //
      // automatique saving 
      if(this.isProductModified()) {
        if (confirm('Voulez-vous enregistrer avant de quitter?')) {
          await this.doSave(this.product);
        }
      }
      window.history.back();
    }catch(err) {
      console.log('--- ERR doBack',err)

    }
  }

  async doSave(product: Product, silent?: boolean) {
    const shopowner = this.shops.find(shop => shop._id === product.vendor);
    const error = this.isProductReadyTosave(product, shopowner);

    if (error === 1) {
      // silent || this.$loading.dismiss();
      return this.$toast.create({
        message: 'La boutique n\'a pas été sélectionnée',
        duration: 3000,
        color: 'danger',
        position: 'middle'
      }).then(alert => alert.present());
    }

    if (error === 2) {
      // silent || this.$loading.dismiss();
      return this.$toast.create({
        message: 'La sous catégorie  n\'est pas compatible',
        duration: 3000,
        color: 'danger',
        position: 'middle'
      }).then(alert => alert.present());
    }

    if (!silent) {
      // const alert = await this.$loading.create({
      //   message: 'Please wait...'
      // });
      // await alert.present();
    }


    // this.product.hasFixedPortion();
    const promise = (this.create) ?
      this.$product.create(this.product, shopowner.urlpath).toPromise() : this.$product.save(this.product).toPromise();

    promise.then(
      (product) => {
        this.create = false;

        this.doInitProduct(product);        
        //
        // cached
        this.$engine.setCurrentProduct(this.product);

        //
        // update diff engine
        setTimeout(()=> {
          const dotNotation = this.$product.dotNotation(this.product);
          this.productDiff = this.$differs.find(dotNotation).create();
          this.productDiff.diff(dotNotation);
        },200);

        if (!silent) {
          // this.$loading.dismiss();
          this.$toast.create({
            message: 'Enregistré',
            duration: 3000,
            color: 'dark'
          }).then(alert => alert.present());
        }
      });
      promise.catch(status => {
        if (!silent) {
          // this.$loading.dismiss();
        }
        console.log('----- ERREUR',status.error);
        return this.$toast.create({
          message: status.error,
          duration: 5000,
          position: 'middle',
          color: 'danger'
        }).then(alert => alert.present());
      },
    );

    return promise;
  }

  doRemove() {
    const password = prompt("Confirmer la suppression avec votre mot de passe");

    this.$product.remove(this.product.sku,password).subscribe(()=>{
      console.log('--- DBG delete',this.product.sku)
      this.$router.navigateByUrl('/products');
    })
  }



  getCategories() {
    return this.categories;
  }

  sortByVendor(p1: Shop, p2: Shop) {
    return p1.name.localeCompare(p2.name);
  }


  recipeChecked(recipe){
    const position = this.product.recipes.indexOf(recipe.slug);
    return (position > -1);
  }

  recipeUpdate(recipe){
    const position = this.product.recipes.indexOf(recipe.slug);
    if(position == -1){
      this.product.recipes.push(recipe.slug);
    } else{
      this.product.recipes.splice(position,1);
    }
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
