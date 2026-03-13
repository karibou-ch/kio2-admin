import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  Config, User, Product,
  CartService, CartSubscriptionData, CartMode, CartItem, CartItemFrequency, CartItemsContext,
  LoaderService, ProductService, UserService, CalendarService
} from 'kng2-core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { EngineService } from '../services/engine.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'kio-subscriptions-create',
  templateUrl: './subscriptions-create.page.html',
  styleUrls: ['./subscriptions-create.page.scss'],
})
export class SubscriptionsCreatePage implements OnInit, OnDestroy {

  isReady = false;
  isSaving = false;
  config: Config;
  user: User;

  //
  // product autocomplete
  productQuery = '';
  productSuggestions: any[] = [];
  productLoading = false;
  selectedProduct: Product | null = null;
  private productSearch$ = new Subject<string>();

  //
  // client search
  userQuery = '';
  userSuggestions: User[] = [];
  userLoading = false;
  userSearchError = '';
  selectedUser: User | null = null;
  selectedAddress: any | null = null;
  private userSearch$ = new Subject<string>();

  weekdays: string[];
  hubs: any[];
  selectedHub: any;

  form = {
    dayOfWeek: 1,
    hours: 16,              // delivery time slot (16 = default)
    frequency: 'week',
    startDate: '',          // ISO date string, empty = 'now'
    useInvoice: false,
    deliveryPrice: null as number | null,
    note: ''
  };

  private destroy$ = new Subject<void>();
  private _deliveryPriceManuallySet = false;

  constructor(
    private $route: ActivatedRoute,
    private $router: Router,
    private $engine: EngineService,
    private $cart: CartService,
    private $product: ProductService,
    private $user: UserService,
    private toast: ToastController,
    private $calendar: CalendarService,
    private $loader: LoaderService
  ) {}

  ngOnInit() {
    const { config, user } = this.$loader.getLatestCoreData();
    this.user = user;
    this.config = config;

    this.weekdays = this.$calendar.i18n_weekdays('fr');
    this.hubs = (this.config.shared.hubs || []).slice();
    this.selectedHub = this.hubs[0];
    if (this.user.hubs && this.user.hubs.length === 1) {
      this.selectedHub = this.hubs.find(h => h.slug === this.user.hubs[0]) || this.selectedHub;
    }

    // Isolated admin cart — uses 'kng2-admin-cart' localStorage key
    // setContext requires config.shared.hub (single hub object) — provide selectedHub
    if (this.selectedHub) {
      (config.shared as any).hub = this.selectedHub;
      this.$cart.setContext(config, user, [], [], CartMode.ADMIN);
    }

    //
    // Product autocomplete debounce
    this.productSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(q => this.fetchProductSuggestions(q));

    //
    // User search debounce
    this.userSearch$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(q => this.fetchUserSuggestions(q));

    this.isReady = true;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  //
  // ─── PRODUCT ─────────────────────────────────────────────────────────────────

  onProductQueryChange() {
    this.selectedProduct = null;
    if (this.productQuery.length >= 2) {
      this.productSearch$.next(this.productQuery);
    } else {
      this.productSuggestions = [];
    }
  }

  private fetchProductSuggestions(q: string) {
    this.productLoading = true;
    this.$product.autocomplete(q).subscribe({
      next: (results) => {
        this.productLoading = false;
        this.productSuggestions = results || [];
      },
      error: () => {
        this.productLoading = false;
        this.productSuggestions = [];
      }
    });
  }

  onSelectProductSuggestion(item: any) {
    const sku = item.sku || item;
    this.productQuery = item.title || String(sku);
    this.productSuggestions = [];
    this.productLoading = true;
    this.$product.get(sku).subscribe({
      next: (product) => {
        this.productLoading = false;
        this.selectedProduct = product;
        // Add to admin cart so CartService.subTotal() / total() are correct
        const hubSlug = Array.isArray(this.selectedHub?.slug) ? this.selectedHub.slug[0] : this.selectedHub?.slug;
        const cartItem = CartItem.fromProduct(product, hubSlug);
        cartItem.frequency = this.form.frequency as CartItemFrequency;
        this.$cart.add(cartItem);
      },
      error: () => {
        this.productLoading = false;
      }
    });
  }

  get productBundleItems(): any[] {
    return (this.selectedProduct as any)?.bundle || [];
  }

  //
  // ─── CLIENT ──────────────────────────────────────────────────────────────────

  onUserQueryChange() {
    this.selectedUser = null;
    this.selectedAddress = null;
    this.userSearchError = '';
    if (this.userQuery.length >= 3) {
      this.userSearch$.next(this.userQuery);
    } else {
      this.userSuggestions = [];
    }
  }

  private fetchUserSuggestions(q: string) {
    this.userLoading = true;
    this.$user.query({ search: q }).subscribe({
      next: (users) => {
        this.userLoading = false;
        this.userSuggestions = users || [];
        if (!users || users.length === 0) {
          this.userSearchError = 'Aucun résultat.';
        } else {
          this.userSearchError = '';
        }
      },
      error: () => {
        this.userLoading = false;
        this.userSearchError = 'Erreur lors de la recherche.';
      }
    });
  }

  onSelectUser(user: User) {
    this.selectedUser = user;
    this.userQuery = (user as any).email?.address || (user as any).displayName || '';
    this.userSuggestions = [];
    const addresses = (user as any).addresses || [];
    this.selectedAddress = addresses.find((a: any) => a.primary) || addresses[0] || null;
    // Set payment method for gateway fees calculation
    const defaultCard = (user as any).payments?.find((p: any) => p.default) || (user as any).payments?.[0];
    if (defaultCard) {
      this.$cart.setPaymentMethod(defaultCard);
    }
    // Reset manual flag and recompute default delivery price
    this._deliveryPriceManuallySet = false;
    this.form.note = this.selectedAddress?.note || '';
    if (this.selectedAddress) {
      this.$cart.setShippingAddress(this.selectedAddress);
    }
    this.computeDefaultDeliveryPrice(this.selectedAddress);
  }

  onHubChange(hub: any) {
    this.selectedHub = hub;
    if (hub && this.config) {
      (this.config.shared as any).hub = hub;
      this.$cart.setContext(this.config, this.user, [], [], CartMode.ADMIN);
    }
  }

  onAddressChange(address: any) {
    this.selectedAddress = address;
    this.form.note = address?.note || '';
    this.$cart.setShippingAddress(address);
    if (!this._deliveryPriceManuallySet) {
      this.computeDefaultDeliveryPrice(address);
    }
  }

  onDeliveryPriceChange(value: any) {
    this._deliveryPriceManuallySet = true;
  }

  private computeDefaultDeliveryPrice(address?: any) {
    const user = this.selectedUser as any;
    // 1. User plan overrides everything
    if (user?.plan?.defaultShipping >= 0) {
      this.form.deliveryPrice = user.plan.defaultShipping;
      return;
    }
    // 2. Calculate from address postalCode
    const postalCode = address?.postalCode;
    if (postalCode && this.config?.shared?.shipping) {
      const district = this.config.getShippingDistrict(postalCode);
      const price = this.config.shared.shipping.price?.[district];
      if (price != null) {
        this.form.deliveryPrice = price;
        return;
      }
    }
    // 3. No default available
    this.form.deliveryPrice = null;
  }

  get clientAddresses(): any[] {
    return (this.selectedUser as any)?.addresses || [];
  }

  //
  // ─── WEEKDAY OPTIONS ─────────────────────────────────────────────────────────
  // Admin subscription creation always allows Monday to Saturday,
  // regardless of hub.weekdays. noshipping still applies later.

  get weekdayOptions(): { label: string; value: number }[] {
    const days = [1, 2, 3, 4, 5, 6];
    return days.map((day: number) => ({
      label: this.weekdays[day] || day.toString(),
      value: day
    }));
  }

  get shippingTimeOptions(): { label: string; value: number }[] {
    const pricetime = this.config?.shared?.shipping?.pricetime || {};
    const shippingtimes = this.selectedHub?.shippingtimes || {};
    return Object.keys(pricetime).map(key => ({
      value: Number(key),
      label: shippingtimes[key] || key + 'h'
    }));
  }

  //
  // ─── FORM ────────────────────────────────────────────────────────────────────

  get orderSubtotal(): { products: number; fees: number; delivery: number; total: number } | null {
    if (!this.selectedProduct || !this.selectedAddress) { return null; }
    // Same rounding as round1cts (karibou-wallet) and Utils.roundAmount (kng2-core):
    // apply Math.round(v*100)/100 at each intermediate step to prevent float error propagation
    const r = (v: number) => Math.round(v * 100) / 100;

    const rawPrice = r((this.selectedProduct as any).pricing?.price || 0);

    // Fees: pick the right gateway from config.shared.order.gateway by label
    const serviceFees: number = this.config?.shared.hub?.serviceFees || 0;
    const gateways: any[] = this.config?.shared.order.gateway || [];
    const label = this.form.useInvoice ? 'invoice' : 'visa';
    const gatewayFees: number = (gateways.find((g: any) => g.label === label))?.fees || 0;
    const fees    = r((serviceFees + gatewayFees) * rawPrice);

    // Delivery: always use the admin-chosen value (form.deliveryPrice)
    const delivery = r(this.form.deliveryPrice ?? 0);
    const total    = r(rawPrice + fees + delivery);
    return { products: rawPrice, fees, delivery, total };
  }

  get firstDeliveryDate(): Date | null {
    if (this.form.dayOfWeek == null) { return null; }
    // Proxy through CalendarService — no raw Date arithmetic in components.
    // Admin page always accepts Monday to Saturday independently from hub.weekdays.
    // noshipping (holidays) still applies.
    const startDate = this.deliveryValidationStartDate;
    return this.$calendar.firstDeliveryDate(
      this.form.dayOfWeek, startDate, this.selectedHub,
      { acceptAllWeekdays: true }
    );
  }

  get canCreate(): boolean {
    return !!(this.selectedProduct && this.selectedUser && this.selectedHub && this.selectedAddress);
  }

  compareHubs(a: any, b: any): boolean {
    return a && b && (a.slug?.[0] || a.slug) === (b.slug?.[0] || b.slug);
  }

  compareAddresses(a: any, b: any): boolean {
    return a && b && a.streetAdress === b.streetAdress && a.postalCode === b.postalCode;
  }

  onCreate() {
    if (!this.canCreate || this.isSaving) {
      return;
    }
    this.isSaving = true;

    const items = this.buildItems();
    const payment = this.form.useInvoice ? 'invoice' : undefined;

    const hubSlug = Array.isArray(this.selectedHub.slug) ? this.selectedHub.slug[0] : this.selectedHub.slug;
    const startDate = this.effectiveStartDate;
    const params: CartSubscriptionData = {
      dayOfWeek: this.form.dayOfWeek,
      frequency: this.form.frequency,
      items,
      shipping: this.buildShipping(),
      payment,
      hub: hubSlug,
      customer: String(this.selectedUser!.id),
      // Optional future start date → Stripe billing_cycle_anchor (trial period = no charge until then)
      ...(startDate ? { startDate: startDate } : {})
    };
    this.$cart.subscriptionCreate(params).subscribe({
      next: async (sub) => {
        this.isSaving = false;
        if ((sub as any).errors) {
          await this.showToast('Erreur : ' + JSON.stringify((sub as any).errors), 'danger');
          return;
        }
        this.$cart.clearAfterOrder(hubSlug, null, sub);
        await this.showToast('Contrat créé avec succès', 'success');
        this.$router.navigate(['..'], { relativeTo: this.$route });
      },
      error: async (err) => {
        this.isSaving = false;
        await this.showToast('Erreur : ' + (err.error || err.message || 'inconnue'), 'danger');
      }
    });
  }

  onCancel() {
    this.$router.navigate(['..'], { relativeTo: this.$route });
  }

  private buildItems(): any[] {
    const product = this.selectedProduct!;
    const baseItem: any = {
      sku: product.sku,
      title: product.title,
      quantity: 1,
      price: product.pricing.price,
      finalprice: product.pricing.price,
      hub: Array.isArray(this.selectedHub.slug) ? this.selectedHub.slug[0] : this.selectedHub.slug,
      frequency: this.form.frequency,
      active: true,
      vendor: (product as any).vendor?.urlpath || (product as any).vendor,
      part: product.pricing.part || ''
    };
    if (this.form.deliveryPrice !== null) {
      baseItem.deliveryPrice = this.form.deliveryPrice;
    }
    if (this.effectiveStartDate) {
      baseItem.startDate = this.effectiveStartDate;
    }
    return [baseItem];
  }

  private get effectiveStartDate(): Date | undefined {
    if (!this.form.startDate) {
      return undefined;
    }

    const parsed = new Date(this.form.startDate);
    if (isNaN(parsed.getTime())) {
      return undefined;
    }

    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);

    const parsedUTC = new Date(parsed);
    parsedUTC.setUTCHours(0, 0, 0, 0);

    if (parsedUTC.getTime() <= todayUTC.getTime()) {
      return undefined;
    }

    return parsed;
  }

  private get deliveryValidationStartDate(): Date | undefined {
    const startDate = this.effectiveStartDate;
    if (!startDate) {
      return undefined;
    }
    const nextDay = new Date(startDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    return nextDay;
  }

  private buildShipping(): any {
    const addr = this.selectedAddress;
    const when = this.firstDeliveryDate;
    return {
      name: addr.name || (this.selectedUser as any)?.displayName || '',
      streetAdress: addr.streetAdress || '',
      postalCode: addr.postalCode || '',
      region: addr.region || 'ge',
      floor: addr.floor || '',
      note: this.form.note || addr.note || '',
      geo: addr.geo || { lat: 0, lng: 0 },
      when: when || undefined,
      hours: this.form.hours,
      // Admin-chosen delivery price — takes precedence over server-side calculation
      price: this.form.deliveryPrice ?? 0
    };
  }

  private async showToast(message: string, color = 'primary') {
    const t = await this.toast.create({ message, duration: 3000, color });
    await t.present();
  }
}
