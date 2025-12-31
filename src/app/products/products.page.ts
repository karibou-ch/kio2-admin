import { Component, OnInit } from '@angular/core';
import { Product, Config, User, ProductService, ShopService, Shop } from 'kng2-core';
import { EngineService, OrdersCtx } from '../services/engine.service';
import { ToastController, AlertController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';

export const attributesFilters = [
  'lastMinute',
  'boost',
  'discount',
  'subscription',
  'business',
  'home',
];
export interface ProductsFilterOptions {
  forceShops?: string[];
  lastMinute?: boolean;
  subscription?: boolean;
  discount?: boolean;
  boost?: boolean;
  business?: boolean;
  home?: boolean;
  lowstock?: boolean;
}

export interface SelectionMode {
  enabled: boolean;
  selectedProducts: Set<number>; // SKUs des produits sélectionnés
}


@Component({
  selector: 'kio-products',
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
    active: boolean;
    search: string;
    products: Product[];
    step: number;
    start: number;
    sortByStock: boolean;
  };

  filters: ProductsFilterOptions = {
  };

  selectionMode: SelectionMode = {
    enabled: false,
    selectedProducts: new Set<number>()
  };

  constructor(
    private $router: Router,
    private $engine: EngineService,
    private $product: ProductService,
    private toast: ToastController,
    private alert: AlertController
  ) {
    this.cache = {
      active: true,
      search: '',
      products: [],
      step: 50,
      start: 0,
      sortByStock:true
    };

    this.user = this.$engine.currentUser;
    this.config = this.$engine.currentConfig;

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


  get userShops(): string[]{
    return this.user?.shops?.map(shop => shop.urlpath) || [];
  }


  doCreateProduct() {
    this.$router.navigate(['/product','create'],{queryParams:{vendor:this.defaultShop}});
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
    const sort = this.cache.sortByStock ? this.sortByVendorAndStock : this.sortAlphaNum;
    return (this.products || []).sort(sort);
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

  loadProducts(options: ProductsFilterOptions) {
    const { forceShops, lastMinute, subscription, discount, lowstock } = options;
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
    else if (this.isManagerOrLogistic){
      params.skus = this.skus.slice();
      params.shopname = [];
    }else{
      params.shopname = this.userShops;
    }

    //
    // create filter string for attributes
    params.attributes = attributesFilters.filter(att => !!options[att]).join(',');

    if(options.lowstock){
      params.lowstock = true;
    }

    if(params.attributes?.length>1 || params.lowstock){
      params.skus = [];
      params.shopname = [];
    }


    //
    // get select products for vendor
    if (this.userShops.length) {
      params.shopname = this.userShops;
    }

    //
    // force reload
    params.rnd = Date.now();
    this.$product.select(params).subscribe(
      (products: Product[]) => {
        //
        // FIXME remove filter, server should clean orphan products!
        this.isReady = true;
        const sort = this.filters.lowstock ? this.sortByStock : this.sortByVendorAndStock;
        this.cache.products = products.filter(p => p.vendor).sort(sort);
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

    this.loadProducts({});
  }


  //
  // this value exclude user filters
  onSelectDefaultShop($event) {
    const shop = $event.detail.value;
    this.defaultShop = shop;
    this.loadProducts({ forceShops: [shop] });

  }

  //
  // filters are based on all shops (except for non admin users)
  onProductFilterChange(filter: string) {
    attributesFilters.forEach(att => delete this.filters[att]);
    this.filters[filter] = true;
    this.loadProducts(this.filters);
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
      .filter((product) => {
        return this.cache.active == product.attributes.available;
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

// label alphanum sort for this case "2000.10"
  sortAlphaNum(p1: Product, p2: Product) {
    const reA = /[^a-zA-Z]/g;
    const reN = /[^0-9]/g;
    const aA = p1.title.replace(reA, "");
    const bA = p2.title.replace(reA, "");
    if(aA === bA) {
      var aN = parseInt(p1.title.replace(reN, ""), 10);
      var bN = parseInt(p2.title.replace(reN, ""), 10);
      return aN === bN ? 0 : aN > bN ? 1 : -1;
    } else {
      return aA > bA ? 1 : -1;
    }
  }

  sortByStock(p1: Product, p2: Product) {
    // order by stock
    return p1.pricing.stock - p2.pricing.stock;
  }


  sortByVendorAndStock(p1: Product, p2: Product) {
    const v1 = p1.vendor?.urlpath || p1.vendor;
    const v2 = p2.vendor?.urlpath || p2.vendor;
    const vendor = v1.localeCompare(v2);
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

  // ============================================================================
  // MODE SÉLECTION MULTIPLE - Méthodes
  // ============================================================================

  /**
   * Active/désactive le mode sélection
   */
  toggleSelectionMode() {
    this.selectionMode.enabled = !this.selectionMode.enabled;
    if (!this.selectionMode.enabled) {
      // Réinitialiser les sélections quand on quitte le mode
      this.deselectAll();
    }
  }

  /**
   * Vérifie si un produit est sélectionné
   */
  isSelected(product: Product): boolean {
    return this.selectionMode.selectedProducts.has(product.sku);
  }

  /**
   * Toggle la sélection d'un produit
   */
  toggleSelection(product: Product) {
    console.log('--- toggleSelection',product);
    if (this.isSelected(product)) {
      this.selectionMode.selectedProducts.delete(product.sku);
    } else {
      this.selectionMode.selectedProducts.add(product.sku);
    }
  }

  /**
   * Retourne le nombre de produits sélectionnés
   */
  getSelectedCount(): number {
    return this.selectionMode.selectedProducts.size;
  }

  /**
   * Sélectionne tous les produits visibles
   */
  selectAll() {
    this.filteredProducts().forEach(product => {
      this.selectionMode.selectedProducts.add(product.sku);
    });
  }

  /**
   * Désélectionne tous les produits
   */
  deselectAll() {
    this.selectionMode.selectedProducts.clear();
  }

  /**
   * Vérifie si tous les produits visibles sont sélectionnés
   */
  isAllSelected(): boolean {
    const filtered = this.filteredProducts();
    if (filtered.length === 0) return false;
    return filtered.every(product => this.isSelected(product));
  }

  /**
   * Récupère les produits sélectionnés
   */
  getSelectedProducts(): Product[] {
    return this.products.filter(product => this.isSelected(product));
  }

  // ============================================================================
  // ACTIONS GROUPÉES
  // ============================================================================

  /**
   * Active tous les produits sélectionnés
   */
  async bulkActivate() {
    const selected = this.getSelectedProducts();
    if (selected.length === 0) return;

    const alert = await this.alert.create({
      header: 'Activer les produits',
      message: `Voulez-vous activer ${selected.length} produit(s) ?`,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Activer',
          handler: () => {
            this.performBulkAction(selected, 'activate');
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Désactive tous les produits sélectionnés
   */
  async bulkDeactivate() {
    const selected = this.getSelectedProducts();
    if (selected.length === 0) return;

    const alert = await this.alert.create({
      header: 'Désactiver les produits',
      message: `Voulez-vous désactiver ${selected.length} produit(s) ?`,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Désactiver',
          handler: () => {
            this.performBulkAction(selected, 'deactivate');
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Modifie le stock de tous les produits sélectionnés
   */
  async bulkUpdateStock() {
    const selected = this.getSelectedProducts();
    if (selected.length === 0) return;

    const alert = await this.alert.create({
      header: 'Modifier le stock',
      message: `Définir le stock pour ${selected.length} produit(s)`,
      inputs: [
        {
          name: 'stock',
          type: 'number',
          placeholder: 'Quantité',
          min: 0,
          value: 100
        }
      ],
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Modifier',
          handler: (data) => {
            const stockValue = parseInt(data.stock, 10);
            if (!isNaN(stockValue) && stockValue >= 0) {
              this.performBulkAction(selected, 'stock', stockValue);
            } else {
              this.onDone('Valeur de stock invalide');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Toggle l'attribut Last Minute de tous les produits sélectionnés
   */
  async bulkLastMinute() {
    const selected = this.getSelectedProducts();
    if (selected.length === 0) return;

    const alert = await this.alert.create({
      header: 'Last Minute',
      message: `Basculer l'attribut Last Minute pour ${selected.length} produit(s) ?`,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Toggle',
          handler: () => {
            this.performBulkAction(selected, 'lastminute');
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Exécute une action groupée sur les produits
   * Avec délai de 100ms entre chaque requête pour éviter la surcharge serveur
   */
  private performBulkAction(products: Product[], action: 'activate' | 'deactivate' | 'stock' | 'lastminute', value?: number) {
    let successCount = 0;
    let errorCount = 0;
    const total = products.length;

    // Fonction récursive pour traiter les produits séquentiellement
    const processNext = (index: number) => {
      if (index >= products.length) {
        // Tous les produits ont été traités
        this.onBulkActionComplete(successCount, errorCount, total, action);
        return;
      }

      const product = products[index];

      // Appliquer l'action
      switch (action) {
        case 'activate':
          product.attributes.available = true;
          break;
        case 'deactivate':
          product.attributes.available = false;
          break;
        case 'stock':
          if (value !== undefined) {
            product.pricing.stock = 100;
          }
          break;
        case 'lastminute':
          product.attributes.lastMinute = !product.attributes.lastMinute;
          break;
      }

      // Sauvegarder le produit
      this.$product.save(product).subscribe(
        () => {
          successCount++;
          // Attendre 100ms avant le prochain
          setTimeout(() => processNext(index + 1), 100);
        },
        (error) => {
          errorCount++;
          // Attendre 100ms avant le prochain même en cas d'erreur
          setTimeout(() => processNext(index + 1), 100);
        }
      );
    };

    // Démarrer le traitement
    processNext(0);
  }

  /**
   * Affiche le résultat d'une action groupée
   */
  private onBulkActionComplete(success: number, errors: number, total: number, action: string) {
    const actionLabel = action === 'activate' ? 'activés' :
                       action === 'deactivate' ? 'désactivés' :
                       action === 'lastminute' ? 'modifiés (Last Minute)' : 'modifiés';

    let message = `${success}/${total} produits ${actionLabel}`;
    if (errors > 0) {
      message += ` (${errors} erreur(s))`;
    }

    this.onDone(message);

    // Réinitialiser la sélection
    this.deselectAll();
    this.toggleSelectionMode();
  }

}
