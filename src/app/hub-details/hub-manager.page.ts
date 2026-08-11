import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Category, Hub, HubService, LoaderService, Shop, ShopService } from 'kng2-core';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'kio-hub-manager',
  templateUrl: './hub-manager.page.html',
  styleUrls: ['./hub-details.page.scss'],
})
export class HubManagerPage implements OnInit {
  currentHub: Hub;
  categories: Category[] = [];
  shops: Shop[] = [];
  isReady = false;
  isLoading = false;
  newManager = '';
  newLogistic = '';
  newVendor = '';
  newCategory = '';

  constructor(
    private $route: ActivatedRoute,
    private $hub: HubService,
    private $shops: ShopService,
    private $loader: LoaderService,
    private $toast: ToastController
  ) {}

  //
  // Loads the HUB and the selectable vendors and categories.
  ngOnInit() {
    const { categories } = this.$loader.getLatestCoreData();
    this.categories = categories || [];

    this.$shops.query().subscribe(shops => {
      this.shops = shops || [];
    });

    this.$hub.get(this.$route.snapshot.params['hub']).subscribe(hub => {
      this.currentHub = hub;
      this.initHub();
      this.isReady = true;
    }, status => {
      this.isReady = true;
      this.notify((status.error || status.message || status), 'danger');
    });
  }

  //
  // Returns to the HUB list or details page.
  doBack() {
    window.history.back();
  }

  //
  // Persists the management-only HUB fields through saveManager().
  onHubManagerSave() {
    this.isLoading = true;
    this.$hub.saveManager(this.currentHub).subscribe(hub => {
      Object.assign(this.currentHub, hub);
      this.initHub();
      this.notify('Gestion du hub enregistrée');
    }, status => {
      this.isLoading = false;
      this.notify((status.error || status.message || status), 'danger');
    }, () => {
      this.isLoading = false;
    });
  }

  //
  // Adds an empty delivery closure for the manager to complete.
  addNoShipping() {
    this.currentHub.noshipping.push({
      reason: {fr: '', en: '', de: ''},
      from: null as any,
      to: null as any
    });
  }

  //
  // Adds the entered email to the HUB managers.
  addManager() {
    this.addContact('manager', this.newManager);
    this.newManager = '';
  }

  //
  // Adds the entered email to the HUB logistics contacts.
  addLogistic() {
    this.addContact('logistic', this.newLogistic);
    this.newLogistic = '';
  }

  //
  // Removes a manager from the HUB.
  removeManager(index: number) {
    this.currentHub.manager.splice(index, 1);
  }

  //
  // Removes a logistics contact from the HUB.
  removeLogistic(index: number) {
    this.currentHub.logistic.splice(index, 1);
  }

  //
  // Adds the selected vendor when it is not already assigned to the HUB.
  addVendor() {
    if(!this.newVendor || this.currentHub.vendors.some(vendor => this.getId(vendor) === this.newVendor)) {
      return;
    }

    this.currentHub.vendors.push(this.newVendor);
    this.newVendor = '';
  }

  //
  // Removes a vendor and its associated constrained catalogue rule.
  removeVendor(index: number) {
    const vendorId = this.getId(this.currentHub.vendors[index]);
    this.currentHub.vendors.splice(index, 1);
    this.currentHub.vendorAssortments = this.currentHub.vendorAssortments.filter(assortment => (
      this.getId(assortment.vendor) !== vendorId
    ));
  }

  //
  // Adds the selected category when it is not already assigned to the HUB.
  addCategory() {
    if(!this.newCategory || this.currentHub.categories.some(category => this.getId(category) === this.newCategory)) {
      return;
    }

    this.currentHub.categories.push(this.newCategory);
    this.newCategory = '';
  }

  //
  // Removes a category from the HUB.
  removeCategory(index: number) {
    this.currentHub.categories.splice(index, 1);
  }

  //
  // Lists unassigned vendors in French alphanumeric order for the selector.
  getAvailableVendors(): Shop[] {
    return this.shops
      .filter(shop => !this.currentHub.vendors.some(vendor => (
        this.getId(vendor) === this.getId(shop)
      )))
      .sort((left, right) => {
        if(this.isActiveVendor(left) !== this.isActiveVendor(right)) {
          return this.isActiveVendor(left) ? -1 : 1;
        }
        return left.name.localeCompare(right.name, 'fr', {numeric: true});
      });
  }

  //
  // Resolves a vendor identifier to its display name.
  getVendorLabel(vendor: any): string {
    const vendorId = this.getId(vendor);
    const shop = this.shops.find(candidate => this.getId(candidate) === vendorId);
    return shop ? shop.name +
      (this.isActiveVendor(shop) ? '' : ' (fermé)') : vendorId;
  }

  //
  // Resolves a category identifier to its display name.
  getCategoryLabel(category: any): string {
    const categoryId = this.getId(category);
    const current = this.categories.find(candidate => this.getId(candidate) === categoryId);
    return current ? current.name : categoryId;
  }

  //
  // Reports whether a vendor requires explicit product constraints in this HUB.
  isVendorConstrained(vendor: any): boolean {
    const vendorId = this.getId(vendor);
    return this.currentHub.vendorAssortments.some(assortment => (
      this.getId(assortment.vendor) === vendorId &&
      assortment.mode === 'constrained'
    ));
  }

  //
  // Enables or removes the constrained catalogue rule for a vendor.
  onVendorAssortmentChange(vendor: any, event: any) {
    const vendorId = this.getId(vendor);
    const assortments = this.currentHub.vendorAssortments.filter(assortment => (
      this.getId(assortment.vendor) !== vendorId
    ));

    if(event.detail.checked) {
      assortments.push({vendor: vendorId, mode: 'constrained'});
    }

    this.currentHub.vendorAssortments = assortments;
  }

  //
  // Initializes optional manager fields used by the page.
  private initHub() {
    this.currentHub.manager = this.currentHub.manager || [];
    this.currentHub.logistic = this.currentHub.logistic || [];
    this.currentHub.vendors = this.currentHub.vendors || [];
    this.currentHub.categories = this.currentHub.categories || [];
    this.currentHub.noshipping = this.currentHub.noshipping || [];
    this.currentHub.vendorAssortments = this.currentHub.vendorAssortments || [];
  }

  //
  // Adds a unique email address to a manager or logistics contact list.
  private addContact(field: 'manager' | 'logistic', email: string) {
    const value = (email || '').trim();
    if(!value || this.currentHub[field].indexOf(value) !== -1) {
      return;
    }

    this.currentHub[field].push(value);
  }

  //
  // Normalizes an object or identifier to a string identifier.
  private getId(value: any): string {
    return String(value && (value._id || value));
  }

  //
  // Identifies shops that are currently active in the marketplace.
  private isActiveVendor(vendor: Shop): boolean {
    return vendor.status === true;
  }

  //
  // Shows a transient message to the administrator.
  private notify(message: string, color = 'dark') {
    this.$toast.create({
      message,
      duration: 3000,
      color
    }).then(alert => alert.present());
  }
}
