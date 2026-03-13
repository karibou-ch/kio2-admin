import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  CalendarService,
  CartItem,
  CartMode,
  CartService,
  Config,
  LoaderService,
  OrderService,
  Product,
  ProductService,
  ShippingAddress,
  User,
  UserCard,
  UserService
} from 'kng2-core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'kio-orders-create',
  templateUrl: './order-create.page.html',
  styleUrls: ['./order-create.page.scss'],
})
export class OrderCreatePage implements OnInit, OnDestroy {

  isReady = false;
  isSaving = false;
  config: Config;
  user: User;

  productQuery = '';
  productSuggestions: any[] = [];
  productLoading = false;
  private productSearch$ = new Subject<string>();

  userQuery = '';
  userSuggestions: User[] = [];
  userLoading = false;
  userSearchError = '';
  selectedUser: User | null = null;
  selectedAddress: any | null = null;
  selectedPayment: UserCard | null = null;
  private userSearch$ = new Subject<string>();

  hubs: any[] = [];
  selectedHub: any;

  form = {
    when: '',
    hours: 16,
    useInvoice: false,
    note: ''
  };

  private destroy$ = new Subject<void>();

  constructor(
    private $route: ActivatedRoute,
    private $router: Router,
    private $cart: CartService,
    private $order: OrderService,
    private $product: ProductService,
    private $user: UserService,
    private $calendar: CalendarService,
    private $loader: LoaderService,
    private toast: ToastController
  ) {}

  ngOnInit() {
    const { config, user } = this.$loader.getLatestCoreData();
    this.user = user;
    this.config = config;

    this.hubs = (this.config.shared.hubs || []).slice();
    this.selectedHub = this.hubs[0];
    if (this.user.hubs && this.user.hubs.length === 1) {
      this.selectedHub = this.hubs.find(h => h.slug === this.user.hubs[0]) || this.selectedHub;
    }

    this.initializeHubContext(true);

    this.productSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(q => this.fetchProductSuggestions(q));

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

  get currentHubSlug(): string {
    return Array.isArray(this.selectedHub?.slug) ? this.selectedHub.slug[0] : this.selectedHub?.slug;
  }

  get currentCartItems(): CartItem[] {
    if (!this.currentHubSlug) {
      return [];
    }
    return this.$cart.getItems({ hub: this.currentHubSlug }).filter(item => !item.frequency);
  }

  get clientAddresses(): any[] {
    return (this.selectedUser as any)?.addresses || [];
  }

  get paymentMethods(): UserCard[] {
    return (((this.selectedUser as any)?.payments) || []).map(payment => new UserCard(payment));
  }

  get shippingTimeOptions(): { label: string; value: number }[] {
    const shippingtimes = this.selectedHub?.shippingtimes || {};
    const keys = Object.keys(shippingtimes);
    if (!keys.length) {
      return [{ label: '16h', value: 16 }];
    }
    return keys.map(key => ({
      value: Number(key),
      label: shippingtimes[key] || `${key}h`
    }));
  }

  get selectedDeliveryDate(): Date | null {
    if (!this.form.when) {
      return null;
    }
    const date = new Date(`${this.form.when}T12:00:00`);
    return isNaN(date.getTime()) ? null : date;
  }

  get orderSubtotal(): { products: number; fees: number; discount: number; delivery: number; total: number } | null {
    if (!this.currentCartItems.length || !this.selectedAddress || !this.currentHubSlug) {
      return null;
    }

    const round = (value: number) => Math.round(value * 100) / 100;
    const products = round(this.currentCartItems.reduce((sum, item) => {
      return sum + round((item.price || 0) * (item.quantity || 0));
    }, 0));

    const serviceFees = Number(this.selectedHub?.serviceFees ?? this.config?.shared?.hub?.serviceFees ?? 0);
    const gateways: any[] = this.config?.shared?.order?.gateway || [];
    const gatewayLabel = this.form.useInvoice ? 'invoice' : this.selectedPayment?.issuer;
    const gatewayFees = Number((gateways.find((gateway: any) => gateway.label === gatewayLabel))?.fees || 0);
    const fees = round((serviceFees + gatewayFees) * products);
    const discount = round(this.$cart.getTotalDiscount(this.currentHubSlug) || 0);
    const delivery = round(this.$cart.computeShippingFees({
      hub: this.currentHubSlug,
      address: this.selectedAddress
    }) || 0);
    const total = round(products + fees + delivery - discount);

    return { products, fees, discount, delivery, total };
  }

  get canCreate(): boolean {
    return !!(
      this.selectedUser &&
      this.selectedHub &&
      this.selectedAddress &&
      this.selectedDeliveryDate &&
      this.currentCartItems.length &&
      (this.form.useInvoice || this.selectedPayment)
    );
  }

  onProductQueryChange() {
    if (this.productQuery.length >= 2) {
      this.productSearch$.next(this.productQuery);
    } else {
      this.productSuggestions = [];
    }
  }

  private fetchProductSuggestions(query: string) {
    this.productLoading = true;
    this.$product.autocomplete(query).subscribe({
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
    this.productLoading = true;
    this.$product.get(sku).subscribe({
      next: (product: Product) => {
        this.productLoading = false;
        this.productQuery = '';
        this.productSuggestions = [];
        const cartItem = CartItem.fromProduct(product, this.currentHubSlug);
        this.$cart.add(cartItem);
      },
      error: () => {
        this.productLoading = false;
      }
    });
  }

  addQuantity(item: CartItem) {
    this.$cart.add(item);
  }

  removeQuantity(item: CartItem) {
    this.$cart.remove(item);
  }

  removeItem(item: CartItem) {
    this.$cart.removeAll(item);
  }

  onUserQueryChange() {
    this.selectedUser = null;
    this.selectedAddress = null;
    this.selectedPayment = null;
    this.userSearchError = '';
    if (this.userQuery.length >= 3) {
      this.userSearch$.next(this.userQuery);
    } else {
      this.userSuggestions = [];
    }
  }

  private fetchUserSuggestions(query: string) {
    this.userLoading = true;
    this.$user.query({ search: query }).subscribe({
      next: (users) => {
        this.userLoading = false;
        this.userSuggestions = users || [];
        this.userSearchError = users?.length ? '' : 'Aucun résultat.';
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
    this.selectedAddress = addresses.find((address: any) => address.primary) || addresses[0] || null;
    this.form.note = this.selectedAddress?.note || '';
    if (this.selectedAddress) {
      this.$cart.setShippingAddress(this.selectedAddress);
    }

    this.selectedPayment = this.getDefaultPaymentMethod();
    if (this.selectedPayment && !this.form.useInvoice) {
      this.$cart.setPaymentMethod(this.selectedPayment);
    }

    this.syncShippingSelection();
  }

  onHubChange(hub: any) {
    this.selectedHub = hub;
    this.initializeHubContext(true);
    if (this.selectedAddress) {
      this.$cart.setShippingAddress(this.selectedAddress);
    }
    if (this.selectedPayment && !this.form.useInvoice) {
      this.$cart.setPaymentMethod(this.selectedPayment);
    }
  }

  onAddressChange(address: any) {
    this.selectedAddress = address;
    this.form.note = address?.note || '';
    this.$cart.setShippingAddress(address);
    this.syncShippingSelection();
  }

  onDeliveryDateChange(value: string) {
    this.form.when = value;
    this.syncShippingSelection();
  }

  onDeliveryHoursChange(value: number) {
    this.form.hours = Number(value);
    this.syncShippingSelection();
  }

  onPaymentChange(payment: UserCard) {
    this.selectedPayment = payment ? new UserCard(payment) : null;
    if (this.selectedPayment) {
      this.$cart.setPaymentMethod(this.selectedPayment);
    }
  }

  onInvoiceChange() {
    if (!this.form.useInvoice && this.selectedPayment) {
      this.$cart.setPaymentMethod(this.selectedPayment);
    }
  }

  compareHubs(a: any, b: any): boolean {
    return !!(a && b && (a.slug?.[0] || a.slug) === (b.slug?.[0] || b.slug));
  }

  compareAddresses(a: any, b: any): boolean {
    return !!(a && b && a.streetAdress === b.streetAdress && a.postalCode === b.postalCode);
  }

  comparePayments(a: UserCard, b: UserCard): boolean {
    return !!(a && b && a.alias === b.alias);
  }

  paymentLabel(payment: UserCard | null): string {
    if (!payment) {
      return '';
    }
    const label = payment.name || payment.issuer || 'Carte';
    const suffix = payment.number || payment.last4 ? ` • ${payment.number || payment.last4}` : '';
    return `${label}${suffix}`;
  }

  onCreate() {
    if (!this.canCreate || this.isSaving) {
      return;
    }

    const shippingDay = this.selectedDeliveryDate;
    if (!shippingDay) {
      return;
    }

    this.isSaving = true;
    this.$cart.clearErrors();

    const shipping = new ShippingAddress(this.selectedAddress, shippingDay, this.form.hours);
    shipping.note = this.form.note || shipping.note;

    const payment = this.form.useInvoice
      ? { issuer: 'invoice', alias: 'invoice' }
      : {
          alias: this.selectedPayment!.alias,
          issuer: this.selectedPayment!.issuer,
          name: this.selectedPayment!.name,
          number: this.selectedPayment!.number || this.selectedPayment!.last4
        };

    const items = this.currentCartItems.map(item => item.toDEPRECATED());
    const hubSlug = this.currentHubSlug;

    this.$order.create(
      hubSlug,
      shipping,
      items,
      payment,
      this.selectedUser!.id
    ).subscribe({
      next: async (order: any) => {
        this.isSaving = false;
        if (order?.errors) {
          this.$cart.setError(order.errors, hubSlug);
          await this.showToast('La commande contient des produits à corriger.', 'danger');
          return;
        }
        this.$cart.clearAfterOrder(hubSlug, order);
        await this.showToast('Commande créée avec succès', 'success');
        this.$router.navigate(['..'], {
          relativeTo: this.$route,
          queryParams: { when: shippingDay.getTime() }
        });
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

  private initializeHubContext(clearItems: boolean) {
    if (!this.selectedHub || !this.config) {
      return;
    }

    (this.config.shared as any).hub = this.selectedHub;
    this.$cart.setContext(this.config, this.user, [], [], CartMode.ADMIN);

    if (clearItems) {
      this.resetCartItems();
    }

    this.setDefaultShippingSelection();
  }

  private setDefaultShippingSelection() {
    const nextShippingDay = this.$calendar.nextShippingDay(this.selectedHub);
    if (!nextShippingDay) {
      return;
    }
    this.form.when = nextShippingDay.toYYYYMMDD('-');
    this.form.hours = this.$calendar.getDefaultTimeByDay(nextShippingDay, this.selectedHub);
    this.syncShippingSelection();
  }

  private syncShippingSelection() {
    if (!this.selectedDeliveryDate) {
      return;
    }
    this.$cart.setShippingDay(this.selectedDeliveryDate, this.form.hours);
  }

  private resetCartItems() {
    this.currentCartItems.slice().forEach(item => this.$cart.removeAll(item));
  }

  private getDefaultPaymentMethod(): UserCard | null {
    const methods = this.paymentMethods;
    return methods.find(method => method.default) || methods[0] || null;
  }

  private async showToast(message: string, color = 'primary') {
    const t = await this.toast.create({ message, duration: 3000, color });
    await t.present();
  }
}
